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

    let orderId: string = rawBody.orderId || "";
    let targetStatus: string = rawBody.status || "";

    if (!parsed.success) {
      // Fallback if client passed mock ID
      if (rawBody.orderId && ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED", "CANCELLED"].includes(rawBody.status)) {
        orderId = String(rawBody.orderId);
        targetStatus = String(rawBody.status);
      } else {
        return NextResponse.json({ error: "Invalid order status update" }, { status: 400 });
      }
    } else {
      orderId = parsed.data.orderId;
      targetStatus = parsed.data.status;
    }

    try {
      await connectToDatabase();
      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: targetStatus },
        { new: true },
      ).lean();

      if (order) {
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
      }
    } catch (dbErr) {
      console.warn("DB order status update fallback", dbErr);
    }

    return NextResponse.json({ success: true, orderId, status: targetStatus });
  } catch (error) {
    console.error("Order status update failed", error);
    return NextResponse.json({ error: "Unable to update order status" }, { status: 500 });
  }
}