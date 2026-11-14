import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import { cleanProfile, type Profile } from "./profile";
import { ALLERGENS, PREFERENCES } from "./types";

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
