import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import "@/models/Branch";
import "@/models/User";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([
      "CUSTOMER",
      "MERCHANT_ADMIN",
      "RIDER",
      "SUPER_ADMIN",
    ]);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let orderIdentifier: Record<string, unknown> = { orderNumber: id };
    if (isValidObjectId(id)) {
      orderIdentifier = { $or: [{ _id: id }, { orderNumber: id }] };
    }

    const accessFilter =
      session.user.role === "SUPER_ADMIN"
        ? {}
        : session.user.role === "CUSTOMER"
          ? { customerId: session.user.id }
          : session.user.role === "RIDER"
            ? { riderId: session.user.id }
            : session.user.activeBranchId
              ? { branchId: session.user.activeBranchId }
              : null;

    if (!accessFilter) {
      return NextResponse.json({ error: "No active branch assigned" }, { status: 403 });
    }

    const order = await Order.findOne({ $and: [orderIdentifier, accessFilter] })
      .populate("branchId", "name city area address location phone baseDeliveryFee")
      .populate("riderId", "name email phone")
      .populate("customerId", "name email phone")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Fetch order by ID failed", error);
    return NextResponse.json({ error: "Unable to retrieve order" }, { status: 500 });
  }
}
