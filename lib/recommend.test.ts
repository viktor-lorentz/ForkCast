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

describe("Allergen Awareness Zone", () => {
  it("is off-limits unless the student is registered", async () => {
    const day = days.get("2026-11-14")!;
    const parkside = day.halls.find((h) => h.hall === "parkside")!;
    const meal = parkside.dishes.find((d) => /allergen awareness zone/i.test(d.station))!.meal;
    const base = { avoid: ["peanuts"], diet: [], likes: [], dislikes: [] };
    const station = (p: object) =>
      scoreHalls(day, meal, cleanProfile(p))
        .find((s) => s.hall === "parkside")!
        .mains.some((d) => /allergen awareness zone/i.test(d.station));
    expect(station(base)).toBe(false);
    expect(station({ ...base, aaz: true })).toBe(true);
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
  it("rejects the same dish twice", () =>
    expect(run({ picks: [base.picks[0], base.picks[0]] }).passed).toBe(false));
  it("rejects a made-up walking time", () => {
    const all = dishes.map((d) => ({ ...d, allergens: [...d.allergens], prefs: [...d.prefs], tags: [] }));
    const withWalk = (summary: string) => verify({ ...base, summary }, all, "Dinner", profile, [3, 12, 14]).passed;
    expect(withWalk("EVK is a 3 min walk and has good options.")).toBe(true);
    expect(withWalk("EVK is only a 2-minute walk.")).toBe(false);
  });
});

describe("walking distance", () => {
  const meal = "Dinner";
  const walkOf = (dorm: string | undefined) =>
    scoreHalls(days.get("2026-11-14")!, meal, cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [], dorm }));

  it("adds walk minutes for a known residence and none otherwise", () => {
    expect(walkOf("birnkrant").find((s) => s.hall === "evk")!.walk).toBe(1);
    expect(walkOf(undefined).every((s) => s.walk === null)).toBe(true);
    expect(walkOf("not-a-dorm").every((s) => s.walk === null)).toBe(true);
  });

  it("lowers the score of far halls without changing what's eligible", () => {
    const near = walkOf("parkside-irc");
    const none = walkOf(undefined);
    for (const hall of ["evk", "parkside", "university-village"]) {
      const a = near.find((s) => s.hall === hall)!;
      const b = none.find((s) => s.hall === hall)!;
      expect(a.mains.length).toBe(b.mains.length);
      expect(a.score).toBeLessThan(b.score);
    }
    const gap = (xs: typeof near) => xs.find((s) => s.hall === "parkside")!.score - xs.find((s) => s.hall === "evk")!.score;
    expect(gap(near)).toBeGreaterThan(gap(none));
  });
});

describe("student ratings in picks", () => {
  it("shows students' scores to the AI and puts top-rated dishes first without it", async () => {
    const [date, day] = [...days.entries()][0];
    const profile = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const meal = day.halls[0].meals[0];
    const top = scoreHalls(day, meal, profile)[0];
    const last = top.mains[top.mains.length - 1];
    const { dishKey } = await import("./ratings");
    const { buildPrompt } = await import("./recommend");
    const ratings = { [dishKey(last.name)]: { avg: 9.5, n: 4 } };
    expect(buildPrompt(profile, meal, scoreHalls(day, meal, profile), ratings)).toContain(`${last.name} |`);
    expect(buildPrompt(profile, meal, scoreHalls(day, meal, profile), ratings)).toContain("students: 9.5/10 (4)");
    const rec = await recommend(day, meal, profile, ratings);
    expect(rec.date).toBe(date);
    if (rec.hall === top.hall) expect(rec.picks[0].name).toBe(last.name);
  });
});

describe("rulesOnly switch", () => {
  it("never calls the model and still passes the verifier", async () => {
    const [, day] = [...days.entries()][0];
    const profile = cleanProfile({ avoid: ["sesame"], diet: [], likes: [], dislikes: [] });
    const meal = day.halls[0].meals[0];
    const rec = await recommend(day, meal, profile, undefined, { rulesOnly: true });
    expect(rec.source).toBe("rules");
    expect(rec.attempts).toBe(0);
    expect(rec.verification.passed).toBe(true);
  });
});

describe("language", () => {
  it.each(["es", "zh", "ko", "hi", "vi"] as const)("asks for %s, keeps dish names, and the fallback still verifies", async (lang) => {
    const [, day] = [...days.entries()][0];
    const profile = cleanProfile({ avoid: ["sesame"], diet: [], likes: [], dislikes: [], dorm: "new-north", lang });
    const meal = day.halls[0].meals[0];
    const { buildPrompt } = await import("./recommend");
    const scores = scoreHalls(day, meal, profile);
    const prompt = buildPrompt(profile, meal, scores);
    expect(prompt).toMatch(/^Language: write "summary"/m);
    // Dish names go to the model untouched.
    const first = scores.find((s) => s.mains.length)!.mains[0];
    expect(prompt).toContain(`| ${first.name} |`);
    const rec = await recommend(day, meal, profile, undefined, { rulesOnly: true });
    expect(rec.verification.passed).toBe(true);
    expect(rec.summary).not.toMatch(/is your best match/);
  });

  it("English profiles get no language line", async () => {
    const [, day] = [...days.entries()][0];
    const meal = day.halls[0].meals[0];
    const profile = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [], lang: "en" });
    expect(profile.lang).toBeUndefined();
    const { buildPrompt } = await import("./recommend");
    expect(buildPrompt(profile, meal, scoreHalls(day, meal, profile))).not.toContain("Language:");
  });
});

describe("I ate this", () => {
  it("lowers a recently eaten dish without hiding it, and tells the AI", async () => {
    const [date, day] = [...days.entries()][0];
    const meal = day.halls[0].meals[0];
    const base = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const top = scoreHalls(day, meal, base).find((s) => s.mains.length > 1)!;
    const first = top.mains[0];
    const yesterday = new Date(Date.parse(`${date}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
    const profile = cleanProfile({ ...base, ate: [{ name: first.name, cuisine: first.cuisine, protein: first.protein, date: yesterday }] });
    const after = scoreHalls(day, meal, profile).find((s) => s.hall === top.hall)!;
    expect(after.mains.map((d) => d.id)).toContain(first.id);
    expect(after.mains.findIndex((d) => d.id === first.id)).toBeGreaterThanOrEqual(0);
    expect(after.score).toBeLessThan(top.score);
    const { buildPrompt } = await import("./recommend");
    expect(buildPrompt(profile, meal, scoreHalls(day, meal, profile), undefined, date)).toContain(`${first.name} (yesterday)`);
    const rec = await recommend(day, meal, profile, undefined, { rulesOnly: true });
    expect(rec.verification.passed).toBe(true);
  });
});

describe("closing soon", () => {
  it("ranks a closing hall below the others, tells the AI, and the verifier rejects picking it", async () => {
    const [, day] = [...days.entries()][0];
    const meal = day.halls[0].meals[0];
    const profile = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const top = scoreHalls(day, meal, profile)[0];
    const closing = { [top.hall]: { state: "closing" as const, minutesLeft: 12, closesAt: "8:00PM" } };
    const scores = scoreHalls(day, meal, profile, closing);
    const others = scores.filter((s) => s.hall !== top.hall && s.open && s.mains.length + s.sides.length > 0);
    if (others.length === 0) return;
    expect(scores[0].hall).not.toBe(top.hall);
    expect(scores.find((s) => s.hall === top.hall)!.mains.length).toBe(top.mains.length);
    const { buildPrompt } = await import("./recommend");
    expect(buildPrompt(profile, meal, scores)).toContain("CLOSING SOON at 8:00PM");
    const rec = await recommend(day, meal, profile, undefined, { rulesOnly: true, closing });
    expect(rec.hall).not.toBe(top.hall);
    expect(rec.verification.passed).toBe(true);
    const bad = verify({ hall: top.hall, picks: [{ dishId: top.mains[0].id, why: "Good.", claims: [] }], summary: "Go." }, day.halls.flatMap((h) => h.dishes), meal, profile, [], {
      halls: [top.hall],
      otherHasFood: true,
    });
    expect(bad.passed).toBe(false);
  });

  it("still picks a closing hall when it's the only one with food", async () => {
    const [, day] = [...days.entries()][0];
    const meal = day.halls[0].meals[0];
    const profile = cleanProfile({ avoid: [], diet: [], likes: [], dislikes: [] });
    const closing = Object.fromEntries(day.halls.map((h) => [h.hall, { state: "closing" as const, minutesLeft: 10, closesAt: "8:00PM" }]));
    const rec = await recommend(day, meal, profile, undefined, { rulesOnly: true, closing });
    expect(rec.picks.length).toBeGreaterThan(0);
    expect(rec.verification.passed).toBe(true);
  });
});
