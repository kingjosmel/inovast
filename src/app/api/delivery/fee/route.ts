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

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1.25; // 1.25 urban road factor
}

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid delivery fee request" }, { status: 400 });
    }

    await connectToDatabase();
    const branch = await Branch.findById(parsed.data.branchId).lean();

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const [branchLng, branchLat] = branch.location.coordinates;
    const destLat = parsed.data.destinationCoordinates.lat;
    const destLng = parsed.data.destinationCoordinates.lng;

    const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    let distanceKm = calculateHaversineDistance(branchLat, branchLng, destLat, destLng);
    let durationMins = Math.max(12, Math.ceil(distanceKm * 4 + 8));

    if (mapsApiKey && mapsApiKey !== "DEMO_MAP_KEY") {
      try {
        const mapsResponse = await axios.get<DistanceMatrixResponse>(
          "https://maps.googleapis.com/maps/api/distancematrix/json",
          {
            params: {
              origins: `${branchLat},${branchLng}`,
              destinations: `${destLat},${destLng}`,
              mode: "driving",
              key: mapsApiKey,
            },
            timeout: 5_000,
          },
        );

        const element = mapsResponse.data.rows?.[0]?.elements?.[0];
        if (element?.status === "OK" && element.distance?.value && element.duration?.value) {
          distanceKm = element.distance.value / 1_000;
          durationMins = Math.ceil(element.duration.value / 60);
        }
      } catch (err) {
        console.warn("Maps DistanceMatrix fallback to Haversine calculation", err);
      }
    }

    const baseFee = branch.baseDeliveryFee || 500;
    const perKm = branch.perKmRate || 150;
    const uncappedFee = (baseFee + distanceKm * perKm) * SURGE_MULTIPLIER;
    const deliveryFee = Math.min(MAX_FEE, Math.max(MIN_FEE, Math.round(uncappedFee)));

    return NextResponse.json({
      distanceKm: Number(distanceKm.toFixed(1)),
      durationMins,
      deliveryFee,
    });
  } catch (error) {
    console.error("Delivery fee calculation failed", error);
    return NextResponse.json({ error: "Unable to calculate delivery fee" }, { status: 500 });
  }
}