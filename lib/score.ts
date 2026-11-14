import type { EnrichedDish } from "./enrich";
import { filterDishes, type Hidden } from "./filter";
import type { EnrichedDay } from "./menus";
import type { Profile } from "./profile";
import type { HallId } from "./types";

export interface HallScore {
  hall: HallId;
  open: boolean;
  score: number;
  mains: EnrichedDish[];
  sides: EnrichedDish[];
  desserts: EnrichedDish[];
  hidden: Hidden[];
}

function haystack(d: EnrichedDish): string {
  return [d.name, d.cuisine, d.protein, d.station, ...d.tags].join(" ").toLowerCase();
}

export function matches(d: EnrichedDish, word: string): boolean {
  if (word === "spicy") return d.spicy;
  return haystack(d).includes(word);
}

export function dishScore(d: EnrichedDish, profile: Profile): number {
  let s = d.kind === "main" ? 3 : d.kind === "side" ? 1 : 0.5;
  for (const w of profile.likes) if (matches(d, w)) s += 2;
  for (const w of profile.dislikes) if (matches(d, w)) s -= 3;
  return s;
}

const byScore = (profile: Profile) => (a: EnrichedDish, b: EnrichedDish) => dishScore(b, profile) - dishScore(a, profile);

/** Code-only ranking of the three halls for one meal. Instant, deterministic, and the fallback for the AI. */
export function scoreHalls(day: EnrichedDay, meal: string, profile: Profile): HallScore[] {
  return day.halls
    .map((h) => {
      const { eligible, hidden } = filterDishes(h.dishes.filter((d) => d.meal === meal), profile);
      const sort = byScore(profile);
      const mains = eligible.filter((d) => d.kind === "main").sort(sort);
      const sides = eligible.filter((d) => d.kind === "side").sort(sort);
      const desserts = eligible.filter((d) => d.kind === "dessert").sort(sort);
      // Mains matter most; extra sides help less after the first several.
      const score =
        mains.reduce((n, d) => n + Math.max(0, dishScore(d, profile)), 0) +
        sides.slice(0, 8).reduce((n, d) => n + Math.max(0, dishScore(d, profile)), 0) * 0.5;
      return { hall: h.hall, open: h.meals.includes(meal), score, mains, sides, desserts, hidden };
    })
    .sort((a, b) => Number(b.open) - Number(a.open) || b.score - a.score);
}

/** Meal to show right now, given what's served today (LA time). */
export function currentMeal(meals: string[], now = new Date()): string | null {
  if (meals.length === 0) return null;
  const [h, m] = now
    .toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour12: false })
    .split(":")
    .map(Number);
  const t = h + m / 60;
  const want = t < 10.5 ? ["Breakfast", "Brunch"] : t < 15 ? ["Lunch", "Brunch"] : ["Dinner"];
  return want.find((w) => meals.includes(w)) ?? meals[meals.length - 1];
}
