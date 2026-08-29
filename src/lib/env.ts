import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/foodgo"),
  UPSTASH_REDIS_REST_URL: z.string().default("https://mock-redis.upstash.io"),
  UPSTASH_REDIS_REST_TOKEN: z.string().default("mock_token"),
});

const parsed = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI || undefined,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
});

export const MONGODB_URI = parsed.MONGODB_URI;
export const UPSTASH_REDIS_REST_URL = parsed.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = parsed.UPSTASH_REDIS_REST_TOKEN;
