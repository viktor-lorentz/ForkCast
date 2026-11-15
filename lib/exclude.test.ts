import { describe, expect, it } from "vitest";
import { allergenFor, cleanExclude, excludedFood } from "./exclude";
import { hideReason } from "./filter";
import { cleanProfile } from "./profile";
import { packProfile, unpackProfile } from "./share";

const dish = (name: string, protein = "none") => ({ name, protein });

describe("foods you never eat", () => {
  it("catches beef by name and by the AI's protein tag", () => {
    expect(excludedFood(dish("Braised Corned Beef Brisket"), ["beef"])).toBe("beef");
    expect(excludedFood(dish("Classic Cheeseburger"), ["beef"])).toBe("beef");
    expect(excludedFood(dish("Beef Burger on Martin's Potato Bun"), ["beef"])).toBe("beef");
    expect(excludedFood(dish("Swedish Meatballs"), ["beef"])).toBe("beef");
    expect(excludedFood(dish("Mongolian Stir Fry", "beef"), ["beef"])).toBe("beef");
    expect(excludedFood(dish("Garlic and Herb Roasted Chicken", "chicken"), ["beef"])).toBe(null);
  });
  it("doesn't hide plant-based look-alikes", () => {
    expect(excludedFood(dish("Impossible Burger"), ["beef"])).toBe(null);
    expect(excludedFood(dish("Veggie Burger"), ["meat"])).toBe(null);
  });
  it("handles plurals and other foods", () => {
    expect(cleanExclude("Mushrooms ")).toBe("mushroom");
    expect(cleanExclude("tomatoes")).toBe("tomato");
    expect(excludedFood(dish("Mushroom Risotto"), ["mushroom"])).toBe("mushroom");
    expect(excludedFood(dish("Portobello Sandwich"), ["mushroom"])).toBe("mushroom");
    expect(excludedFood(dish("Lamb Gyro Wrap"), ["lamb"])).toBe("lamb");
    expect(excludedFood(dish("Okra Masala"), ["olive"])).toBe(null);
  });
  it("turns label-like words into USC allergen labels", () => {
    expect(allergenFor("pork")).toBe("pork");
    expect(allergenFor("Shrimp")).toBe("shellfish");
    expect(allergenFor("beef")).toBe(null);
  });
  it("hides the dish with an honest reason and survives the share link", () => {
    const p = cleanProfile({ avoid: ["pork"], diet: [], likes: [], dislikes: [], exclude: ["Beef"] });
    expect(p.exclude).toEqual(["beef"]);
    const d = { name: "Beef Tacos", protein: "beef", allergens: [], prefs: [], station: "Grill", kind: "main" } as never;
    expect(hideReason(d, p)).toEqual({ type: "exclude", food: "beef" });
    expect(unpackProfile(`#p=${packProfile(p)}`)?.exclude).toEqual(["beef"]);
  });
});
