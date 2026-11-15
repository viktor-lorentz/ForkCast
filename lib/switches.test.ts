import { describe, expect, it } from "vitest";
import { getSwitches, parseSwitches, SWITCHES_OFF } from "./switches";

describe("emergency switches", () => {
  it("are all off when Global/Edge Config isn't connected", async () => {
    expect(await getSwitches({})).toEqual(SWITCHES_OFF);
  });
  it("read flags loosely and keep the banner to one short line", () => {
    expect(parseSwitches({ useSavedMenus: true, rulesOnly: "true", banner: "  Menus are\n from earlier today  " })).toEqual({
      useSavedMenus: true,
      rulesOnly: true,
      banner: "Menus are from earlier today",
    });
    expect(parseSwitches({ useSavedMenus: "no", rulesOnly: 0, banner: 5 })).toEqual(SWITCHES_OFF);
    expect(parseSwitches(null)).toEqual(SWITCHES_OFF);
    expect(parseSwitches({ banner: "x".repeat(500) }).banner).toHaveLength(140);
  });
});
