import mongoose from "mongoose";

import { MONGODB_URI } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongoose ?? {
  conn: null,
  promise: null,
};

globalThis.mongoose = cached;

mongoose.set("bufferCommands", false);

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  let uri = process.env.MONGODB_URI || MONGODB_URI;
  if (!uri.includes("mongodb.net/") || uri.endsWith("mongodb.net/")) {
    uri = uri.replace(/mongodb\.net\/?(\?.*)?$/, "mongodb.net/foodgo$1");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        dbName: "foodgo",
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.info("MongoDB connected successfully");
        return m;
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}
