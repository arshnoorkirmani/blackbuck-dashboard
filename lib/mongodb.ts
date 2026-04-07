import mongoose from 'mongoose';
import { env } from "@/lib/env";

/**
 * PRODUCTION-READY MONGOOSE CONNECTION CONTEXT
 * Implements connection pooling and caching for serverless environments.
 */

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// ── Define Global Type for Global ───────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  const MONGODB_URI = env.mongodbUri;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("✅ Successfully connected to MongoDB Database Cluster.");
      return mongooseInstance;
    });
  }
  
  try {
    cached.conn = (await cached.promise).connection;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
