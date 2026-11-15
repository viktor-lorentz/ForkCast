import { redis } from "./email/store";

/**
 * Per-IP limits for the endpoints that cost money (AI calls, email), counted in Upstash Redis
 * with a fixed one-minute window. Vercel's Hobby plan allows only one Firewall rate-limit rule,
 * so exact per-route limits live here and the Firewall rule is a broader backstop at the edge.
 */
export const LIMITS = {
  recommend: 30,
  "parse-profile": 10,
  "email-send": 5,
} as const;
export type LimitedRoute = keyof typeof LIMITS;

export const TOO_MANY = "Too many requests, try again in a minute";

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** Returns a ready 429 response when this IP is over the limit, or null to go ahead. Fails open if Redis is down. */
export async function rateLimit(request: Request, route: LimitedRoute, now = Date.now()): Promise<Response | null> {
  const r = redis();
  if (!r) return null;
  const window = Math.floor(now / 60_000);
  const key = `rl:${route}:${clientIp(request)}:${window}`;
  try {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, 70);
    if (n <= LIMITS[route]) return null;
  } catch (err) {
    console.warn("rate limit check failed, allowing:", (err as Error).message);
    return null;
  }
  const retryAfter = 60 - Math.floor((now % 60_000) / 1000);
  return Response.json({ error: TOO_MANY, tooMany: true }, { status: 429, headers: { "retry-after": String(retryAfter) } });
}
