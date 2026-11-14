import { describe, expect, it } from "vitest";
import { addDays, getDayMenus, normalize, todayLA } from "./usc";

describe("normalize", () => {
  it("keeps USC labels verbatim and skips empty meals", () => {
    const menu = normalize("evk", "2026-11-14", {
      meals: [
        { name: "Breakfast" },
        {
          name: "Dinner",
          stations: [
            {
              station: "Hot Line ",
              menu: [
                { item: "  Sesame  Noodles ", allergens: ["gluten", "sesame"], preferences: ["vegan"] },
                { item: "Sesame Noodles", allergens: ["gluten", "sesame"], preferences: ["vegan"] },
              ],
            },
          ],
        },
      ],
    });
    expect(menu.meals).toEqual(["Dinner"]);
    expect(menu.dishes).toHaveLength(2);
    expect(menu.dishes[0]).toMatchObject({
      hall: "evk",
      meal: "Dinner",
      station: "Hot Line",
      name: "Sesame Noodles",
      allergens: ["gluten", "sesame"],
      prefs: ["vegan"],
    });
    expect(menu.dishes[0].id).not.toEqual(menu.dishes[1].id);
  });
});

describe("dates", () => {
  it("formats LA dates and adds days across month ends", () => {
    expect(todayLA(new Date("2026-11-15T06:00:00Z"))).toBe("2026-11-14");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});

describe("getDayMenus in demo mode", () => {
  it("reads all three halls from the saved snapshot", async () => {
    process.env.DEMO_MODE = "1";
    const day = await getDayMenus("2026-11-14");
    expect(day.source).toBe("snapshot");
    expect(day.halls.map((h) => h.hall)).toEqual(["evk", "parkside", "university-village"]);
    expect(day.halls.every((h) => h.dishes.length > 0)).toBe(true);
    delete process.env.DEMO_MODE;
  });
});
