export const HALLS = [
  { id: "evk", name: "Everybody's Kitchen", short: "EVK" },
  { id: "parkside", name: "Parkside", short: "Parkside" },
  { id: "university-village", name: "USC Village", short: "Village" },
] as const;

export type HallId = (typeof HALLS)[number]["id"];

/** USC's allergen codes, in the order their site lists them. */
export const ALLERGENS = [
  "dairy",
  "eggs",
  "fish",
  "gluten",
  "peanuts",
  "pork",
  "sesame",
  "shellfish",
  "soy",
  "tree-nuts",
] as const;
export type Allergen = (typeof ALLERGENS)[number];

/** USC marks some items "Food Not Analyzed For Allergens". */
export const NOT_ANALYZED = "not-analyzed";

export const PREFERENCES = ["halal-ingredients", "vegan", "vegetarian"] as const;
export type Preference = (typeof PREFERENCES)[number];

export const LABEL_NAMES: Record<string, string> = {
  dairy: "Dairy",
  eggs: "Eggs",
  fish: "Fish",
  gluten: "Gluten/Wheat",
  peanuts: "Peanuts",
  pork: "Pork",
  sesame: "Sesame",
  shellfish: "Shellfish",
  soy: "Soy",
  "tree-nuts": "Tree Nuts",
  "not-analyzed": "Not analyzed for allergens",
  "halal-ingredients": "Halal ingredients",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
};

/** One menu line as USC publishes it, normalized. Labels are copied verbatim from USC. */
export interface Dish {
  id: string;
  hall: HallId;
  meal: string;
  station: string;
  name: string;
  /** USC allergen codes, including "not-analyzed" when present. */
  allergens: string[];
  /** USC preference codes (halal-ingredients, vegan, vegetarian). */
  prefs: string[];
}

export interface HallMenu {
  hall: HallId;
  date: string;
  /** Meal names that have at least one station, in USC's order. */
  meals: string[];
  dishes: Dish[];
}

export interface DayMenus {
  date: string;
  source: "live" | "snapshot";
  halls: HallMenu[];
}

/** Raw shape returned by USC's hsp-api endpoint. */
export interface UscRawMenu {
  date?: string;
  location?: string;
  meals?: {
    name: string;
    stations?: {
      station: string;
      subtitle?: string;
      menu?: { item: string; allergens?: string[]; preferences?: string[] }[];
    }[];
  }[];
}
