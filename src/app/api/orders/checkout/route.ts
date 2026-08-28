import axios from "axios";
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/checkout";
import Branch from "@/models/Branch";
import MenuItem, {
  type ICustomizationGroup,
  type ICustomizationOption,
} from "@/models/MenuItem";
import Order from "@/models/Order";

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

function generateOrderNumber(): string {
  return `FG-${randomInt(10_000, 100_000)}`;
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["CUSTOMER"]);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const parsed = checkoutSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.json({ error: "Payment service is not configured" }, { status: 500 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(parsed.data.branchId).lean();

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const menuItemIds = parsed.data.items.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({
      _id: { $in: menuItemIds },
      branchId: parsed.data.branchId,
    }).lean();
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));

    if (menuItems.length !== new Set(menuItemIds).size) {
      return NextResponse.json(
        { error: "One or more items are unavailable at this branch" },
        { status: 400 },
      );
    }

    const orderItems = parsed.data.items.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId);

      if (!menuItem || !menuItem.inStock) {
        throw new Error(`Menu item is unavailable: ${item.title}`);
      }

      const selectedOptions = item.selectedOptions.map((selectedOption) => {
        const group = menuItem.customizationGroups.find(
          (candidate: ICustomizationGroup) => candidate.groupName === selectedOption.groupName,
        );
        const option = group?.options.find(
          (candidate: ICustomizationOption) => candidate.name === selectedOption.optionName,
        );

        if (!option) {
          throw new Error(`Invalid customization for ${menuItem.title}`);
        }

        return {
          label: `${selectedOption.groupName}: ${selectedOption.optionName}`,
          extraPrice: option.extraPrice,
        };
      });

      const effectiveUnitPrice =
        menuItem.price + selectedOptions.reduce((sum, option) => sum + option.extraPrice, 0);

      return {
        menuItemId: menuItem._id,
        title: menuItem.title,
        quantity: item.quantity,
        unitPrice: effectiveUnitPrice,
        optionsSelected: selectedOptions.map((option) => option.label),
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const deliveryFee = 0;
    const serviceFee = 0;
    const totalAmount = subtotal + deliveryFee + serviceFee;
    const orderNumber = generateOrderNumber();
    const order = await Order.create({
      orderNumber,
      customerId: session.user.id,
      branchId: branch._id,
      items: orderItems,
      subtotal,
      deliveryFee,
      serviceFee,
      totalAmount,
      status: "PLACED",
      paymentStatus: "PENDING",
      deliveryAddress: {
        ...parsed.data.deliveryAddress,
        coordinates: branch.location.coordinates,
      },
    });

    const callbackUrl = `${process.env.NEXTAUTH_URL ?? new URL(request.url).origin}/orders/${orderNumber}`;
    const paystackResponse = await axios.post<PaystackInitializeResponse>(
      "https://api.paystack.co/transaction/initialize",
      {
        email: session.user.email,
        amount: Math.round(totalAmount * 100),
        callback_url: callbackUrl,
        metadata: {
          orderId: order._id.toString(),
          orderNumber,
          branchId: branch._id.toString(),
          customerId: session.user.id,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10_000,
      },
    );

    if (!paystackResponse.data.status || !paystackResponse.data.data?.authorization_url) {
      await Order.findByIdAndDelete(order._id);
      return NextResponse.json({ error: "Unable to initialize payment" }, { status: 502 });
    }

    await Order.findByIdAndUpdate(order._id, {
      paystackReference: paystackResponse.data.data.reference,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: paystackResponse.data.data.authorization_url,
      orderId: order._id.toString(),
      orderNumber,
    });
  } catch (error) {
    console.error("Checkout failed", error);
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}