import { describe, expect, it } from "vitest";
import { hideReason } from "./filter";
import { bestPlate, GOALS, plateFit, sumMacros } from "./plate";
import { cleanProfile, profileKey } from "./profile";
import { styleConflict } from "./styles";
import { rate, ratingOf, tasteScore, tasteSummary } from "./taste";
import { verify } from "./verify";

const dish = (name: string, o: Partial<{ cuisine: string; protein: string; allergens: string[]; prefs: string[]; carbs: number; cal: number; p: number; kind: string }> = {}) => ({
  id: name,
  hall: "evk" as const,
  meal: "Dinner",
  station: "Grill",
  name,
  kind: (o.kind ?? "main") as "main",
  cuisine: o.cuisine ?? "american",
  protein: o.protein ?? "none",
  spicy: false,
  tags: [],
  aiTagged: true,
  allergens: o.allergens ?? [],
  prefs: o.prefs ?? [],
  macros: { cal: o.cal ?? 400, protein: o.p ?? 20, carbs: o.carbs ?? 30, fat: 10 },
});

describe("thumbs ratings", () => {
  it("rates, re-rates and clears a dish", () => {
    let t = rate(undefined, { name: "Fish Tacos", cuisine: "mexican", protein: "fish" }, 1);
    expect(ratingOf(t, "fish tacos")).toBe(1);
    t = rate(t, { name: "Fish Tacos", cuisine: "mexican", protein: "fish" }, -1);
    expect(t.up).toHaveLength(0);
    expect(ratingOf(t, "Fish Tacos")).toBe(-1);
    expect(ratingOf(rate(t, { name: "Fish Tacos", cuisine: "", protein: "" }, 0), "Fish Tacos")).toBe(0);
  });

  it("moves the rated dish most and similar dishes a little", () => {
    const one = rate(undefined, { name: "Carnitas Bowl", cuisine: "mexican", protein: "pork" }, 1);
    // A single rating moves only that dish.
    expect(tasteScore(dish("Chicken Burrito", { cuisine: "mexican", protein: "chicken" }), one)).toBe(0);
    const t = rate(one, { name: "Fish Tacos", cuisine: "mexican", protein: "fish" }, 1);
    expect(tasteScore(dish("Carnitas Bowl"), t)).toBe(3);
    const similar = tasteScore(dish("Chicken Burrito", { cuisine: "mexican", protein: "chicken" }), t);
    expect(similar).toBeGreaterThan(0);
    expect(similar).toBeLessThan(3);
    expect(tasteScore(dish("Pad Thai", { cuisine: "asian" }), t)).toBe(0);
    expect(tasteSummary(t).toward).toContain("mexican");
  });

  it("changes the cache key and survives cleanProfile", () => {
    const base = { avoid: [], diet: [], likes: [], dislikes: [] };
    const p = cleanProfile({ ...base, taste: { up: [{ name: "Pho", cuisine: "asian", protein: "beef" }], down: [{ name: "pho", cuisine: "asian", protein: "beef" }] } });
    expect(p.taste!.down).toHaveLength(0);
    expect(profileKey(p)).not.toBe(profileKey(cleanProfile(base)));
  });
});

describe("eating styles", () => {
  it("pescatarian keeps fish and vegetarian dishes, hides other meat", () => {
    expect(styleConflict(dish("Grilled Salmon", { allergens: ["fish"] }), ["pescatarian"])).toBeNull();
    expect(styleConflict(dish("Veggie Curry", { prefs: ["vegetarian"] }), ["pescatarian"])).toBeNull();
    expect(styleConflict(dish("Chicken Parm", { protein: "chicken" }), ["pescatarian"])).toBe("pescatarian");
    expect(styleConflict(dish("Shrimp and Sausage Gumbo", { allergens: ["shellfish"] }), ["pescatarian"])).toBe("pescatarian");
  });

  it("keto hides high-carb estimates; Word of Wisdom hides coffee, tea and alcohol", () => {
    expect(styleConflict(dish("Pasta", { carbs: 70 }), ["keto"])).toBe("keto");
    expect(styleConflict(dish("Steak", { carbs: 2 }), ["keto"])).toBeNull();
    expect(styleConflict(dish("Tiramisu"), ["word-of-wisdom"])).toBe("word-of-wisdom");
    expect(styleConflict(dish("Beer Battered Fish"), ["word-of-wisdom"])).toBe("word-of-wisdom");
    expect(styleConflict(dish("Steak"), ["word-of-wisdom"])).toBeNull();
  });

  it("is applied by the same filter as allergens", () => {
    const p = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [], styles: ["keto"] });
    expect(hideReason(dish("Pancakes", { carbs: 60 }), p)).toEqual({ type: "style", style: "keto" });
  });
});

describe("plate builder", () => {
  const muscle = GOALS.find((g) => g.id === "muscle")!;
  const mains = [dish("Chicken Breast", { cal: 350, p: 45, carbs: 0 }), dish("Mac and Cheese", { cal: 600, p: 15, carbs: 60 })];
  const sides = [dish("Rice", { cal: 250, p: 5, carbs: 50, kind: "side" }), dish("Broccoli", { cal: 60, p: 4, carbs: 8, kind: "side" })];

  it("picks the combination closest to the goal", () => {
    const plate = bestPlate(mains, sides, muscle);
    expect(plate.map((d) => d.name)).toContain("Chicken Breast");
    expect(plateFit(sumMacros(plate), muscle)).toBeGreaterThan(70);
  });

  it("returns nothing without macro estimates", () => {
    expect(bestPlate(mains.map((d) => ({ ...d, macros: null })), [], muscle)).toEqual([]);
  });

  it("verify rejects an AI answer that states its own calorie numbers", () => {
    const d = dish("Chicken Breast");
    const p = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const rec = (summary: string) => ({ hall: "evk", summary, picks: [{ dishId: d.id, why: "Lean protein.", claims: [] }] });
    expect(verify(rec("EVK has lean chicken."), [d], "Dinner", p).passed).toBe(true);
    expect(verify(rec("EVK gets you 45g protein."), [d], "Dinner", p).passed).toBe(false);
  });
});

describe("food tags", () => {
  it("turns estimates into labels, never numbers", async () => {
    const { foodTags } = await import("./plate");
    expect(foodTags({ kind: "main", macros: { cal: 280, protein: 36, carbs: 1, fat: 14 } })).toEqual(["High protein", "Lighter", "Low carb"]);
    expect(foodTags({ kind: "main", macros: { cal: 650, protein: 20, carbs: 70, fat: 30 } })).toEqual(["Hearty"]);
    expect(foodTags({ kind: "condiment", macros: { cal: 50, protein: 0, carbs: 2, fat: 5 } })).toEqual([]);
    expect(foodTags({ kind: "main", macros: null })).toEqual([]);
  });
});

describe("dining hours", () => {
  it("reads the saved USC hours and applies special days", async () => {
    const { hoursOn, openStatus } = await import("./hours");
    const { readFileSync } = await import("node:fs");
    const halls = JSON.parse(readFileSync("data/hours.json", "utf8"));
    const evk = halls.find((h: { hall: string }) => h.hall === "evk");
    expect(hoursOn(evk, "2026-11-19").hours).toBe(evk.regular.Thu);
    expect(hoursOn(evk, "2026-11-11").label).toMatch(/Veterans/);
    expect(openStatus("7:00AM – 10:00PM", 6 * 60)).toEqual({ open: false, text: "Opens 7:00AM" });
    expect(openStatus("7:00AM – 10:00PM", 12 * 60)!.open).toBe(true);
    expect(openStatus("7:00AM – 8:00PM", 21 * 60)!.text).toBe("Closed for today");
  });
});

describe("thumbs down", () => {
  it("is never recommended again", async () => {
    const d = dish("Watermelon Chicken");
    const taste = rate(undefined, d, -1);
    const p = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [], taste });
    const rec = { hall: "evk", summary: "EVK.", picks: [{ dishId: d.id, why: "Fresh.", claims: [] }] };
    expect(verify(rec, [d], "Dinner", p).passed).toBe(false);
  });
});
