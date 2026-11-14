import { describe, expect, it } from "vitest";
import { applyScore, dishKey, formatAvg, isScore, summarize, validRater } from "./ratings";

describe("student ratings", () => {
  it("matches the same dish across halls and days by name", () => {
    expect(dishKey("Watermelon  Chicken!")).toBe(dishKey("watermelon chicken"));
  });
  it("only accepts whole scores from 1 to 10", () => {
    expect([0, 1, 10, 11, 5.5, "7"].map(isScore)).toEqual([false, true, true, false, false, false]);
  });
  it("averages scores and ignores junk", () => {
    expect(summarize([8, 6, "x", 99])).toEqual({ avg: 7, n: 2 });
    expect(summarize([])).toBeNull();
  });
  it("updates the average when a student rates or changes their score", () => {
    const s = { avg: 7, n: 2 };
    expect(applyScore(s, null, 10)).toEqual({ avg: 8, n: 3 });
    expect(applyScore(s, 6, 10)).toEqual({ avg: 9, n: 2 });
    expect(applyScore({ avg: 5, n: 1 }, 5, null)).toBeNull();
    expect(applyScore(null, null, 4)).toEqual({ avg: 4, n: 1 });
  });
  it("shows one decimal, dropping .0", () => {
    expect(formatAvg(8)).toBe("8");
    expect(formatAvg(7.66)).toBe("7.7");
  });
  it("needs a real rater id", () => {
    expect(validRater(crypto.randomUUID())).toBe(true);
    expect(validRater("x")).toBe(false);
    expect(validRater("a b c d e f g h")).toBe(false);
  });
});
