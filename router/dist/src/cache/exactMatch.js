import { Redis } from '@upstash/redis';
import crypto from 'crypto';
let redisClient = null;
const inMemoryCache = new Map();
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Using Upstash Redis cache');
}
else {
    console.log('Redis not configured, using in-memory cache');
}
function generateKey(prompt, modelUsed) {
    const hash = crypto.createHash('sha256').update(`${modelUsed}:${prompt}`).digest('hex');
    return `cache:exact:${hash}`;
}
export async function getExactMatch(prompt, modelUsed) {
    const key = generateKey(prompt, modelUsed);
    if (redisClient) {
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return typeof cached === 'string' ? JSON.parse(cached) : cached;
            }
        }
        catch (e) {
            console.warn('Exact match cache (Redis) read error:', e);
        }
    }
    else {
        const cached = inMemoryCache.get(key);
        if (cached) {
            if (Date.now() > cached.expiresAt) {
                inMemoryCache.delete(key);
            }
            else {
                return cached.response;
            }
        }
    }
    return null;
}
export async function setExactMatch(prompt, modelUsed, response, ttlSeconds = 3600) {
    const key = generateKey(prompt, modelUsed);
    if (redisClient) {
        try {
            await redisClient.set(key, JSON.stringify(response), { ex: ttlSeconds });
        }
        catch (e) {
            console.warn('Exact match cache (Redis) write error:', e);
        }
    }
    else {
        inMemoryCache.set(key, {
            response,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    }
}
//# sourceMappingURL=exactMatch.js.map