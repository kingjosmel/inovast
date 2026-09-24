import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import "@/models/Branch";

export async function GET() {
  try {
    const session = await requireRole(["CUSTOMER"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    await connectToDatabase();
    const orders = await Order.find({ customerId: session.user.id })
      .sort({ createdAt: -1 })
      .populate("branchId", "name city area")
      .lean();

    return NextResponse.json({
      orders: orders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        itemCount: order.items.reduce(
          (total: number, item: { quantity: number }) => total + item.quantity,
          0,
        ),
        branch: order.branchId,
        createdAt: order.createdAt,
      })),
    });
  } catch (error) {
    console.error("Customer order history lookup failed", error);
    return NextResponse.json({ error: "Unable to load order history" }, { status: 500 });
  }
}