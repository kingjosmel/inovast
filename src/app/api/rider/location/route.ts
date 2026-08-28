import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth-guard";
import { updateRiderLocation } from "@/lib/redis";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  activeOrderId: z.string().min(1, "Active order is required"),
});

interface RiderMovedPayload {
  lat: number;
  lng: number;
}

interface SocketBroadcastRequest {
  room: string;
  event: "rider_moved";
  payload: RiderMovedPayload;
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["RIDER"]);

    if (!session?.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const parsed = locationSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid rider location" }, { status: 400 });
    }

    await updateRiderLocation(
      session.user.id,
      parsed.data.latitude,
      parsed.data.longitude,
    );

    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

    if (socketServerUrl) {
      const payload: SocketBroadcastRequest = {
        room: `order_${parsed.data.activeOrderId}`,
        event: "rider_moved",
        payload: { lat: parsed.data.latitude, lng: parsed.data.longitude },
      };

      await axios.post(`${socketServerUrl}/broadcast`, payload, { timeout: 5_000 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rider location update failed", error);
    return NextResponse.json({ error: "Unable to update rider location" }, { status: 500 });
  }
}