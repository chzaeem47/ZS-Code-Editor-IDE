import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from '../../../shared/redis/redis.js'

const loginIpLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl:login:ip",
    points: 30,
    duration: 15 * 60,
    blockDuration: 15 * 60,
});

const loginEmailLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl:login:email",
    points: 5,
    duration: 15 * 60,
    blockDuration: 15 * 60,
});

const signupIpLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl:signup:ip",
    points: 10,
    duration: 60 * 60,
    blockDuration: 60 * 60,
});

const signupEmailLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl:signup:email",
    points: 3,
    duration: 60 * 60,
    blockDuration: 60 * 60,
});


const getClientIp = (req) => {
    return req.ip;
};


export const signupRateLimiter = async (req, res, next) => {

    try {

        const ip = getClientIp(req);
        const email = req.body?.email?.trim().toLowerCase();

        await signupIpLimiter.consume(ip);

        if (email) {
            await signupEmailLimiter.consume(email);
        }

        next();

    } catch (error) {

        const retryAfter = Math.ceil((error.msBeforeNext || 60000) / 1000);

        res.set("Retry-After", String(retryAfter));

        return res.status(429).json({
            success: false,
            message: "Too many signup attempts. Please try again later.",
            retryAfter,
        });
    }
};


export const loginRateLimiter = async (req, res, next) => {

    try {

        const ip = getClientIp(req);
        const email = req.body?.email?.trim().toLowerCase();

        await loginIpLimiter.consume(ip);

        if (email) {
            await loginEmailLimiter.consume(email);
        }

        next();

    } catch (error) {

        const retryAfter = Math.ceil((error.msBeforeNext || 60000) / 1000);

        res.set("Retry-After", String(retryAfter));

        return res.status(429).json({
            success: false,
            message: "Too many login attempts. Please try again later.",
            retryAfter,
        });
    }
};