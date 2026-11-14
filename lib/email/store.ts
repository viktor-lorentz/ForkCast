import { Redis } from "@upstash/redis";
import { cleanProfile, type Profile } from "../profile";

/**
 * Daily-email subscribers, in Upstash Redis (added from Vercel's Storage tab).
 * Each one is { email, profile, confirmed } under a random token; the token is the
 * only key in the confirm and unsubscribe links.
 */
export interface Subscriber {
  email: string;
  profile: Profile;
  confirmed: boolean;
}

const MAX_SUBSCRIBERS = 300;

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export const storeEnabled = () => redis() !== null;

/** Saves (or replaces) the subscription for this email, unconfirmed. Returns the new token. */
export async function addPending(email: string, profile: Profile): Promise<string | null> {
  const r = redis();
  if (!r) return null;
  if ((await r.scard("subs")) >= MAX_SUBSCRIBERS) return null;
  const old = await r.get<string>(`email:${email}`);
  if (old) await removeToken(old);
  const token = crypto.randomUUID();
  await r.set(`sub:${token}`, { email, profile, confirmed: false } satisfies Subscriber, { ex: 7 * 86400 });
  await r.set(`email:${email}`, token, { ex: 7 * 86400 });
  return token;
}

export async function confirm(token: string): Promise<Subscriber | null> {
  const r = redis();
  if (!r || !/^[\w-]{36}$/.test(token)) return null;
  const sub = await r.get<Subscriber>(`sub:${token}`);
  if (!sub) return null;
  const done = { ...sub, confirmed: true };
  await r.set(`sub:${token}`, done);
  await r.set(`email:${sub.email}`, token);
  await r.sadd("subs", token);
  return done;
}

export async function removeToken(token: string): Promise<Subscriber | null> {
  const r = redis();
  if (!r || !/^[\w-]{36}$/.test(token)) return null;
  const sub = await r.get<Subscriber>(`sub:${token}`);
  await r.del(`sub:${token}`);
  await r.srem("subs", token);
  if (sub) await r.del(`email:${sub.email}`);
  return sub;
}

export async function confirmedSubscribers(): Promise<{ token: string; sub: Subscriber }[]> {
  const r = redis();
  if (!r) return [];
  const tokens = await r.smembers("subs");
  const out: { token: string; sub: Subscriber }[] = [];
  for (const token of tokens) {
    const sub = await r.get<Subscriber>(`sub:${token}`);
    if (!sub?.confirmed) continue;
    try {
      out.push({ token, sub: { ...sub, profile: cleanProfile(sub.profile) } });
    } catch {
      // A profile saved by an older version that no longer validates: skip it rather than fail the batch.
    }
  }
  return out;
}

/** At most one email per address every 10 minutes, so the form can't be used to flood someone. */
export async function allowSend(email: string): Promise<boolean> {
  const r = redis();
  if (!r) return memoryAllow(email);
  return (await r.set(`rate:${email}`, 1, { nx: true, ex: 600 })) === "OK";
}

const recent = new Map<string, number>();
function memoryAllow(email: string): boolean {
  const now = Date.now();
  if ((recent.get(email) ?? 0) > now - 600_000) return false;
  recent.set(email, now);
  return true;
}
