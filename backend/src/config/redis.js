// Redis client with in-memory fallback
// If Redis is not available, uses a simple Map-based store
// This means OTPs work without Redis installed locally

import Redis from "ioredis";

// ---- In-memory fallback store (used when Redis is unavailable) ----
class MemoryStore {
  constructor() {
    this.store = new Map();
    console.log("⚠️  Redis unavailable — using in-memory OTP store (dev only)");
  }

  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value) {
    this.store.set(key, { value, expiresAt: Infinity });
    return "OK";
  }

  async setex(key, seconds, value) {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return "OK";
  }

  async del(...keys) {
    keys.forEach((k) => this.store.delete(k));
    return keys.length;
  }

  async ttl(key) {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (entry.expiresAt === Infinity) return -1;
    return Math.ceil((entry.expiresAt - Date.now()) / 1000);
  }

  on() {} // no-op for event listeners
}

// Try to connect to Redis — fall back to memory store if it fails
let client;

if (process.env.REDIS_URL && process.env.REDIS_URL !== "redis://127.0.0.1:6379") {
  // Production Redis Cloud URL provided — use it
  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    lazyConnect: true,
  });
  client.on("connect", () => console.log("✅ Redis connected"));
  client.on("error", (err) => console.warn("⚠️  Redis error:", err.message));
} else {
  // No Redis URL or local Redis — try connecting, fall back to memory
  const tempClient = new Redis("redis://127.0.0.1:6379", {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't retry
    lazyConnect: true,
    connectTimeout: 2000,
  });

  try {
    await tempClient.connect();
    await tempClient.ping();
    client = tempClient;
    console.log("✅ Redis connected (local)");
  } catch {
    tempClient.disconnect();
    client = new MemoryStore();
  }
}

export default client;
