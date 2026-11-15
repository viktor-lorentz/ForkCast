import { describe, expect, it } from "vitest";
import { closingFor, closingKey, closingMap, closingText, isClosing } from "./closing";
import type { HallHours } from "./hours";

const week = (hours: string) => Object.fromEntries(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => [d, hours]));
const evk: HallHours = { hall: "evk", regular: week("7:00AM – 10:00PM"), special: [] };
const parkside: HallHours = { hall: "parkside", regular: week("7:00AM – 8:00PM"), special: [{ label: "Game day", date: "11/14", hours: "Closed" }] };
const at = (h: number, m = 0) => h * 60 + m;
const D = "2026-11-13"; // a Friday

describe("closingFor", () => {
  it("is open with time to spare", () => {
    expect(closingFor(evk, D, at(20), 10)).toEqual({ state: "open", minutesLeft: 120, closesAt: "10:00PM" });
  });
  it("is closing when the walk plus 15 minutes doesn't fit", () => {
    expect(closingFor(evk, D, at(21, 40), 10)).toMatchObject({ state: "closing", minutesLeft: 20 });
    expect(closingFor(evk, D, at(21, 40), 4)).toMatchObject({ state: "open" });
    expect(closingFor(evk, D, at(21, 50), null)).toMatchObject({ state: "closing", minutesLeft: 10 });
  });
  it("is closed after closing time or on a closed day", () => {
    expect(closingFor(evk, D, at(22, 5), 5)?.state).toBe("closed");
    expect(closingFor(parkside, "2026-11-14", at(12), 5)?.state).toBe("closed");
  });
  it("says nothing before opening or when hours can't be read", () => {
    expect(closingFor(evk, D, at(6), 5)).toBeNull();
    expect(closingFor({ ...evk, regular: week("Varies") }, D, at(12), 5)).toBeNull();
  });
});

describe("text and keys", () => {
  it("labels clearly", () => {
    expect(closingText({ state: "closing", minutesLeft: 20, closesAt: "10:00PM" })).toBe("Closes in 20 min");
    expect(closingText({ state: "closed", minutesLeft: null, closesAt: null })).toBe("Closed now");
    expect(closingText({ state: "open", minutesLeft: 90, closesAt: "10:00PM" })).toBeNull();
  });
  it("cache key changes with the state, not every minute", () => {
    const a = closingMap([evk, parkside], D, at(19, 40), { evk: 5, parkside: 10 });
    const b = closingMap([evk, parkside], D, at(19, 42), { evk: 5, parkside: 10 });
    expect(isClosing(a.parkside)).toBe(true);
    expect(closingKey(a)).toBe("parkside:closing");
    expect(closingKey(a)).toBe(closingKey(b));
    expect(closingKey(closingMap([evk], D, at(12)))).toBe("none");
  });
});
