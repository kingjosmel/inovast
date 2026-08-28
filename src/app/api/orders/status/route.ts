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

    const parsed = orderStatusUpdateSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid order status update" }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findByIdAndUpdate(
      parsed.data.orderId,
      { status: parsed.data.status },
      { new: true },
    ).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

    if (socketServerUrl) {
      const payload: SocketBroadcastRequest = {
        room: `order_${order._id.toString()}`,
        event: "order_status_changed",
        payload: { orderId: order._id.toString(), status: order.status },
      };

      await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 5_000 });
    }

    return NextResponse.json({ success: true, orderId: order._id.toString(), status: order.status });
  } catch (error) {
    console.error("Order status update failed", error);
    return NextResponse.json({ error: "Unable to update order status" }, { status: 500 });
  }
}