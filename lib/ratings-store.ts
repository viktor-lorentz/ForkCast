import { redis } from "./email/store";
import { dishKey, summarize, type Score } from "./ratings";

/**
 * Student ratings in Upstash Redis: one hash per dish name, `score:<dish key>` → { raterId: score }.
 * A rater is a random id kept in that student's browser, so rating again replaces their old score.
 */
const RATE_LIMIT = 300; // ratings per hour per IP

export const ratingsEnabled = () => redis() !== null;

export async function saveScore(name: string, rater: string, score: number | null): Promise<Score | null> {
  const r = redis();
  if (!r) throw new Error("ratings store not configured");
  const key = `score:${dishKey(name)}`;
  if (score === null) await r.hdel(key, rater);
  else {
    await r.hset(key, { [rater]: score });
    await r.hset("score-names", { [dishKey(name)]: name });
  }
  const all = await r.hgetall<Record<string, number>>(key);
  return summarize(Object.values(all ?? {}));
}

export async function lookupScores(names: string[], rater?: string): Promise<Record<string, Score & { mine?: number }>> {
  const r = redis();
  if (!r || names.length === 0) return {};
  const keys = [...new Set(names.map(dishKey))];
  const p = r.pipeline();
  for (const k of keys) p.hgetall(`score:${k}`);
  const rows = (await p.exec()) as (Record<string, number> | null)[];
  const out: Record<string, Score & { mine?: number }> = {};
  keys.forEach((k, i) => {
    const row = rows[i] ?? {};
    const s = summarize(Object.values(row));
    if (!s) return;
    const mine = rater ? Number(row[rater]) : NaN;
    out[k] = Number.isFinite(mine) ? { ...s, mine } : s;
  });
  return out;
}

export async function underRateLimit(ip: string): Promise<boolean> {
  const r = redis();
  if (!r) return true;
  const key = `rl:score:${ip}`;
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 3600);
  return n <= RATE_LIMIT;
}
