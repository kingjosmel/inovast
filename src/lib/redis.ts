import { Redis } from "@upstash/redis";

import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "@/lib/env";

export const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL,
  token: UPSTASH_REDIS_REST_TOKEN,
});

export async function updateRiderLocation(
  riderId: string,
  lat: number,
  lng: number,
): Promise<number | null> {
  return redis.geoadd("active_riders", {
    member: riderId,
    latitude: lat,
    longitude: lng,
  });
}

export async function getRiderLocation(
  riderId: string,
): Promise<{ lng: number; lat: number } | null> {
  const locations = await redis.geopos("active_riders", riderId);
  return locations[0] ?? null;
}

export async function removeRiderLocation(riderId: string): Promise<number> {
  return redis.zrem("active_riders", riderId);
}