import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import { GOAL_IDS } from "./plate";
import { STYLE_IDS } from "./styles";
import { cleanProfile, type Profile } from "./profile";
import { allergenFor } from "./exclude";
import { ALLERGENS, PREFERENCES } from "./types";

const ParsedSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)).describe("allergens the student must avoid"),
  diet: z.array(z.enum(PREFERENCES)).describe("diet labels the student requires"),
  likes: z.array(z.string()).describe("1-2 word lowercase food likes, e.g. spicy, rice, chicken, mexican, pasta"),
  dislikes: z.array(z.string()).describe("1-2 word lowercase foods they'd rather not have but could eat, e.g. olives, cilantro"),
  exclude: z
    .array(z.string())
    .describe("1-2 word lowercase foods they never eat that are NOT allergen codes (allergy, religion, ethics or strong aversion), e.g. beef, lamb, mushroom, chicken, meat"),
  styles: z.array(z.enum(STYLE_IDS)).describe("eating styles the student clearly states"),
  goal: z.enum([...GOAL_IDS, "none"]).describe("fitness goal, only if clearly stated; otherwise none"),
});

const PARSE_SYSTEM = `Turn a college student's description of how they eat into a dining profile.
Allergen codes: ${ALLERGENS.join(", ")}. "gluten" covers wheat and celiac. Pork counts as an allergen code here.
Diet codes: halal-ingredients (halal or Muslim dietary rules), vegan, vegetarian.
Only include an allergen or diet code if the text clearly says so. Lactose intolerant means avoid dairy. Celiac means avoid gluten.
Eating styles: pescatarian, keto (keto or low carb), word-of-wisdom (Latter-day Saint / Mormon: no coffee, tea or alcohol).
Fitness goal: muscle (build muscle, high protein, lifting), cut (lose fat, lean out, fewer calories), bulk (gain weight, eat more); "none" unless clearly stated.
Foods the student says they don't or can't eat: if it matches an allergen code put it in avoid (pork, bacon and ham → pork; shrimp → shellfish), otherwise put it in exclude (e.g. "I don't eat beef or pork" → avoid: pork, exclude: beef). Hindu students often avoid beef. Never drop a food the student says they don't eat.
Put softer food preferences in likes and dislikes as short lowercase words.`;

/** Free text → profile fields. The UI shows the result as chips for the student to confirm. */
export async function parseProfileText(text: string): Promise<Profile> {
  const client = getClient();
  if (!client) throw new Error("AI unavailable");
  const response = await client.messages.parse({
    model: MODELS.fast,
    max_tokens: 2000,
    output_config: { effort: "low", format: zodOutputFormat(ParsedSchema) },
    system: PARSE_SYSTEM,
    messages: [{ role: "user", content: text.slice(0, 1000) }],
  });
  if (!response.parsed_output) throw new Error("Could not read that, try again");
  const { goal, exclude, ...fields } = response.parsed_output;
  // A typed food that's really a USC label (e.g. "shrimp") becomes that label instead.
  const labels = exclude.map(allergenFor).filter((a) => a !== null);
  return cleanProfile({
    ...fields,
    avoid: [...new Set([...fields.avoid, ...labels])],
    exclude: exclude.filter((w) => !allergenFor(w)).slice(0, 12),
    ...(goal === "none" ? {} : { goal }),
    likes: response.parsed_output.likes.slice(0, 12),
    dislikes: response.parsed_output.dislikes.slice(0, 12),
  });
}
