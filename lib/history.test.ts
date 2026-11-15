import { describe, expect, it } from "vitest";
import { ateNote, ateOn, daysAgo, historyNote, logAte, pruneHistory, recentPenalty, type Ate } from "./history";
import { cleanProfile, profileKey } from "./profile";
import { packProfile, unpackProfile } from "./share";

const T = "2026-11-14";
const bowl = { name: "Chicken Teriyaki Bowl", cuisine: "asian", protein: "chicken" };
const tacos = { name: "Chicken Tacos", cuisine: "mexican", protein: "chicken" };
const pasta = { name: "Pasta Primavera", cuisine: "italian", protein: "none" };

describe("history", () => {
  it("counts days", () => {
    expect(daysAgo("2026-11-13", T)).toBe(1);
    expect(daysAgo("2026-11-01", "2026-11-03")).toBe(2);
    expect(daysAgo("2026-10-31", "2026-11-01")).toBe(1);
  });

  it("logs, undoes and keeps only 7 days", () => {
    let h = logAte(undefined, bowl, "2026-11-01");
    h = logAte(h, tacos, T);
    expect(h.map((x) => x.name)).toEqual(["Chicken Tacos"]);
    expect(ateOn(h, "chicken tacos", T)).toBe(true);
    h = logAte(h, tacos, T); // same dish, same day: still one entry
    expect(h).toHaveLength(1);
    expect(logAte(h, tacos, T, false)).toEqual([]);
    expect(pruneHistory([{ ...bowl, date: "2026-11-08" }, { ...bowl, date: "2026-11-07" }], T)).toHaveLength(1);
  });

  it("says when you had it", () => {
    const h: Ate[] = [{ ...bowl, date: "2026-11-13" }];
    expect(ateNote(h, "Chicken Teriyaki Bowl", T)).toBe("You had this yesterday");
    expect(ateNote(h, "Chicken Teriyaki Bowl", "2026-11-16")).toBe("You had this 3 days ago");
    expect(ateNote(h, "Chicken Teriyaki Bowl", "2026-11-25")).toBeNull();
    expect(ateNote(h, "Pasta Primavera", T)).toBeNull();
  });

  it("lowers similar dishes lightly, the same dish most, and forgets after 3 days", () => {
    const h: Ate[] = [
      { ...bowl, date: "2026-11-13" },
      { ...tacos, date: "2026-11-12" },
    ];
    const same = recentPenalty(bowl, h, T);
    const chicken = recentPenalty({ name: "Roast Chicken", cuisine: "american", protein: "chicken" }, h, T);
    expect(same).toBeGreaterThan(chicken);
    expect(chicken).toBeGreaterThan(0);
    expect(recentPenalty(pasta, h, T)).toBe(0);
    expect(same).toBeLessThanOrEqual(2);
    expect(recentPenalty(bowl, h, "2026-11-17")).toBe(0);
  });

  it("tells the AI about patterns", () => {
    const h: Ate[] = [
      { ...bowl, date: "2026-11-13" },
      { ...tacos, date: "2026-11-12" },
    ];
    const note = historyNote(h, T);
    expect(note).toContain("Chicken Teriyaki Bowl (yesterday)");
    expect(note).toContain("Chicken Tacos (2 days ago)");
    expect(note).toContain("they had chicken on two of the last three days");
    expect(historyNote(h, "2026-11-20")).toBe("");
  });
});

describe("history in the profile", () => {
  const base = { avoid: [], diet: [], likes: [], dislikes: [] };
  it("travels in the share link and the cache key", () => {
    const p = cleanProfile({ ...base, ate: [{ ...bowl, date: "2026-11-13" }] });
    expect(unpackProfile(`#p=${packProfile(p)}`)?.ate).toEqual(p.ate);
    expect(profileKey(p)).not.toBe(profileKey(cleanProfile(base)));
  });
  it("drops duplicates and bad dates", () => {
    const p = cleanProfile({ ...base, ate: [{ ...bowl, date: T }, { ...bowl, name: "chicken teriyaki bowl", date: T }] });
    expect(p.ate).toHaveLength(1);
    expect(() => cleanProfile({ ...base, ate: [{ ...bowl, date: "yesterday" }] })).toThrow();
  });
});
