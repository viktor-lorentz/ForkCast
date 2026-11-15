import type { EnrichedDish } from "./enrich";
import { dishEmoji } from "./emoji";
import { hideReason } from "./filter";
import type { EnrichedDay } from "./menus";
import type { Profile } from "./profile";
import { ratingOf } from "./taste";

/** The kind of food a dish is (pizza, curry, tacos...), from its name; falls back to cuisine + protein. */
export function foodType(d: Pick<EnrichedDish, "name" | "cuisine" | "protein">): string {
  const e = dishEmoji(d.name);
  return e === "🍽️" ? `${d.cuisine}|${d.protein}` : e;
}

const real = (s: string) => Boolean(s) && s !== "none" && s !== "other";

/**
 * Swipe cards that tell us the most about a student: every card a different kind of food,
 * and as many different cuisines and proteins as the menu allows (no two pizzas).
 * Only dishes that pass their allergen and diet filters; lunch and dinner mains first.
 */
export function pickCards(day: EnrichedDay, profile: Profile, count: number): EnrichedDish[] {
  const seen = new Set<string>();
  const pool = day.halls
    .flatMap((h) => h.dishes)
    .filter((d) => d.kind === "main" && !hideReason(d, profile) && ratingOf(profile.taste, d.name) === 0)
    .filter((d) => !seen.has(d.name.toLowerCase()) && Boolean(seen.add(d.name.toLowerCase())))
    // Lunch and dinner say more about taste than the breakfast line.
    .sort((a, b) => Number(/breakfast/i.test(a.meal)) - Number(/breakfast/i.test(b.meal)));

  const picked: EnrichedDish[] = [];
  const types = new Set<string>();
  const cuisines = new Set<string>();
  const proteins = new Set<string>();
  while (picked.length < count) {
    let best: EnrichedDish | null = null;
    let bestScore = -Infinity;
    for (const [i, d] of pool.entries()) {
      if (picked.includes(d)) continue;
      const s =
        (types.has(foodType(d)) ? -10 : 4) +
        (real(d.cuisine) && !cuisines.has(d.cuisine) ? 2 : 0) +
        (real(d.protein) && !proteins.has(d.protein) ? 2 : 0) -
        i * 0.001; // stable: earlier (lunch/dinner) wins ties
      if (s > bestScore) [best, bestScore] = [d, s];
    }
    if (!best) break;
    picked.push(best);
    types.add(foodType(best));
    cuisines.add(best.cuisine);
    proteins.add(best.protein);
  }
  return picked;
}
