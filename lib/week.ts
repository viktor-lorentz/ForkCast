import type { EnrichedDay } from "./menus";
import type { Profile } from "./profile";
import { scoreHalls } from "./score";
import { ratingOf } from "./taste";
import type { HallId } from "./types";

/**
 * "This week": for each day and meal, the best hall and its top 2 dishes, from code scoring only
 * (the same allergen and diet filters as the main pick; no AI call).
 */
export interface WeekMeal {
  meal: string;
  /** Null when no hall has a dish that fits this student. */
  hall: HallId | null;
  dishes: string[];
  /** Dishes that fit at the chosen hall (mains + sides). */
  count: number;
}

export interface WeekDay {
  date: string;
  /** False when USC hasn't posted menus for this day yet (or they couldn't be loaded). */
  posted: boolean;
  meals: WeekMeal[];
}

export const WEEK_DAYS = 7;

export function planDay(day: EnrichedDay, profile: Profile): WeekDay {
  const meals = [...new Set(day.halls.flatMap((h) => h.meals))];
  const order = ["Breakfast", "Brunch", "Lunch", "Dinner"];
  meals.sort(
    (a, b) => (order.indexOf(a) + 1 || 9) - (order.indexOf(b) + 1 || 9),
  );
  return {
    date: day.date,
    posted: meals.length > 0,
    meals: meals.map((meal) => {
      const top = scoreHalls(day, meal, profile)[0];
      const notDown = (d: { name: string }) =>
        ratingOf(profile.taste, d.name) !== -1;
      const count = top ? top.mains.length + top.sides.length : 0;
      if (!top || !top.open || count === 0)
        return { meal, hall: null, dishes: [], count: 0 };
      const dishes = [
        ...top.mains.filter(notDown),
        ...top.sides.filter(notDown),
      ]
        .slice(0, 2)
        .map((d) => d.name);
      return { meal, hall: top.hall, dishes, count };
    }),
  };
}

export const notPosted = (date: string): WeekDay => ({
  date,
  posted: false,
  meals: [],
});
