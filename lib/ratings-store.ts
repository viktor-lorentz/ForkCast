import { redis } from "./email/store";
import { dishKey, summarize, type Score } from "./ratings";

/**
 * Student ratings in Upstash Redis: one hash per dish name, `score:<dish key>` → { raterId: score }.
 * A rater is a random id kept in that student's browser, so rating again replaces their old score.
 */
const RATE_LIMIT = 300; // ratings per hour per IP

export const ratingsEnabled = () => redis() !== null;

const dayKey = (date: string, k: string) => `score-day:${date}:${k}`;

/** Saves one student's score (overall and for that day's menu) and returns the new averages. */
export async function saveScore(name: string, rater: string, score: number | null, date?: string): Promise<Score | null> {
  const r = redis();
  if (!r) throw new Error("ratings store not configured");
  const k = dishKey(name);
  const key = `score:${k}`;
  if (score === null) {
    await r.hdel(key, rater);
    if (date) await r.hdel(dayKey(date, k), rater);
  } else {
    await r.hset(key, { [rater]: score });
    await r.hset("score-names", { [k]: name });
    if (date) {
      await r.hset(dayKey(date, k), { [rater]: score });
      await r.expire(dayKey(date, k), 4 * 86400);
    }
  }
  const [all, day] = await Promise.all([
    r.hgetall<Record<string, number>>(key),
    date ? r.hgetall<Record<string, number>>(dayKey(date, k)) : Promise.resolve(null),
  ]);
  const s = summarize(Object.values(all ?? {}));
  const today = summarize(Object.values(day ?? {}));
  return s && today ? { ...s, today } : s;
}

export async function lookupScores(names: string[], rater?: string, date?: string): Promise<Record<string, Score & { mine?: number }>> {
  const r = redis();
  if (!r || names.length === 0) return {};
  const keys = [...new Set(names.map(dishKey))];
  const p = r.pipeline();
  for (const k of keys) {
    p.hgetall(`score:${k}`);
    if (date) p.hgetall(dayKey(date, k));
  }
  const rows = (await p.exec()) as (Record<string, number> | null)[];
  const step = date ? 2 : 1;
  const out: Record<string, Score & { mine?: number }> = {};
  keys.forEach((k, i) => {
    const row = rows[i * step] ?? {};
    const s = summarize(Object.values(row));
    if (!s) return;
    const today = date ? summarize(Object.values(rows[i * step + 1] ?? {})) : null;
    const mine = rater ? Number(row[rater]) : NaN;
    out[k] = { ...s, ...(today ? { today } : {}), ...(Number.isFinite(mine) ? { mine } : {}) };
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
