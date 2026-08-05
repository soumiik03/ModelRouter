import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// 6.1 Exact-Match Cache
// This file implements a simple Redis-backed exact match cache.
// If Upstash variables are not provided, it falls back to an in-memory Map.

let redisClient: Redis | null = null;
const inMemoryCache = new Map<string, { response: any, expiresAt: number }>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  console.log('Using Upstash Redis cache');
} else {
  console.log('Redis not configured, using in-memory cache');
}

// Generate a deterministic cache key for a prompt + model combination
function generateKey(prompt: string, modelUsed: string): string {
  const hash = crypto.createHash('sha256').update(`${modelUsed}:${prompt}`).digest('hex');
  return `cache:exact:${hash}`;
}

export async function getExactMatch(prompt: string, modelUsed: string): Promise<any | null> {
  const key = generateKey(prompt, modelUsed);

  if (redisClient) {
    try {
      const cached = await redisClient.get<any>(key);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch (e) {
      console.warn('Exact match cache (Redis) read error:', e);
    }
  } else {
    // In-memory fallback
    const cached = inMemoryCache.get(key);
    if (cached) {
      if (Date.now() > cached.expiresAt) {
        inMemoryCache.delete(key);
      } else {
        return cached.response;
      }
    }
  }

  return null;
}

export async function setExactMatch(prompt: string, modelUsed: string, response: any, ttlSeconds: number = 3600): Promise<void> {
  const key = generateKey(prompt, modelUsed);

  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(response), { ex: ttlSeconds });
    } catch (e) {
      console.warn('Exact match cache (Redis) write error:', e);
    }
  } else {
    // In-memory fallback
    inMemoryCache.set(key, {
      response,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }
}
