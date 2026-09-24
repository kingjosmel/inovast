import axios from "axios";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import { orderStatusUpdateSchema } from "@/lib/validations/merchant";
import Order from "@/models/Order";

interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}

interface SocketBroadcastRequest {
  room: string;
  event: "order_status_changed";
  payload: OrderStatusChangedPayload;
}

export async function PATCH(request: Request) {
  try {
    const session = await requireRole(["MERCHANT_ADMIN", "RIDER", "SUPER_ADMIN"]);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsed = orderStatusUpdateSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order status update" }, { status: 400 });
    }

    const { orderId, status: targetStatus } = parsed.data;
    const accessFilter =
      session.user.role === "SUPER_ADMIN"
        ? {}
        : session.user.role === "RIDER"
          ? { riderId: session.user.id }
          : session.user.activeBranchId
            ? { branchId: session.user.activeBranchId }
            : null;

    if (!accessFilter) {
      return NextResponse.json({ error: "No active branch assigned" }, { status: 403 });
    }

    await connectToDatabase();
    const order = await Order.findOneAndUpdate(
      { _id: orderId, ...accessFilter },
      { status: targetStatus },
      { new: true },
    ).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
    }

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
    if (socketServerUrl) {
      const payload: SocketBroadcastRequest = {
        room: `order_${order._id.toString()}`,
        event: "order_status_changed",
        payload: { orderId: order._id.toString(), status: order.status },
      };

      await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 5_000 }).catch(() => {});
    }

    return NextResponse.json({ success: true, orderId: order._id.toString(), status: order.status });
  } catch (error) {
    console.error("Order status update failed", error);
    return NextResponse.json({ error: "Unable to update order status" }, { status: 500 });
  }
}