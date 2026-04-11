import Redis from "ioredis";

export const redis = new Redis({
  host: process.env.REDIS_HOST!,
  port: parseInt(process.env.REDIS_PORT!),
  username: process.env.REDIS_USERNAME!,
  password: process.env.REDIS_PASSWORD!,
    maxRetriesPerRequest: null, // ✅ required for BullMQ
  // plain TCP port, no TLS needed
});


export const startRedis = async ()=>{
  await redis.connect()
}

// Logging (optional)
redis.on("connect", () => {
  console.log("✅ Redis connected (singleton)");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});
