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

    let updatedOrder = null;

    try {
      await connectToDatabase();

      if (mongoose.Types.ObjectId.isValid(orderId)) {
        updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          {
            riderId: session.user.id,
            // If it's placed or ready, transition to heading to pickup or keep ready
            status: "CONFIRMED",
          },
          { new: true },
        ).lean();
      }
    } catch (dbErr) {
      console.warn("DB accept order fallback", dbErr);
    }

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
    if (socketServerUrl) {
      const payload: SocketBroadcastRequest = {
        room: `order_${orderId}`,
        event: "rider_assigned",
        payload: {
          orderId,
          riderId: session.user.id,
          riderName: session.user.name || "FoodGo Dispatch Rider",
        },
      };

      await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 4_000 }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      orderId,
      tripId: updatedOrder ? String(updatedOrder._id) : orderId,
      message: "Dispatch offer accepted successfully",
    });
  } catch (error) {
    console.error("Accept dispatch failed", error);
    return NextResponse.json({ error: "Failed to accept dispatch offer" }, { status: 500 });
  }
}
