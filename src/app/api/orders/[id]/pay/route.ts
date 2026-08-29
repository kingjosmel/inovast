import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { reference } = body;

    await connectToDatabase();

    let query: Record<string, unknown> = { orderNumber: id };
    if (isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { orderNumber: id }] };
    }

    const order = await Order.findOneAndUpdate(
      query,
      {
        paymentStatus: "PAID",
        ...(reference ? { paystackReference: reference } : {}),
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Order payment confirmation failed", error);
    return NextResponse.json({ error: "Unable to confirm payment" }, { status: 500 });
  }
}
