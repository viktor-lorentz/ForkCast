import { beforeAll, describe, expect, it } from "vitest";
import { enrichDishes } from "./enrich";
import { hideReason } from "./filter";
import type { EnrichedDay } from "./menus";
import { cleanProfile } from "./profile";
import { scoreHalls } from "./score";
import { getDayMenus } from "./usc";
import { notPosted, planDay } from "./week";

let day: EnrichedDay;

beforeAll(async () => {
  process.env.DEMO_MODE = "1";
  delete process.env.ANTHROPIC_API_KEY;
  const raw = await getDayMenus("2026-11-15");
  const all = await enrichDishes(raw.halls.flatMap((h) => h.dishes));
  day = { date: raw.date, source: raw.source, aiTagged: false, halls: raw.halls.map((h) => ({ hall: h.hall, meals: h.meals, dishes: all.filter((d) => d.hall === h.hall) })) };
});

describe("planDay", () => {
  it("gives every meal the code-ranked best hall and 2 dishes that pass the filters", () => {
    const profile = cleanProfile({ avoid: ["sesame", "dairy"], diet: ["halal-ingredients"], likes: [], dislikes: [] });
    const plan = planDay(day, profile);
    expect(plan.posted).toBe(true);
    expect(plan.meals.length).toBeGreaterThan(0);
    const byName = new Map(day.halls.flatMap((h) => h.dishes).map((d) => [`${d.hall}|${d.meal}|${d.name}`, d]));
    for (const m of plan.meals) {
      if (!m.hall) continue;
      expect(m.hall).toBe(scoreHalls(day, m.meal, profile)[0].hall);
      expect(m.dishes.length).toBeLessThanOrEqual(2);
      for (const name of m.dishes) {
        const d = byName.get(`${m.hall}|${m.meal}|${name}`)!;
        expect(d, name).toBeDefined();
        expect(hideReason(d, profile), name).toBeNull();
      }
    }
  });

  it("skips dishes with a thumbs down", () => {
    const base = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const first = planDay(day, base).meals.find((m) => m.dishes.length)!;
    const down = cleanProfile({ ...base, taste: { up: [], down: [{ name: first.dishes[0], cuisine: "", protein: "" }] } });
    const again = planDay(day, down).meals.find((m) => m.meal === first.meal)!;
    expect(again.dishes).not.toContain(first.dishes[0]);
  });

  it("says when nothing fits, and when menus aren't posted", () => {
    const empty: EnrichedDay = { ...day, halls: day.halls.map((h) => ({ ...h, meals: [], dishes: [] })) };
    expect(planDay(empty, cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] }))).toEqual({ date: day.date, posted: false, meals: [] });
    expect(notPosted("2026-11-20").posted).toBe(false);
    const strict = cleanProfile({ avoid: ["dairy", "eggs", "gluten", "soy", "sesame", "fish", "shellfish", "peanuts", "tree-nuts", "pork"], diet: ["vegan", "halal-ingredients"], likes: [], dislikes: [] });
    for (const m of planDay(day, strict).meals) if (!m.hall) expect(m.dishes).toEqual([]);
  });
});
