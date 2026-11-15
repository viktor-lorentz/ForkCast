import { describe, expect, it } from "vitest";
import { DICTS, makeT, translate } from "./i18n";
import { allKeys } from "./i18n-keys";
import { trClaim, trServer } from "./i18n-patterns";
import { overstatesSafety } from "./lang";

const keys = allKeys();
const holes = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort().join();

describe("translations", () => {
  it("finds the app's strings", () => {
    expect(keys.length).toBeGreaterThan(250);
    expect(keys).toContain("I ate this");
    expect(keys).toContain("Dining hall hours");
  });

  describe.each(Object.entries(DICTS))("%s", (lang, dict) => {
    it("has every string (run `npm run i18n` after adding UI text)", () => {
      expect(keys.filter((k) => !dict[k])).toEqual([]);
    });
    it("keeps every {placeholder}", () => {
      for (const k of keys) expect(holes(dict[k] ?? k), `${lang}: ${k}`).toBe(holes(k));
    });
    it('never says "safe" or "allergen-free"', () => {
      for (const k of keys) expect(overstatesSafety(dict[k] ?? ""), `${lang}: ${dict[k]}`).toBe(false);
    });
    it("shows no calorie or gram numbers", () => {
      for (const k of keys) expect(dict[k] ?? "", `${lang}: ${k}`).not.toMatch(/\d+\s*(g|kcal|cal)\b/i);
    });
  });
});

describe("translate", () => {
  it("fills placeholders and falls back to English", () => {
    expect(translate("en", "{n} min walk", { n: 7 })).toBe("7 min walk");
    expect(translate("es", "a string nobody translated")).toBe("a string nobody translated");
    expect(translate("es", "Closes in {n} min", { n: 20 })).toContain("20");
  });

  it("translates server strings and claims, keeping hall and dish names", () => {
    const es = makeT("es");
    expect(trServer(es, "USC Village is a real dining hall")).toContain("USC Village");
    expect(trServer(es, "USC Village is a real dining hall")).not.toBe("USC Village is a real dining hall");
    expect(trServer(es, "Contains Sesame (USC label)")).toContain(DICTS.es["Sesame"]);
    expect(trServer(es, "You had this 3 days ago")).toContain("3");
    expect(trServer(makeT("en"), "Closes in 20 min")).toBe("Closes in 20 min");
    expect(trClaim(es, "no:sesame")).toContain(DICTS.es["Sesame"]);
    expect(trClaim(makeT("en"), "halal-ingredients")).toBe("Halal ingredients");
  });
});
