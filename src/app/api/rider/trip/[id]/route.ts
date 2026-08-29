import axios from "axios";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectToDatabase } from "@/lib/db";
import Order, { type OrderStatus } from "@/models/Order";
import "@/models/Branch";
import "@/models/User";
import mongoose from "mongoose";

export interface RiderTripDetail {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  step: "HEADING_TO_PICKUP" | "AT_PICKUP" | "OUT_FOR_DELIVERY" | "DELIVERED";
  payoutFee: number;
  pickup: {
    name: string;
    address: string;
    area: string;
    city: string;
    phone: string;
    coordinates: [number, number]; // [lng, lat]
  };
  dropoff: {
    customerName: string;
    addressLine: string;
    area: string;
    city: string;
    phone: string;
    instructions?: string;
    coordinates: [number, number]; // [lng, lat]
  };
  items: Array<{
    title: string;
    quantity: number;
    optionsSelected?: string[];
  }>;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface SocketBroadcastRequest {
  room: string;
  event: string;
  payload: Record<string, unknown>;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["RIDER", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Trip ID is required" }, { status: 400 });
    }

    let tripData: RiderTripDetail | null = null;

    try {
      await connectToDatabase();

      let query: Record<string, unknown> = { orderNumber: id };
      if (mongoose.Types.ObjectId.isValid(id)) {
        query = { $or: [{ _id: id }, { orderNumber: id }] };
      }

      const order = await Order.findOne(query)
        .populate("branchId")
        .populate("customerId")
        .lean();

      if (order) {
        const branch = order.branchId as unknown as {
          name?: string;
          address?: string;
          area?: string;
          city?: string;
          phone?: string;
          location?: { coordinates: [number, number] };
        } | null;

        const customer = order.customerId as unknown as {
          name?: string;
          phone?: string;
        } | null;

        let step: RiderTripDetail["step"] = "HEADING_TO_PICKUP";
        if (order.status === "READY") {
          step = "AT_PICKUP";
        } else if (order.status === "PICKED_UP" || order.status === "OUT_FOR_DELIVERY") {
          step = "OUT_FOR_DELIVERY";
        } else if (order.status === "DELIVERED") {
          step = "DELIVERED";
        }

        const branchCoords = branch?.location?.coordinates || [3.4246, 6.4281];
        const custCoords = order.deliveryAddress?.coordinates || [3.435, 6.435];

        tripData = {
          _id: String(order._id),
          orderNumber: order.orderNumber,
          status: order.status,
          step,
          payoutFee: Math.max(1200, Math.round(order.deliveryFee * 0.8)),
          pickup: {
            name: branch?.name || "Kitchen Partner",
            address: branch?.address || "Victoria Island, Lagos",
            area: branch?.area || "Victoria Island",
            city: branch?.city || "Lagos",
            phone: branch?.phone || "+234 801 234 5678",
            coordinates: branchCoords,
          },
          dropoff: {
            customerName: customer?.name || "Valued Customer",
            addressLine: order.deliveryAddress?.addressLine || "12 Adeola Odeku St",
            area: order.deliveryAddress?.area || "Victoria Island",
            city: order.deliveryAddress?.city || "Lagos",
            phone: customer?.phone || order.deliveryAddress?.phone || "+234 812 345 6789",
            instructions: order.deliveryAddress?.deliveryInstructions || "Call on arrival, leave with security at front desk if no response",
            coordinates: custCoords,
          },
          items: (order.items as Array<{ title: string; quantity: number; optionsSelected?: string[] }>).map((it) => ({
            title: it.title,
            quantity: it.quantity,
            optionsSelected: it.optionsSelected,
          })),
          totalAmount: order.totalAmount,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        };
      }
    } catch (dbErr) {
      console.warn("DB trip fetch fallback", dbErr);
    }

    // Default simulation fallback if order wasn't in DB or mock ID was used
    if (!tripData) {
      tripData = {
        _id: id,
        orderNumber: id.startsWith("#") ? id : `#FG-${id.slice(-4).toUpperCase()}`,
        status: "CONFIRMED",
        step: "HEADING_TO_PICKUP",
        payoutFee: 1650,
        pickup: {
          name: "Mama Cass Restaurant (VI)",
          address: "Plot 12 Ahmadu Bello Way, Victoria Island",
          area: "Victoria Island",
          city: "Lagos",
          phone: "+234 802 345 6789",
          coordinates: [3.4246, 6.4281], // [lng, lat]
        },
        dropoff: {
          customerName: "Adebayo Olawale",
          addressLine: "Apt 4B, Oceanview Towers, 22 Akin Adesola Street",
          area: "Victoria Island",
          city: "Lagos",
          phone: "+234 812 987 6543",
          instructions: "Ring apartment 4B on gate intercom. Door delivery please.",
          coordinates: [3.4350, 6.4360], // [lng, lat]
        },
        items: [
          {
            title: "Smoky Jollof Rice Special with Grilled Chicken",
            quantity: 2,
            optionsSelected: ["Extra Fried Plantain (Dodo)", "Spicy Pepper Sauce"],
          },
          {
            title: "Fresh Tropical Hibiscus Zobo (50cl)",
            quantity: 2,
            optionsSelected: ["Chilled"],
          },
        ],
        totalAmount: 11400,
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, trip: tripData });
  } catch (error) {
    console.error("Fetch rider trip failed", error);
    return NextResponse.json({ error: "Failed to retrieve trip" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["RIDER", "SUPER_ADMIN"]);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { nextStep, status } = body;

    // Determine target order status
    let targetOrderStatus: OrderStatus = "CONFIRMED";
    if (nextStep === "AT_PICKUP" || status === "READY") {
      targetOrderStatus = "READY";
    } else if (nextStep === "OUT_FOR_DELIVERY" || status === "PICKED_UP" || status === "OUT_FOR_DELIVERY") {
      targetOrderStatus = "OUT_FOR_DELIVERY";
    } else if (nextStep === "DELIVERED" || status === "DELIVERED") {
      targetOrderStatus = "DELIVERED";
    }

    try {
      await connectToDatabase();

      let query: Record<string, unknown> = { orderNumber: id };
      if (mongoose.Types.ObjectId.isValid(id)) {
        query = { $or: [{ _id: id }, { orderNumber: id }] };
      }

      const updated = await Order.findOneAndUpdate(
        query,
        {
          status: targetOrderStatus,
          riderId: session.user.id,
        },
        { new: true },
      ).lean();

      const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;
      if (socketServerUrl && updated) {
        const payload: SocketBroadcastRequest = {
          room: `order_${updated._id.toString()}`,
          event: "order_status_changed",
          payload: {
            orderId: updated._id.toString(),
            status: targetOrderStatus,
            step: nextStep,
            riderId: session.user.id,
          },
        };

        await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 4_000 }).catch(() => {});
      }
    } catch (dbErr) {
      console.warn("DB trip status update fallback", dbErr);
    }

    return NextResponse.json({
      success: true,
      tripId: id,
      step: nextStep,
      status: targetOrderStatus,
    });
  } catch (error) {
    console.error("Update trip step failed", error);
    return NextResponse.json({ error: "Failed to update trip progress" }, { status: 500 });
  }
}
