/** Student ratings: every dish gets a 1–10 score from students, averaged across everyone. */

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;

export interface Score {
  /** Average of all students' scores, 1–10. */
  avg: number;
  /** How many students rated it. */
  n: number;
  /** Just the scores given for that day's menu, so students see what people think today. */
  today?: { avg: number; n: number };
}

/** Dishes repeat across days and halls under the same name, so ratings follow the name. */
export const dishKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const isScore = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= MIN_SCORE && (v as number) <= MAX_SCORE;

export function summarize(values: unknown[]): Score | null {
  const ok = values.map(Number).filter(isScore);
  if (!ok.length) return null;
  return { avg: ok.reduce((a, b) => a + b, 0) / ok.length, n: ok.length };
}

/** The average after one student changes their score from `prev` (or none) to `next` (or none). */
export function applyScore(score: Score | null, prev: number | null, next: number | null): Score | null {
  let sum = score ? score.avg * score.n : 0;
  let n = score?.n ?? 0;
  if (prev !== null && n > 0) {
    sum -= prev;
    n -= 1;
  }
  if (next !== null) {
    sum += next;
    n += 1;
  }
  return n > 0 ? { avg: sum / n, n } : null;
}

export const formatAvg = (avg: number) => (Math.round(avg * 10) / 10).toFixed(1).replace(/\.0$/, "");

export function scoreWord(v: number): string {
  return v >= 9 ? "Get it again" : v >= 7 ? "Pretty good" : v >= 5 ? "It's fine" : v >= 3 ? "Not great" : "Skip it";
}

export const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const validRater = (v: unknown): v is string => typeof v === "string" && /^[\w-]{8,64}$/.test(v);
