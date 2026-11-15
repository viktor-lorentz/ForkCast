import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { hideReason } from "./filter";
import { cleanProfile } from "./profile";
import { STARTERS } from "./starters";

const dish = (allergens: string[], prefs: string[] = []) =>
  ({ id: "x", name: "Test Dish", station: "Grill", kind: "main", allergens, prefs, cuisine: "american", protein: "none" }) as never;

describe("one-tap starters", () => {
  it("are valid profiles with unique ids", () => {
    expect(new Set(STARTERS.map((s) => s.id)).size).toBe(STARTERS.length);
    for (const s of STARTERS) expect(cleanProfile(s.profile)).toEqual(s.profile);
  });
  it("set USC label filters that code enforces", () => {
    const by = (id: string) => STARTERS.find((s) => s.id === id)!.profile;
    expect(hideReason(dish(["tree-nuts"]), by("nut-allergy"))).toMatchObject({ type: "allergen", label: "tree-nuts" });
    expect(hideReason(dish(["peanuts"]), by("nut-allergy"))).toMatchObject({ type: "allergen", label: "peanuts" });
    // "Not analyzed" dishes are hidden from any allergy profile.
    expect(hideReason(dish(["not-analyzed"]), by("gluten-free"))).toMatchObject({ type: "not-analyzed" });
    expect(hideReason(dish([], ["vegetarian"]), by("vegan"))).toMatchObject({ type: "diet", label: "vegan" });
    expect(hideReason(dish([], []), by("halal"))).toMatchObject({ type: "diet", label: "halal-ingredients" });
    expect(hideReason(dish(["dairy"]), by("none"))).toBeNull();
    expect(by("high-protein").goal).toBe("muscle");
  });
  it("never use the word safe in their labels", () => {
    for (const s of STARTERS) expect(s.label.toLowerCase()).not.toContain("safe");
  });
  it("don't touch any saved test profile format", () => {
    const dir = path.join(process.cwd(), "data", "test-profiles");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) expect(() => cleanProfile(JSON.parse(readFileSync(path.join(dir, f), "utf8")).profile)).not.toThrow();
  });
});
