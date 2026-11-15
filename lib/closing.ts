import { hoursOn, minutes, type HallHours } from "./hours";
import type { HallId } from "./types";

/**
 * Closing soon: for today's current meal, a hall that's closed, or closes before the student
 * could walk there and still have 15 minutes to eat, is marked and ranked below the others.
 */
export const EAT_MINUTES = 15;
/** The main card shows the closing time when the pick closes within this many minutes. */
export const HERO_WINDOW = 45;

export interface Closing {
  state: "open" | "closing" | "closed";
  /** Minutes until the hall closes (null when closed). */
  minutesLeft: number | null;
  /** "10:00PM", as USC writes it. */
  closesAt: string | null;
}

export type ClosingMap = Partial<Record<HallId, Closing>>;

/** Minutes after midnight in Los Angeles. */
export function laMinutes(now = new Date()): number {
  const [h, m] = now.toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour12: false }).split(":").map(Number);
  return h * 60 + m;
}

/** Null when the hours can't be read or the hall hasn't opened yet today. */
export function closingFor(h: HallHours, date: string, nowMin: number, walk: number | null): Closing | null {
  const { hours } = hoursOn(h, date);
  if (/closed/i.test(hours)) return { state: "closed", minutesLeft: null, closesAt: null };
  const [a = "", b = ""] = hours.split(/\s*[–-]\s*/);
  const from = minutes(a);
  const to = minutes(b);
  if (from === null || to === null || nowMin < from) return null;
  if (nowMin >= to) return { state: "closed", minutesLeft: null, closesAt: b.trim() };
  const left = to - nowMin;
  return { state: left < (walk ?? 0) + EAT_MINUTES ? "closing" : "open", minutesLeft: left, closesAt: b.trim() };
}

export function closingMap(halls: HallHours[], date: string, nowMin: number, walks: Partial<Record<HallId, number>> = {}): ClosingMap {
  const out: ClosingMap = {};
  for (const h of halls) {
    const c = closingFor(h, date, nowMin, walks[h.hall] ?? null);
    if (c) out[h.hall] = c;
  }
  return out;
}

export const isClosing = (c: Closing | null | undefined) => Boolean(c && c.state !== "open");

/** "Closed now" / "Closes in 20 min", or null when the hall has time. */
export function closingText(c: Closing | null | undefined): string | null {
  if (!c || c.state === "open") return null;
  return c.state === "closed" ? "Closed now" : `Closes in ${c.minutesLeft} min`;
}

/** Stable cache-key part: which halls are closing, not the exact minute. */
export function closingKey(m: ClosingMap): string {
  const parts = Object.entries(m)
    .filter(([, c]) => isClosing(c))
    .map(([h, c]) => `${h}:${c!.state}`)
    .sort();
  return parts.join(",") || "none";
}
