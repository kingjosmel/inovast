import axios from "axios";
import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/checkout";
import Branch from "@/models/Branch";
import MenuItem from "@/models/MenuItem";
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
    const session = await requireRole(["CUSTOMER", "SUPER_ADMIN", "MERCHANT_ADMIN", "RIDER"]);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required. Please sign in." }, { status: 401 });
    }

    const parsed = checkoutSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const branch = await Branch.findById(parsed.data.branchId).lean();

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    // Clean up menuItemIds in case client stored combined keys
    const rawItems = parsed.data.items;
    const cleanItemIds = rawItems.map((item) => {
      const idStr = item.menuItemId.toString();
      return idStr.includes("-") ? idStr.split("-")[0] : idStr;
    });

    const menuItems = await MenuItem.find({
      _id: { $in: cleanItemIds },
    }).lean();
    const menuItemsById = new Map(menuItems.map((item) => [item._id.toString(), item]));

    const orderItems = rawItems.map((item) => {
      const cleanId = item.menuItemId.toString().split("-")[0];
      const menuItem = menuItemsById.get(cleanId);

      const effectiveUnitPrice = item.unitPrice > 0 ? item.unitPrice : menuItem?.price || 1000;
      const optionsLabels = item.selectedOptions?.map((opt) => `${opt.groupName}: ${opt.optionName}`) || [];

      return {
        menuItemId: menuItem ? menuItem._id : cleanId,
        title: item.title || menuItem?.title || "Menu Item",
        quantity: item.quantity,
        unitPrice: effectiveUnitPrice,
        optionsSelected: optionsLabels,
      };
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Calculate delivery and service fee
    const deliveryFee = branch.baseDeliveryFee || 500;
    const serviceFee = Math.round(subtotal * 0.05) || 200;
    const totalAmount = subtotal + deliveryFee + serviceFee;
    const orderNumber = generateOrderNumber();
    const paystackReference = `FG-PAY-${Date.now()}-${randomInt(1000, 9999)}`;

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
      paystackReference,
      deliveryAddress: {
        addressLine: parsed.data.deliveryAddress.addressLine,
        city: parsed.data.deliveryAddress.city || branch.city,
        area: parsed.data.deliveryAddress.area || branch.area,
        landmark: parsed.data.deliveryAddress.landmark || "",
        phone: parsed.data.deliveryAddress.phone || "",
        deliveryInstructions:
          parsed.data.deliveryAddress.deliveryInstructions ||
          parsed.data.deliveryAddress.notes ||
          "",
        coordinates: branch.location.coordinates,
      },
    });

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    let authorizationUrl: string | undefined;

    if (paystackSecretKey && paystackSecretKey !== "sk_test_mock") {
      try {
        const callbackUrl = `${process.env.NEXTAUTH_URL ?? new URL(request.url).origin}/orders/${order._id.toString()}/track`;
        const paystackResponse = await axios.post<PaystackInitializeResponse>(
          "https://api.paystack.co/transaction/initialize",
          {
            email: session.user.email || "customer@foodgo.ng",
            amount: Math.round(totalAmount * 100),
            reference: paystackReference,
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
            timeout: 8_000,
          },
        );

        if (paystackResponse.data.status && paystackResponse.data.data) {
          authorizationUrl = paystackResponse.data.data.authorization_url;
        }
      } catch (err) {
        console.warn("Paystack initialize fallback to client inline modal", err);
      }
    }

    const paystackPublicKey =
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
      process.env.PAYSTACK_PUBLIC_KEY ||
      "pk_test_demo_foodgo_key_12345";

    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      orderNumber,
      reference: paystackReference,
      amount: totalAmount,
      currency: "NGN",
      email: session.user.email || "customer@foodgo.ng",
      paystackPublicKey,
      checkoutUrl: authorizationUrl,
    });
  } catch (error) {
    console.error("Checkout failed", error);
    const message = error instanceof Error ? error.message : "Unable to create order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}