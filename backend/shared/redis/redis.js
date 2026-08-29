import Redis from "ioredis";

export const redis = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379",
    {
        maxRetriesPerRequest: null,
    }
);

redis.on("connect", () => {
    console.log("Redis Connected");
});

redis.on("error", (error) => {
    console.error("Redis Error:", error.message);
});