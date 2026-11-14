import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { HALLS, type DayMenus, type Dish, type HallId, type HallMenu, type UscRawMenu } from "./types";

const USC_API = "https://hospitality.usc.edu/wp-json/hsp-api/v1/get-res-dining-menus";
const SNAPSHOT_DIR = path.join(process.cwd(), "data", "snapshots");

/** Today's date in Los Angeles as YYYY-MM-DD. */
export function todayLA(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export function dishId(hall: HallId, meal: string, station: string, name: string): string {
  return createHash("sha1").update(`${hall}|${meal}|${station}|${name}`).digest("hex").slice(0, 10);
}

export function normalize(hall: HallId, date: string, raw: UscRawMenu): HallMenu {
  const dishes: Dish[] = [];
  const meals: string[] = [];
  const seen = new Set<string>();

  for (const meal of raw.meals ?? []) {
    const stations = meal.stations ?? [];
    if (stations.length === 0) continue;
    meals.push(meal.name);
    for (const station of stations) {
      for (const item of station.menu ?? []) {
        const name = item.item.replace(/\s+/g, " ").trim();
        if (!name) continue;
        let id = dishId(hall, meal.name, station.station, name);
        // Same name twice at one station: keep both, with distinct ids.
        for (let n = 2; seen.has(id); n++) id = dishId(hall, meal.name, station.station, `${name}#${n}`);
        seen.add(id);
        dishes.push({
          id,
          hall,
          meal: meal.name,
          station: station.station.trim(),
          name,
          allergens: [...(item.allergens ?? [])],
          prefs: [...(item.preferences ?? [])],
        });
      }
    }
  }
  return { hall, date, meals, dishes };
}

export function uscUrl(hall: HallId, date: string): string {
  const [y, m, d] = date.split("-");
  return `${USC_API}/${hall}?y=${y}&m=${m}&d=${d}`;
}

async function fetchLive(hall: HallId, date: string): Promise<UscRawMenu> {
  const res = await fetch(uscUrl(hall, date), {
    headers: { "User-Agent": "Mozilla/5.0 (USC student hackathon project)" },
    signal: AbortSignal.timeout(8000),
    // Next.js data cache: reuse USC responses for 30 minutes.
    next: { revalidate: 1800 },
  } as RequestInit);
  if (!res.ok) throw new Error(`USC ${hall} ${date}: HTTP ${res.status}`);
  return (await res.json()) as UscRawMenu;
}

export async function readSnapshot(hall: HallId, date: string): Promise<UscRawMenu | null> {
  try {
    return JSON.parse(await readFile(path.join(SNAPSHOT_DIR, date, `${hall}.json`), "utf8"));
  } catch {
    return null;
  }
}

/**
 * Menus for all three halls on a date. Live from USC unless DEMO_MODE=1;
 * if any live fetch fails, the whole day falls back to the saved snapshot.
 */
export async function getDayMenus(date: string): Promise<DayMenus> {
  const demo = process.env.DEMO_MODE === "1";
  if (!demo) {
    try {
      const raws = await Promise.all(HALLS.map((h) => fetchLive(h.id, date)));
      return { date, source: "live", halls: HALLS.map((h, i) => normalize(h.id, date, raws[i])) };
    } catch (err) {
      console.warn("Live USC fetch failed, trying snapshot:", err);
    }
  }
  const raws = await Promise.all(HALLS.map((h) => readSnapshot(h.id, date)));
  if (raws.some((r) => r === null)) {
    throw new Error(`No menu available for ${date}${demo ? " in demo mode" : ""}`);
  }
  return { date, source: "snapshot", halls: HALLS.map((h, i) => normalize(h.id, date, raws[i]!)) };
}
