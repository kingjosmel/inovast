import axios from "axios";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import mongoose from "mongoose";

interface SocketBroadcastRequest {
  room: string;
  event: string;
  payload: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["RIDER", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    await connectToDatabase();
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        riderId: { $exists: false },
        status: { $in: ["READY", "CONFIRMED"] },
      },
      { riderId: session.user.id, status: "CONFIRMED" },
      { new: true },
    ).lean();

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order is no longer available" }, { status: 409 });
    }

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
    if (socketServerUrl) {
      const payload: SocketBroadcastRequest = {
        room: `order_${orderId}`,
        event: "rider_assigned",
        payload: {
          orderId,
          riderId: session.user.id,
          riderName: session.user.name || "Zestora Dispatch Rider",
        },
      };

      await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 4_000 }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      orderId,
      tripId: String(updatedOrder._id),
      message: "Dispatch offer accepted successfully",
    });
  } catch (error) {
    console.error("Accept dispatch failed", error);
    return NextResponse.json({ error: "Failed to accept dispatch offer" }, { status: 500 });
  }
}
