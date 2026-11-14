/**
 * Eating styles USC has no label for. Unlike allergens and the vegan/vegetarian/halal labels,
 * these are judged from the dish name, the AI's protein tag and the AI's macro estimate,
 * so the UI calls them a best guess. They are still applied by code, never by the model's say-so.
 */
export const STYLE_IDS = ["pescatarian", "keto", "word-of-wisdom"] as const;
export type StyleId = (typeof STYLE_IDS)[number];

export const STYLES: { id: StyleId; name: string; blurb: string }[] = [
  { id: "pescatarian", name: "Pescatarian", blurb: "Fish and seafood, no other meat" },
  { id: "keto", name: "Keto / low carb", blurb: "Hides dishes estimated over 15g carbs" },
  { id: "word-of-wisdom", name: "Word of Wisdom", blurb: "No coffee, tea or alcohol in the dish" },
];

export const KETO_MAX_CARBS = 15;

const MEAT = /chicken|beef|pork|turkey|lamb|bacon|\bham\b|sausage|meat|duck|pepperoni|salami|chorizo|steak|brisket|carnitas|prosciutto|pastrami|veal|\bribs?\b/i;
const NOT_WOW = /coffee|espresso|mocha|latte|cappuccino|tiramisu|\bteas?\b|\bchai\b|matcha|kombucha|\bwine\b|\bbeer\b|bourbon|whiskey|\brum\b|vodka|tequila|\bsake\b|brandy|marsala|kahlua|amaretto|sherry|liqueur/i;

interface StyleDish {
  name: string;
  protein: string;
  allergens: string[];
  prefs: string[];
  macros?: { carbs: number } | null;
}

/** The first chosen style this dish doesn't fit, or null. */
export function styleConflict(d: StyleDish, styles: StyleId[] | undefined): StyleId | null {
  for (const s of styles ?? []) {
    if (s === "pescatarian") {
      const meatless = d.prefs.includes("vegetarian") || d.prefs.includes("vegan");
      const seafood = (d.allergens.includes("fish") || d.allergens.includes("shellfish")) && !d.allergens.includes("pork") && !MEAT.test(`${d.name} ${d.protein}`);
      if (!meatless && !seafood) return s;
    }
    // Without a macro estimate there is nothing to judge, so the dish stays.
    if (s === "keto" && d.macros && d.macros.carbs > KETO_MAX_CARBS) return s;
    if (s === "word-of-wisdom" && NOT_WOW.test(d.name)) return s;
  }
  return null;
}

export const STYLE_REASONS: Record<StyleId, string> = {
  pescatarian: "Looks like it has meat other than fish (from the dish name, not a USC label)",
  keto: `Estimated over ${KETO_MAX_CARBS}g carbs (AI estimate, not a USC label)`,
  "word-of-wisdom": "Name mentions coffee, tea or alcohol",
};
