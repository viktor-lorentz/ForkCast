import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import type { Macros } from "./plate";
import type { Dish } from "./types";

export const KINDS = ["main", "side", "condiment", "dessert", "drink", "notice"] as const;
export type Kind = (typeof KINDS)[number];

/** What the AI adds to a dish. Never allergens or diet labels: those come only from USC. */
export interface DishInfo {
  kind: Kind;
  cuisine: string;
  protein: string;
  spicy: boolean;
  tags: string[];
  /** Estimated from the dish name for one typical serving. Null when the AI didn't tag the dish or it isn't food. */
  macros?: Macros | null;
}

export type EnrichedDish = Dish & DishInfo & { aiTagged: boolean };

const BatchSchema = z.object({
  dishes: z.array(
    z.object({
      i: z.number().int().describe("index of the dish name in the input list"),
      kind: z.enum(KINDS),
      cuisine: z.string().describe("short cuisine, e.g. american, mexican, italian, asian, mediterranean, indian, none"),
      protein: z.string().describe("main protein, e.g. chicken, beef, pork, fish, tofu, eggs, beans, cheese, none"),
      spicy: z.boolean(),
      tags: z.array(z.string()).describe("2-4 lowercase food-type words, e.g. rice, bowl, pasta, burger, salad, soup, sandwich, pizza, breakfast, fried, grilled"),
      cal: z.number().int().describe("estimated calories in one typical dining-hall serving; 0 for a notice"),
      protein_g: z.number().int().describe("estimated grams of protein in that serving"),
      carbs_g: z.number().int().describe("estimated grams of carbohydrate in that serving"),
      fat_g: z.number().int().describe("estimated grams of fat in that serving"),
    }),
  ),
});

const SYSTEM = `You classify items from a university dining hall menu so students can find real meals.
Kinds:
- main: a dish that can be the center of a meal (entree, burger, pasta, omelette, stir fry, pizza, bowl)
- side: rice, fries, vegetables, bread, fruit, salad components, soup, yogurt, cereal
- condiment: sauces, dressings, spreads, butter, toppings, seasonings, syrups
- dessert: sweets, pastries, cookies, cake, ice cream
- drink: beverages
- notice: not food; an announcement or label such as "GRILL ITEMS AVAILABLE AT 11AM" or "SALAD BAR"
Ingredients offered at a build-your-own station (omelette fillings like "Egg Whites" or "Chopped Bacon", crepe or salad bar toppings) are condiments, not mains.
Each line is "index. name [station]". Classify from the name and station only. Do not guess allergens or dietary labels.
Also estimate nutrition for one typical self-serve dining-hall serving of the item as named (an entree portion for mains, one scoop or piece for sides, one spoonful for condiments). Use realistic values a dietitian would accept as a rough estimate, and keep calories consistent with the grams (4 per gram of protein or carbs, 9 per gram of fat).`;

const cache = new Map<string, DishInfo>();

/** Code-only fallback used when the API is unavailable. Conservative: unknown items become sides. */
export function heuristicInfo(name: string): DishInfo {
  const n = name.toLowerCase();
  const letters = name.replace(/[^a-zA-Z]/g, "");
  const shouting = letters.length > 3 && letters === letters.toUpperCase();
  let kind: Kind = "side";
  if (shouting || /\bavailable\b|\buntil\b|made to order|\bbar$/.test(n)) kind = "notice";
  else if (/sauce|dressing|vinaigrette|jelly|preserves|butter balls|cream cheese|syrup|salsa|ketchup|mustard|mayo|topping|sprinkles|chips$|seasoning|oregano|hummus/.test(n)) kind = "condiment";
  else if (/cookie|cake|brownie|pie\b|muffin|pastr|crepe|donut|pudding|ice cream|sweet/.test(n)) kind = "dessert";
  else if (/juice|coffee|tea\b|milk$|lemonade|soda/.test(n)) kind = "drink";
  else if (/burger|chicken|beef|pork|fish|salmon|tofu|pasta|pizza|taco|burrito|curry|stir fry|omelet|sandwich|wrap|bowl|ribs|roast|lentil|enchilada/.test(n)) kind = "main";
  return { kind, cuisine: "none", protein: "none", spicy: /spicy|jalape|chipotle|sriracha|buffalo|hot /.test(n), tags: [], macros: null };
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)));

async function classifyBatch(names: string[], stations: Map<string, string>): Promise<Map<string, DishInfo>> {
  const client = getClient();
  if (!client) throw new Error("ANTHROPIC_API_KEY not set");
  const response = await client.messages.parse({
    model: MODELS.fast,
    max_tokens: 16000,
    output_config: { effort: "low", format: zodOutputFormat(BatchSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: names.map((name, i) => `${i}. ${name} [${stations.get(name) ?? ""}]`).join("\n") }],
  });
  const out = new Map<string, DishInfo>();
  for (const d of response.parsed_output?.dishes ?? []) {
    const name = names[d.i];
    if (name)
      out.set(name, {
        kind: d.kind, cuisine: d.cuisine, protein: d.protein, spicy: d.spicy,
        tags: d.tags.slice(0, 4),
        macros: d.kind === "notice" ? null : { cal: clamp(d.cal, 2000), protein: clamp(d.protein_g, 150), carbs: clamp(d.carbs_g, 300), fat: clamp(d.fat_g, 150) },
      });
  }
  return out;
}

/**
 * Adds kind/cuisine/protein/tags and estimated macros to each dish. Unique names are classified once (batched, in parallel)
 * and cached for the life of the server. Any name the model misses gets the heuristic instead.
 */
export async function enrichDishes(dishes: Dish[], batchSize = 20): Promise<EnrichedDish[]> {
  const missing = [...new Set(dishes.map((d) => d.name))].filter((n) => !cache.has(n));
  if (missing.length > 0 && getClient()) {
    const batches: string[][] = [];
    for (let i = 0; i < missing.length; i += batchSize) batches.push(missing.slice(i, i + batchSize));
    const stations = new Map(dishes.map((d) => [d.name, d.station]));
    const results = await Promise.allSettled(batches.map((b) => classifyBatch(b, stations)));
    for (const r of results) {
      if (r.status === "fulfilled") r.value.forEach((info, name) => cache.set(name, info));
      else console.warn("Dish classification batch failed:", r.reason);
    }
  }
  return dishes.map((d) => {
    const info = cache.get(d.name);
    return { ...d, ...(info ?? heuristicInfo(d.name)), aiTagged: Boolean(info) };
  });
}
