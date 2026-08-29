import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import "@/models/Branch";
import "@/models/User";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    let query: Record<string, unknown> = { orderNumber: id };
    if (isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { orderNumber: id }] };
    }

    const order = await Order.findOne(query)
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
