import { Redis } from "@upstash/redis";

import {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from "@/lib/env";

const isConfigured =
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) &&
  !UPSTASH_REDIS_REST_URL.includes("mock-redis");

const inMemoryStore = new Map<string, { lat: number; lng: number }>();

export const redis = isConfigured
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : ({
      geoadd: async (_key: string, data: { member: string; latitude: number; longitude: number }) => {
        inMemoryStore.set(data.member, { lat: data.latitude, lng: data.longitude });
        return 1;
      },
      geopos: async (_key: string, member: string) => {
        const item = inMemoryStore.get(member);
        return item ? [{ lng: item.lng, lat: item.lat }] : [null];
      },
      zrem: async (_key: string, member: string) => {
        return inMemoryStore.delete(member) ? 1 : 0;
      },
    } as unknown as Redis);

export async function updateRiderLocation(
  riderId: string,
  lat: number,
  lng: number,
): Promise<number | null> {
  try {
    if (isConfigured) {
      return await redis.geoadd("active_riders", {
        member: riderId,
        latitude: lat,
        longitude: lng,
      });
    }
  } catch (err) {
    console.warn("Redis geoadd warning, using memory fallback:", err);
  }
  inMemoryStore.set(riderId, { lat, lng });
  return 1;
}

export async function getRiderLocation(
  riderId: string,
): Promise<{ lng: number; lat: number } | null> {
  try {
    if (isConfigured) {
      const locations = await redis.geopos("active_riders", riderId);
      return locations[0] ?? null;
    }
  } catch (err) {
    console.warn("Redis geopos warning, using memory fallback:", err);
  }
  return inMemoryStore.get(riderId) ?? null;
}

export async function removeRiderLocation(riderId: string): Promise<number> {
  try {
    if (isConfigured) {
      return await redis.zrem("active_riders", riderId);
    }
  } catch (err) {
    console.warn("Redis zrem warning, using memory fallback:", err);
  }
  return inMemoryStore.delete(riderId) ? 1 : 0;
}
