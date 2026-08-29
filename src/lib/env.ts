import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/foodgo"),
  UPSTASH_REDIS_REST_URL: z.string().default("https://mock-redis.upstash.io"),
  UPSTASH_REDIS_REST_TOKEN: z.string().default("mock_token"),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI || undefined,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || undefined,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || undefined,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || undefined,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || undefined,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || undefined,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || undefined,
});

export const MONGODB_URI = parsed.MONGODB_URI;
export const UPSTASH_REDIS_REST_URL = parsed.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = parsed.UPSTASH_REDIS_REST_TOKEN;
export const PAYSTACK_SECRET_KEY = parsed.PAYSTACK_SECRET_KEY;
export const PAYSTACK_PUBLIC_KEY = parsed.PAYSTACK_PUBLIC_KEY;
export const PAYSTACK_WEBHOOK_SECRET = parsed.PAYSTACK_WEBHOOK_SECRET;
export const CLOUDINARY_CLOUD_NAME = parsed.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = parsed.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = parsed.CLOUDINARY_API_SECRET;

