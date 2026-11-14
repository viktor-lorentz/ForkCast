import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import { ALLERGENS, PREFERENCES, type Allergen, type Preference } from "./types";

export interface Profile {
  /** USC allergen codes to avoid. */
  avoid: Allergen[];
  /** USC diet labels every dish must carry (vegetarian is also satisfied by vegan). */
  diet: Preference[];
  likes: string[];
  dislikes: string[];
}

export const EMPTY_PROFILE: Profile = { avoid: [], diet: [], likes: [], dislikes: [] };

export const ProfileSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)),
  diet: z.array(z.enum(PREFERENCES)),
  likes: z.array(z.string().max(40)).max(12),
  dislikes: z.array(z.string().max(40)).max(12),
});

export function cleanProfile(input: unknown): Profile {
  const p = ProfileSchema.parse(input);
  const words = (xs: string[]) => [...new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  return { avoid: [...new Set(p.avoid)], diet: [...new Set(p.diet)], likes: words(p.likes), dislikes: words(p.dislikes) };
}

/** Stable string for cache keys. */
export function profileKey(p: Profile): string {
  return JSON.stringify([[...p.avoid].sort(), [...p.diet].sort(), [...p.likes].sort(), [...p.dislikes].sort()]);
}

const ParsedSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)).describe("allergens the student must avoid"),
  diet: z.array(z.enum(PREFERENCES)).describe("diet labels the student requires"),
  likes: z.array(z.string()).describe("1-2 word lowercase food likes, e.g. spicy, rice, chicken, mexican, pasta"),
  dislikes: z.array(z.string()).describe("1-2 word lowercase food dislikes, e.g. mushrooms, fish, cilantro"),
});

const PARSE_SYSTEM = `Turn a college student's description of how they eat into a dining profile.
Allergen codes: ${ALLERGENS.join(", ")}. "gluten" covers wheat and celiac. Pork counts as an allergen code here.
Diet codes: halal-ingredients (halal or Muslim dietary rules), vegan, vegetarian.
Only include an allergen or diet code if the text clearly says so. Put food preferences in likes and dislikes as short lowercase words.`;

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
  return cleanProfile({
    ...response.parsed_output,
    likes: response.parsed_output.likes.slice(0, 12),
    dislikes: response.parsed_output.dislikes.slice(0, 12),
  });
}
