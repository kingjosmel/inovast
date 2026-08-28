import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connectToDatabase } from "@/lib/db";
import { objectIdSchema } from "@/lib/validations/common";
import Branch from "@/models/Branch";

const MIN_FEE = 450;
const MAX_FEE = 2_500;
const SURGE_MULTIPLIER = 1;

const requestSchema = z.object({
  branchId: objectIdSchema,
  destinationCoordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

interface DistanceMatrixResponse {
  rows?: Array<{
    elements?: Array<{
      status?: string;
      distance?: { value: number };
      duration?: { value: number };
    }>;
  }>;
  status?: string;
}

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid delivery fee request" }, { status: 400 });
    }

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!mapsApiKey) {
      return NextResponse.json({ error: "Maps service is not configured" }, { status: 500 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(parsed.data.branchId).lean();

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const [branchLng, branchLat] = branch.location.coordinates;
    const mapsResponse = await axios.get<DistanceMatrixResponse>(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${branchLat},${branchLng}`,
          destinations: `${parsed.data.destinationCoordinates.lat},${parsed.data.destinationCoordinates.lng}`,
          mode: "driving",
          key: mapsApiKey,
        },
        timeout: 8_000,
      },
    );

    const element = mapsResponse.data.rows?.[0]?.elements?.[0];

    if (
      mapsResponse.data.status !== "OK" ||
      !element ||
      element.status !== "OK" ||
      !element.distance ||
      !element.duration
    ) {
      return NextResponse.json({ error: "Unable to calculate driving distance" }, { status: 502 });
    }

    const distanceKm = element.distance.value / 1_000;
    const durationMins = Math.ceil(element.duration.value / 60);
    const uncappedFee =
      (branch.baseDeliveryFee + distanceKm * branch.perKmRate) * SURGE_MULTIPLIER;
    const deliveryFee = Math.min(MAX_FEE, Math.max(MIN_FEE, Math.round(uncappedFee)));

    return NextResponse.json({ distanceKm, durationMins, deliveryFee });
  } catch (error) {
    console.error("Delivery fee calculation failed", error);
    return NextResponse.json({ error: "Unable to calculate delivery fee" }, { status: 500 });
  }
}