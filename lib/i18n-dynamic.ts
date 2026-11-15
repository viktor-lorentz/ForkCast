import { GOALS } from "./plate";
import { STARTERS } from "./starters";
import { STYLES } from "./styles";
import { LABEL_NAMES } from "./types";
import { EXACT_SERVER_STRINGS, PATTERN_KEYS } from "./i18n-patterns";

/**
 * Strings that reach the screen from data rather than from a t("...") literal in a component.
 * The i18n script and test include these, so they're always translated too.
 */
export const LIKE_IDEAS = ["spicy", "rice", "chicken", "pasta", "mexican", "asian", "burger", "salad", "breakfast", "soup"];
export const NEVER_IDEAS = ["beef", "chicken", "lamb", "mushroom"];
export const MEALS = ["Breakfast", "Brunch", "Lunch", "Dinner", "mains", "sides", "Mains", "Sides", "Desserts", "this meal"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Closed"];
/** Cuisine and protein tags from the AI tagger that show up in "Leaning toward ...". */
const FOOD_WORDS = ["american", "mexican", "italian", "asian", "mediterranean", "indian", "chinese", "japanese", "korean", "thai", "vietnamese", "middle eastern", "latin", "chicken", "beef", "pork", "fish", "tofu", "eggs", "beans", "cheese", "turkey", "lamb", "shrimp", "seafood", "vegetables", "mushroom", "turkey"];
const SCORE_WORDS = ["Get it again", "Pretty good", "It's fine", "Not great", "Skip it"];
const THUMBS = ["Thumbs up: more like {dish}", "Thumbs down: less like {dish}"];

export const DYNAMIC_STRINGS: string[] = [
  ...Object.values(LABEL_NAMES),
  ...STYLES.flatMap((s) => [s.name, s.blurb]),
  ...GOALS.flatMap((g) => [g.name, g.blurb, g.plateName]),
  ...STARTERS.map((s) => s.label),
  ...LIKE_IDEAS,
  ...NEVER_IDEAS.map((w) => w[0].toUpperCase() + w.slice(1)),
  ...MEALS,
  ...DAYS,
  ...FOOD_WORDS,
  ...SCORE_WORDS,
  ...THUMBS,
  ...EXACT_SERVER_STRINGS,
  ...PATTERN_KEYS,
];
