import type { Rated } from "./taste";

/**
 * "I ate this": the last 7 days of dishes the student said they ate, kept in the profile
 * (browser storage and the share link). It only nudges scores toward variety; it never hides a dish.
 */
export interface Ate extends Rated {
  /** YYYY-MM-DD, Los Angeles. */
  date: string;
}

export const HISTORY_DAYS = 7;
export const MAX_HISTORY = 30;
/** Recent meals count for this many days (0 = today, 1 = yesterday, 2 = two days ago). */
const RECENT_DAYS = 2;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const real = (s: string) => Boolean(s) && s !== "none" && s !== "other";

/** Whole days from `then` to `today` (both YYYY-MM-DD). */
export function daysAgo(then: string, today: string): number {
  return Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${then}T12:00:00Z`)) / 86_400_000);
}

/** Drops entries older than 7 days (and any dated in the future). */
export function pruneHistory(history: Ate[] = [], today: string): Ate[] {
  return history.filter((h) => {
    const n = daysAgo(h.date, today);
    return n >= 0 && n < HISTORY_DAYS;
  });
}

export function ateOn(history: Ate[] | undefined, name: string, date: string): boolean {
  return Boolean(history?.some((h) => h.date === date && same(h.name, name)));
}

/** Adds (or with `ate` false, removes) a dish for a date, keeping 7 days and the newest entries. */
export function logAte(history: Ate[] | undefined, dish: Rated, date: string, ate = true): Ate[] {
  const rest = pruneHistory(history, date).filter((h) => !(h.date === date && same(h.name, dish.name)));
  if (ate) rest.push({ name: dish.name, cuisine: dish.cuisine, protein: dish.protein, date });
  return rest.sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_HISTORY);
}

const recent = (history: Ate[] | undefined, today: string) =>
  (history ?? []).filter((h) => {
    const n = daysAgo(h.date, today);
    return n >= 0 && n <= RECENT_DAYS;
  });

/**
 * A small score cut for dishes like ones eaten in the last 2-3 days: the same dish most,
 * the same protein or cuisine a little. Capped low so a great match still wins.
 */
export function recentPenalty(d: Rated, history: Ate[] | undefined, today: string): number {
  const r = recent(history, today);
  if (r.length === 0) return 0;
  let p = 0;
  const own = r.filter((h) => same(h.name, d.name)).map((h) => daysAgo(h.date, today));
  if (own.length) p += Math.min(...own) <= 1 ? 1.5 : 1;
  for (const key of ["protein", "cuisine"] as const) {
    const v = d[key];
    if (!real(v)) continue;
    const days = new Set(r.filter((h) => same(h[key], v)).map((h) => h.date)).size;
    p += Math.min(days, 2) * 0.25;
  }
  return Math.min(p, 2);
}

/** "You had this yesterday", or null when it wasn't eaten in the last 7 days. */
export function ateNote(history: Ate[] | undefined, name: string, today: string): string | null {
  const days = (history ?? []).filter((h) => same(h.name, name)).map((h) => daysAgo(h.date, today)).filter((n) => n >= 0 && n < HISTORY_DAYS);
  if (days.length === 0) return null;
  const n = Math.min(...days);
  return n === 0 ? "You had this today" : n === 1 ? "You had this yesterday" : `You had this ${n} days ago`;
}

const DAY_WORDS = ["today", "yesterday", "2 days ago"];
const COUNT_WORDS = ["", "", "two", "three"];

/**
 * A line for the AI, e.g. "Ate recently: Chicken Bowl (yesterday), Pho (2 days ago). They had chicken the last two days."
 * Empty when nothing was logged in the last 2-3 days.
 */
export function historyNote(history: Ate[] | undefined, today: string): string {
  const r = recent(history, today).sort((a, b) => b.date.localeCompare(a.date));
  if (r.length === 0) return "";
  const items = r.slice(0, 6).map((h) => `${h.name} (${DAY_WORDS[daysAgo(h.date, today)]})`);
  const patterns: string[] = [];
  for (const key of ["protein", "cuisine"] as const) {
    const byValue = new Map<string, Set<string>>();
    for (const h of r) if (real(h[key])) byValue.set(h[key].toLowerCase(), (byValue.get(h[key].toLowerCase()) ?? new Set()).add(h.date));
    for (const [v, dates] of byValue) if (dates.size >= 2) patterns.push(`they had ${v} ${key === "cuisine" ? "food " : ""}on ${COUNT_WORDS[dates.size]} of the last three days`);
  }
  return `Ate recently: ${items.join(", ")}.${patterns.length ? ` ${patterns.join("; ")}.` : ""}`;
}
