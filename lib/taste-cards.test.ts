import { beforeAll, describe, expect, it } from "vitest";
import { enrichDishes } from "./enrich";
import { hideReason } from "./filter";
import type { EnrichedDay } from "./menus";
import { cleanProfile } from "./profile";
import { foodType, pickCards } from "./taste-cards";
import { getDayMenus } from "./usc";

let day: EnrichedDay;
beforeAll(async () => {
  process.env.DEMO_MODE = "1";
  delete process.env.ANTHROPIC_API_KEY;
  const raw = await getDayMenus("2026-11-14");
  const all = await enrichDishes(raw.halls.flatMap((h) => h.dishes));
  day = { date: raw.date, source: raw.source, aiTagged: false, halls: raw.halls.map((h) => ({ hall: h.hall, meals: h.meals, dishes: all.filter((d) => d.hall === h.hall) })) };
});

describe("pickCards", () => {
  it("gives 8 different kinds of food (no two pizzas)", () => {
    const cards = pickCards(day, cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] }), 8);
    expect(cards).toHaveLength(8);
    const types = cards.map(foodType);
    expect(new Set(types).size).toBe(types.length);
    expect(cards.filter((c) => /pizza/i.test(c.name)).length).toBeLessThanOrEqual(1);
  });

  it("only shows dishes that pass the student's filters, never one they already rated", () => {
    const profile = cleanProfile({ avoid: ["dairy", "gluten"], diet: ["vegan"], likes: [], dislikes: [] });
    for (const c of pickCards(day, profile, 8)) expect(hideReason(c, profile), c.name).toBeNull();
    const first = pickCards(day, cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] }), 1)[0];
    const rated = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [], taste: { up: [{ name: first.name, cuisine: "", protein: "" }], down: [] } });
    expect(pickCards(day, rated, 8).map((c) => c.name)).not.toContain(first.name);
  });

  it("names food types from the dish name", () => {
    expect(foodType({ name: "Three Cheese Pizza", cuisine: "italian", protein: "cheese" })).toBe(foodType({ name: "Pepperoni Pizza", cuisine: "american", protein: "pork" }));
    expect(foodType({ name: "Chicken Tikka Masala", cuisine: "indian", protein: "chicken" })).not.toBe(foodType({ name: "Pepperoni Pizza", cuisine: "american", protein: "pork" }));
  });
});
