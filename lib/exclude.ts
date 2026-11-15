import { ALLERGENS, type Allergen } from "./types";

/**
 * Foods a student never eats that USC doesn't label (beef, lamb, mushrooms...).
 * Matched against the dish name and the AI's main-protein tag, so it's a best guess, not a USC label.
 */
const SYNONYMS: Record<string, string[]> = {
  beef: ["beef", "steak", "brisket", "burger", "cheeseburger", "hamburger", "meatball", "short rib", "pastrami", "carne asada", "bulgogi", "barbacoa", "veal", "sirloin", "ribeye", "chili con carne", "philly cheesesteak", "cheesesteak", "meatloaf", "bolognese", "taco meat", "picadillo", "pot roast"],
  chicken: ["chicken", "wings", "tenders", "nuggets", "drumstick", "poultry"],
  turkey: ["turkey"],
  lamb: ["lamb", "mutton", "gyro"],
  duck: ["duck"],
  mushroom: ["mushroom", "portobello", "shiitake", "cremini"],
  onion: ["onion", "scallion", "shallot", "leek"],
  garlic: ["garlic"],
  tomato: ["tomato", "marinara", "salsa roja"],
  cilantro: ["cilantro"],
  avocado: ["avocado", "guacamole"],
  corn: ["corn", "polenta", "tortilla chips"],
  pepper: ["bell pepper", "peppers"],
  coconut: ["coconut"],
  meat: ["chicken", "beef", "pork", "turkey", "lamb", "bacon", "ham", "sausage", "meat", "duck", "pepperoni", "salami", "chorizo", "steak", "brisket", "carnitas", "prosciutto", "pastrami", "veal", "ribs", "burger", "cheeseburger", "hamburger", "meatball", "gyro"],
  "red meat": ["beef", "pork", "lamb", "steak", "brisket", "burger", "cheeseburger", "hamburger", "bacon", "ham", "sausage", "pepperoni", "veal", "meatball", "gyro"],
};

/** Plant-based look-alikes that shouldn't count as the real thing. */
const MEATLESS = /\b(veggie|vegan|vegetarian|impossible|beyond|plant[- ]based|meatless|black bean burger|garden burger|tofu)\b/i;
const MEATS = new Set(["beef", "chicken", "turkey", "lamb", "duck", "meat", "red meat"]);

/** Words that are really USC allergen labels: these become real label filters instead. */
const AS_ALLERGEN: Record<string, Allergen> = {
  pork: "pork", bacon: "pork", ham: "pork", milk: "dairy", dairy: "dairy", cheese: "dairy", lactose: "dairy", egg: "eggs", eggs: "eggs",
  fish: "fish", seafood: "fish", gluten: "gluten", wheat: "gluten", peanut: "peanuts", peanuts: "peanuts", sesame: "sesame",
  shellfish: "shellfish", shrimp: "shellfish", crab: "shellfish", lobster: "shellfish", soy: "soy", tofu: "soy",
  nuts: "tree-nuts", "tree nuts": "tree-nuts", almond: "tree-nuts", walnut: "tree-nuts", cashew: "tree-nuts",
};

/** "Mushrooms " → "mushroom"; keeps it to a short phrase. */
export function cleanExclude(word: string): string {
  const w = word.trim().toLowerCase().replace(/[^a-z\s-]/g, "").replace(/\s+/g, " ").slice(0, 30);
  if (SYNONYMS[w] || AS_ALLERGEN[w]) return w;
  const single = w.replace(/(oes|es|s)$/, (m) => (m === "oes" ? "o" : m === "es" && /(ch|sh|x|s)es$/.test(w) ? "" : m === "es" ? "e" : ""));
  return SYNONYMS[single] || AS_ALLERGEN[single] ? single : w;
}

/** The USC allergen label a typed word stands for (e.g. "pork", "shrimp"), if any. */
export function allergenFor(word: string): Allergen | null {
  const a = AS_ALLERGEN[cleanExclude(word)];
  return a && (ALLERGENS as readonly string[]).includes(a) ? a : null;
}

const pattern = (term: string) => new RegExp(`\\b${term.replace(/[-\s]+/g, "[-\\s]+")}(e?s)?\\b`, "i");

/** The excluded food this dish seems to contain, or null. */
export function excludedFood(dish: { name: string; protein?: string }, exclude: string[] | undefined): string | null {
  if (!exclude?.length) return null;
  for (const word of exclude) {
    const terms = SYNONYMS[word] ?? [word];
    const meat = MEATS.has(word);
    if (meat && MEATLESS.test(dish.name)) continue;
    if (terms.some((t) => pattern(t).test(dish.name))) return word;
    if (meat && dish.protein && terms.includes(dish.protein.toLowerCase())) return word;
  }
  return null;
}
