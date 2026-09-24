import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["CUSTOMER", "SUPER_ADMIN"]);
    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { reference } = body;

    if (typeof reference !== "string" || reference.trim().length === 0) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 });
    }

    await connectToDatabase();

    let query: Record<string, unknown> = { orderNumber: id };
    if (isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { orderNumber: id }] };
    }

    if (session.user.role !== "SUPER_ADMIN") {
      query = { $and: [query, { customerId: session.user.id }] };
    }

    const order = await Order.findOne(query).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paystackReference !== reference) {
      return NextResponse.json({ error: "Payment reference does not match this order" }, { status: 400 });
    }

    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, order });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: "PENDING", paystackReference: reference },
      {
        paymentStatus: "PAID",
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Payment could not be confirmed" }, { status: 409 });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Order payment confirmation failed", error);
    return NextResponse.json({ error: "Unable to confirm payment" }, { status: 500 });
  }
}
