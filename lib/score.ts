import type { EnrichedDish } from "./enrich";
import { filterDishes, type Hidden } from "./filter";
import type { EnrichedDay } from "./menus";
import { bestPlate, findGoal, plateCost, sumMacros } from "./plate";
import type { Profile } from "./profile";
import { tasteScore } from "./taste";
import type { HallId } from "./types";
import { findDorm, WALK_PENALTY } from "./walking";

export interface HallScore {
  hall: HallId;
  open: boolean;
  score: number;
  mains: EnrichedDish[];
  sides: EnrichedDish[];
  desserts: EnrichedDish[];
  hidden: Hidden[];
  /** Walking minutes from the student's residence, when they've set one. */
  walk: number | null;
  /** Best plate for the student's fitness goal (empty without a goal or without macro estimates). */
  plate: EnrichedDish[];
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
  return s + tasteScore(d, profile.taste);
}

const byScore = (profile: Profile) => (a: EnrichedDish, b: EnrichedDish) => dishScore(b, profile) - dishScore(a, profile);

/** Code-only ranking of the three halls for one meal. Instant, deterministic, and the fallback for the AI. */
export function scoreHalls(day: EnrichedDay, meal: string, profile: Profile): HallScore[] {
  const dorm = findDorm(profile.dorm);
  const goal = findGoal(profile.goal);
  return day.halls
    .map((h) => {
      // USC sometimes lists the same item twice at a hall (e.g. fruit at two stations); count it once.
      const seen = new Set<string>();
      const unique = h.dishes.filter((d) => d.meal === meal && !seen.has(d.name.toLowerCase()) && seen.add(d.name.toLowerCase()));
      const { eligible, hidden } = filterDishes(unique, profile);
      const sort = byScore(profile);
      const mains = eligible.filter((d) => d.kind === "main").sort(sort);
      const sides = eligible.filter((d) => d.kind === "side").sort(sort);
      const desserts = eligible.filter((d) => d.kind === "dessert").sort(sort);
      // Mains matter most; extra sides help less after the first several.
      const walk = dorm ? dorm.minutes[h.hall] : null;
      const food =
        mains.reduce((n, d) => n + Math.max(0, dishScore(d, profile)), 0) +
        sides.slice(0, 8).reduce((n, d) => n + Math.max(0, dishScore(d, profile)), 0) * 0.5;
      // A hall with nothing to eat doesn't get better by being close.
      // With a fitness goal, a hall where you can build a plate close to it is worth up to 10 extra points.
      const plate = goal ? bestPlate(mains, sides, goal) : [];
      const fit = goal && plate.length > 0 ? 10 * Math.max(0, 1 - plateCost(sumMacros(plate), goal)) : 0;
      const score = food > 0 ? food + fit - (walk ?? 0) * WALK_PENALTY : 0;
      return { hall: h.hall, open: h.meals.includes(meal), score, mains, sides, desserts, hidden, walk, plate };
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
