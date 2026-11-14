import { unstable_cache } from "next/cache";
import { enrichDishes, type EnrichedDish } from "./enrich";
import type { DayMenus, HallId } from "./types";
import { getDayMenus } from "./usc";

export interface EnrichedHall {
  hall: HallId;
  meals: string[];
  dishes: EnrichedDish[];
}

export interface EnrichedDay {
  date: string;
  source: DayMenus["source"];
  aiTagged: boolean;
  halls: EnrichedHall[];
}

async function buildDay(date: string): Promise<EnrichedDay> {
  const day = await getDayMenus(date);
  const all = await enrichDishes(day.halls.flatMap((h) => h.dishes));
  const byId = new Map(all.map((d) => [d.id, d]));
  const tagged = all.filter((d) => d.aiTagged).length;
  return {
    date,
    source: day.source,
    aiTagged: all.length > 0 && tagged / all.length >= 0.8,
    halls: day.halls.map((h) => ({ hall: h.hall, meals: h.meals, dishes: h.dishes.map((d) => byId.get(d.id)!) })),
  };
}

// Persists across requests (and deployments) in Next's data cache, so the AI tagging runs about once per day.
const cachedDay = unstable_cache(
  async (date: string) => {
    const day = await buildDay(date);
    // Don't cache a day where the AI mostly failed; the next request retries.
    if (!day.aiTagged) throw Object.assign(new Error("AI tagging incomplete"), { day });
    return day;
  },
  ["enriched-day-v3"],
  // Menus rarely change during the day, and re-tagging can shift a dish between main and side.
  { revalidate: 6 * 3600 },
);

export async function getEnrichedDay(date: string): Promise<EnrichedDay> {
  try {
    return await cachedDay(date);
  } catch (err) {
    console.warn(`Day ${date} not cached:`, (err as Error).message);
    return (err as { day?: EnrichedDay }).day ?? buildDay(date);
  }
}
