import { describe, expect, it } from "vitest";
import { enrichDishes, heuristicInfo } from "./enrich";

describe("heuristicInfo", () => {
  it("spots notices, condiments and mains", () => {
    expect(heuristicInfo("GRILL ITEMS AVAILABLE AT 11AM").kind).toBe("notice");
    expect(heuristicInfo("Creamy Caesar Dressing").kind).toBe("condiment");
    expect(heuristicInfo("Garlic and Herb Roasted Chicken").kind).toBe("main");
    expect(heuristicInfo("Spicy Salsa Molcajete").spicy).toBe(true);
  });
});

describe("enrichDishes without an API key", () => {
  it("falls back to the heuristic and never touches USC labels", async () => {
    const saved = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const [d] = await enrichDishes([
      { id: "x", hall: "evk", meal: "Dinner", station: "Grill", name: "Beef Burger", allergens: ["gluten", "sesame"], prefs: [] },
    ]);
    expect(d).toMatchObject({ kind: "main", aiTagged: false, allergens: ["gluten", "sesame"], prefs: [] });
    if (saved) process.env.ANTHROPIC_API_KEY = saved;
  });
});
