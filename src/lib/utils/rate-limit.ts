/**
 * Minimal in-memory rate limiter (sliding window).
 * Swap the store for Upstash Redis in production by implementing the same interface.
 */

interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket) {
    if (store.size >= MAX_KEYS) {
      for (const [k, b] of store) {
        if (b.timestamps.every((t) => now - t > windowMs)) store.delete(k);
      }
      if (store.size >= MAX_KEYS) {
        const first = store.keys().next();
        if (!first.done) store.delete(first.value);
      }
    }
    bucket = { timestamps: [] };
    store.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    return { ok: false, remaining: 0, resetInMs: Math.max(0, windowMs - (now - oldest)) };
  }

  bucket.timestamps.push(now);
  return { ok: true, remaining: limit - bucket.timestamps.length, resetInMs: windowMs };
}

export const rateLimits = {
  auth: { limit: 10, windowMs: 60_000 },
  orderCreate: { limit: 10, windowMs: 60_000 },
  upload: { limit: 20, windowMs: 60_000 },
  general: { limit: 120, windowMs: 60_000 },
} as const;
