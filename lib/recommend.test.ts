import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { enrichDishes } from "./enrich";
import type { EnrichedDay } from "./menus";
import { cleanProfile, type Profile } from "./profile";
import { recommend } from "./recommend";
import { scoreHalls } from "./score";
import { NOT_ANALYZED } from "./types";
import { getDayMenus } from "./usc";
import { verify } from "./verify";

interface TestProfile {
  id: string;
  profile: Profile;
  cases: { date: string; meal: string }[];
  expectHall: string | null;
}

const dir = path.join(process.cwd(), "data", "test-profiles");
const testProfiles: TestProfile[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));

const days = new Map<string, EnrichedDay>();

beforeAll(async () => {
  // Offline and deterministic: saved menus, heuristic tagging, rules-only picks.
  process.env.DEMO_MODE = "1";
  delete process.env.ANTHROPIC_API_KEY;
  const dates = [...new Set(testProfiles.flatMap((t) => t.cases.map((c) => c.date)))];
  for (const date of dates) {
    const day = await getDayMenus(date);
    const all = await enrichDishes(day.halls.flatMap((h) => h.dishes));
    days.set(date, {
      date,
      source: day.source,
      aiTagged: false,
      halls: day.halls.map((h) => ({ hall: h.hall, meals: h.meals, dishes: all.filter((d) => d.hall === h.hall) })),
    });
  }
});

describe.each(testProfiles)("profile $id", (tp) => {
  it.each(tp.cases)("never recommends a flagged dish ($date $meal)", async ({ date, meal }) => {
    const profile = cleanProfile(tp.profile);
    const day = days.get(date)!;
    const rec = await recommend(day, meal, profile);

    expect(rec.verification.passed).toBe(true);
    for (const pick of rec.picks) {
      for (const a of profile.avoid) expect(pick.allergens, `${pick.name} has ${a}`).not.toContain(a);
      if (profile.avoid.length) expect(pick.allergens).not.toContain(NOT_ANALYZED);
      for (const d of profile.diet) {
        expect(pick.prefs.includes(d) || (d === "vegetarian" && pick.prefs.includes("vegan")), `${pick.name} lacks ${d}`).toBe(true);
      }
    }
    // Every eligible dish in every hall passes the same rules.
    for (const s of scoreHalls(day, meal, profile)) {
      for (const d of [...s.mains, ...s.sides, ...s.desserts]) {
        for (const a of profile.avoid) expect(d.allergens).not.toContain(a);
      }
    }
    if (tp.expectHall) expect(rec.hall).toBe(tp.expectHall);
  });
});

describe("verify catches a bad AI answer", () => {
  const profile = cleanProfile({ avoid: ["sesame"], diet: ["vegan"], likes: [], dislikes: [] });
  const dishes = [
    { id: "ok1", hall: "evk", meal: "Dinner", station: "A", name: "Lentil Stew", allergens: [], prefs: ["vegan"], kind: "main", cuisine: "", protein: "", spicy: false, tags: [], aiTagged: true },
    { id: "ses", hall: "evk", meal: "Dinner", station: "A", name: "Sesame Tofu", allergens: ["sesame", "soy"], prefs: ["vegan"], kind: "main", cuisine: "", protein: "", spicy: false, tags: [], aiTagged: true },
    { id: "pk", hall: "parkside", meal: "Dinner", station: "B", name: "Bean Bowl", allergens: [], prefs: ["vegan"], kind: "main", cuisine: "", protein: "", spicy: false, tags: [], aiTagged: true },
  ] as const;
  const base = { hall: "evk", summary: "EVK has good options.", picks: [{ dishId: "ok1", why: "Hearty.", claims: ["vegan", "no:sesame"] }] };
  const run = (rec: object) => verify({ ...base, ...rec }, dishes.map((d) => ({ ...d, allergens: [...d.allergens], prefs: [...d.prefs], tags: [] })), "Dinner", profile);

  it("passes a correct answer", () => expect(run({}).passed).toBe(true));
  it("rejects an invented dish", () => expect(run({ picks: [{ dishId: "nope", why: "x", claims: [] }] }).passed).toBe(false));
  it("rejects a dish with a flagged allergen", () => expect(run({ picks: [{ dishId: "ses", why: "x", claims: [] }] }).passed).toBe(false));
  it("rejects a dish from another hall", () => expect(run({ picks: [{ dishId: "pk", why: "x", claims: [] }] }).passed).toBe(false));
  it("rejects a false label claim", () =>
    expect(run({ picks: [{ dishId: "ok1", why: "x", claims: ["halal-ingredients"] }] }).passed).toBe(false));
  it('rejects the word "safe"', () => expect(run({ summary: "EVK is safe for you." }).passed).toBe(false));
  it("rejects an unknown hall", () => expect(run({ hall: "mccarthy" }).passed).toBe(false));
});
