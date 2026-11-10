import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

type MemoryEntry = { count: number; resetAt: number };

const memory = new Map<string, MemoryEntry>();

function pruneMemory(now: number) {
  if (memory.size < 500) return;
  for (const [key, entry] of memory) {
    if (entry.resetAt <= now) memory.delete(key);
  }
}

function hasUpstash() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

let redis: Redis | null = null;
const upstashLimiters = new Map<string, Ratelimit>();

function getRedis() {
  if (!hasUpstash()) return null;
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

function getUpstashLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  let limiter = upstashLimiters.get(key);
  if (limiter) return limiter;

  const client = getRedis();
  if (!client) return null;

  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "smartq:rl",
  });
  upstashLimiters.set(key, limiter);
  return limiter;
}

/** Consume one attempt against the bucket. */
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const limiter = getUpstashLimiter(limit, windowMs);
  if (limiter) {
    const res = await limiter.limit(key);
    return {
      ok: res.success,
      remaining: res.remaining,
      retryAfterSec: Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
    };
  }

  const now = Date.now();
  pruneMemory(now);
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return {
    ok: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/** Read current count without consuming (for login email lock checks). */
export async function peekRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const client = getRedis();
  if (client) {
    // Upstash Ratelimit stores keys under prefix; peek via a parallel counter key.
    const failKey = `smartq:rlfail:${key}`;
    const raw = await client.get<number | string | null>(failKey);
    const count = typeof raw === "number" ? raw : Number(raw || 0);
    const ttl = await client.ttl(failKey);
    return {
      ok: count < limit,
      remaining: Math.max(0, limit - count),
      retryAfterSec: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
    };
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    return { ok: true, remaining: limit, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  return {
    ok: entry.count < limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/** Increment failure counter (login email). Uses dedicated keys for peek/reset. */
export async function recordFailure(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const client = getRedis();
  if (client) {
    const failKey = `smartq:rlfail:${key}`;
    const count = await client.incr(failKey);
    if (count === 1) {
      await client.pexpire(failKey, windowMs);
    }
    const ttl = await client.pttl(failKey);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSec: Math.max(1, Math.ceil((ttl > 0 ? ttl : windowMs) / 1000)),
    };
  }

  return rateLimit(opts);
}

export async function resetRateLimit(key: string) {
  const client = getRedis();
  if (client) {
    await client.del(`smartq:rlfail:${key}`);
    return;
  }
  memory.delete(key);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
