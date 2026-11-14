import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import type { EnrichedDish } from "./enrich";
import { describeReason, hasPref } from "./filter";
import type { EnrichedDay } from "./menus";
import type { Profile } from "./profile";
import { scoreHalls, type HallScore } from "./score";
import { HALLS, LABEL_NAMES } from "./types";
import { findDorm } from "./walking";
import { verify, type AiRecommendation, type Pick, type Verification } from "./verify";

export interface HallSummary {
  hall: string;
  open: boolean;
  mains: number;
  sides: number;
  hiddenForAllergens: number;
  /** Walking minutes from the student's residence, or null if they didn't set one. */
  walk: number | null;
}

export interface HiddenDish {
  id: string;
  name: string;
  station: string;
  reason: string;
}

export interface PickedDish {
  id: string;
  name: string;
  station: string;
  kind: string;
  allergens: string[];
  prefs: string[];
  why: string;
  claims: string[];
}

export interface Recommendation {
  date: string;
  meal: string;
  hall: string;
  summary: string;
  picks: PickedDish[];
  halls: HallSummary[];
  hidden: HiddenDish[];
  verification: Verification;
  /** "ai" = Sonnet picked and the verifier passed; "rules" = code-only fallback. */
  source: "ai" | "rules";
  /** How many times the model was asked (2 means the first answer failed verification) and total time. */
  attempts: number;
  ms: number;
}

export const RecSchema = z.object({
  hall: z.enum(HALLS.map((h) => h.id) as [string, ...string[]]),
  picks: z
    .array(
      z.object({
        dishId: z.string(),
        why: z.string().describe("one short sentence, under 15 words, why this suits the student"),
        claims: z
          .array(z.string())
          .describe('USC label facts relied on: "vegan", "vegetarian", "halal-ingredients", or "no:<allergen code>"'),
      }),
    )
    .describe("3 to 5 dishes from the chosen hall, best first, mains before sides"),
  summary: z.string().describe("one or two friendly sentences, under 40 words, naming the hall and why"),
});

export const SYSTEM = `You help a USC student decide which residential dining hall to eat at for one meal.
You get the student's profile and, per hall, ONLY the dishes that already passed their allergen and diet filters.
Choose the hall that gives them the best meal: enough real mains, foods they like, nothing they dislike.
When walking times are given, a clearly better meal is worth a longer walk, but between similar options prefer the closer hall. If you mention a walking time, use the exact minutes given.
Pick 3-5 dishes from that hall by their id, exactly as given, at least 2 of them mains when available. Never mention a dish that isn't listed.
Describe a dish only with what its name and line say; don't invent flavors (call it spicy only if its line says spicy).
In "claims", list only label facts shown on that dish's line ("no:<allergen>" only for allergens the student avoids).
Never call food "safe" or "allergen-free". Speak about USC's labels, e.g. "no sesame per USC labels".
Write like a helpful friend, briefly.`;

function labelsOf(d: EnrichedDish, profile: Profile): string {
  const facts = [...d.prefs, ...profile.avoid.filter((a) => !d.allergens.includes(a)).map((a) => `no:${a}`)];
  return facts.join(" ");
}

function dishLine(d: EnrichedDish, profile: Profile): string {
  return `${d.id} | ${d.station} | ${d.name} | ${d.kind} | ${d.cuisine}/${d.protein}${d.spicy ? " spicy" : ""} | labels: ${labelsOf(d, profile)}`;
}

export function buildPrompt(profile: Profile, meal: string, scores: HallScore[]): string {
  const dorm = findDorm(profile.dorm);
  const p = [
    `Meal: ${meal}`,
    `Avoids (allergens): ${profile.avoid.join(", ") || "none"}`,
    `Requires (diet labels): ${profile.diet.join(", ") || "none"}`,
    `Likes: ${profile.likes.join(", ") || "anything"}`,
    `Dislikes: ${profile.dislikes.join(", ") || "nothing listed"}`,
    ...(dorm ? [`Lives at: ${dorm.name}`] : []),
    "",
  ];
  for (const s of scores) {
    const name = HALLS.find((h) => h.id === s.hall)!.name;
    if (!s.open) {
      p.push(`## ${s.hall} (${name}): not serving ${meal}`, "");
      continue;
    }
    const walk = s.walk === null ? "" : `, ${s.walk} min walk`;
    p.push(`## ${s.hall} (${name}): ${s.mains.length} mains, ${s.sides.length} sides for this student${walk}`);
    for (const d of [...s.mains, ...s.sides.slice(0, 15), ...s.desserts.slice(0, 4)]) p.push(dishLine(d, profile));
    p.push("");
  }
  return p.join("\n");
}

function rulesRecommendation(scores: HallScore[], profile: Profile): AiRecommendation {
  const top = scores[0];
  const dishes = [...top.mains.slice(0, 3), ...top.sides.slice(0, 2)].slice(0, 5);
  const picks: Pick[] = dishes.map((d) => {
    const claims = [
      ...profile.diet.filter((p) => hasPref(d, p)),
      ...profile.avoid.filter((a) => !d.allergens.includes(a)).map((a) => `no:${a}`),
    ];
    const labelText = claims.map((c) => (c.startsWith("no:") ? `no ${LABEL_NAMES[c.slice(3)]}` : LABEL_NAMES[c])).join(", ");
    return {
      dishId: d.id,
      why: labelText ? `${labelText} per USC labels.` : `A ${d.kind} that fits your profile.`,
      claims,
    };
  });
  const name = HALLS.find((h) => h.id === top.hall)!.name;
  const walk = top.walk === null ? "" : `, a ${top.walk} min walk`;
  return {
    hall: top.hall,
    picks,
    summary: `${name} is your best match${walk}: ${top.mains.length} mains and ${top.sides.length} sides fit your profile.`,
  };
}

const kindRank = (k?: string) => (k === "main" ? 0 : k === "side" ? 1 : 2);

async function askModel(prompt: string, retryNote?: string): Promise<AiRecommendation> {
  const client = getClient();
  if (!client) throw new Error("AI unavailable");
  const response = await client.beta.messages.parse(
    {
      model: MODELS.smart,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(RecSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }, ...(retryNote ? [{ role: "user" as const, content: retryNote }] : [])],
    },
    // A student is waiting: fail fast and let the rules pick take over rather than hang.
    { timeout: 12_000, maxRetries: 0 },
  );
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`No usable answer (${response.stop_reason})`);
  return response.parsed_output;
}

/**
 * Full pipeline for one profile and meal: code filters and scores, Sonnet picks and explains,
 * code verifies. A failed check gets one retry with the failures listed, then falls back to the rules pick.
 */
export async function recommend(day: EnrichedDay, meal: string, profile: Profile): Promise<Recommendation> {
  const started = Date.now();
  const scores = scoreHalls(day, meal, profile);
  const dishes = day.halls.flatMap((h) => h.dishes);
  const walks = scores.flatMap((s) => (s.walk === null ? [] : [s.walk]));
  let attempts = 0;
  const anyEligible = scores.some((s) => s.open && s.mains.length + s.sides.length > 0);

  let rec: AiRecommendation | null = null;
  let verification: Verification | null = null;
  let source: Recommendation["source"] = "rules";

  if (anyEligible && getClient()) {
    const prompt = buildPrompt(profile, meal, scores);
    let note: string | undefined;
    for (let attempt = 0; attempt < 2 && !rec; attempt++) {
      try {
        attempts++;
        const candidate = await askModel(prompt, note);
        const v = verify(candidate, dishes, meal, profile, walks);
        if (v.passed) {
          rec = candidate;
          verification = v;
          source = "ai";
        } else {
          note = `Your last answer failed these checks against the real menu:\n${v.checks
            .filter((c) => !c.ok)
            .map((c) => `- ${c.text}`)
            .join("\n")}\nAnswer again using only listed dish ids and their shown labels.`;
          console.warn("Recommendation failed verification:", note);
        }
      } catch (err) {
        console.warn("Recommendation model call failed:", (err as Error).message);
        break;
      }
    }
  }

  if (!rec) {
    rec = anyEligible ? rulesRecommendation(scores, profile) : { hall: scores[0].hall, picks: [], summary: "" };
    verification = anyEligible
      ? verify(rec, dishes, meal, profile, walks)
      : {
          passed: true,
          checks: [
            {
              ok: true,
              text: "Nothing recommended: no dish matches your profile",
            },
          ],
        };
  }

  const chosen = scores.find((s) => s.hall === rec.hall) ?? scores[0];
  const byId = new Map(dishes.map((d) => [d.id, d]));
  return {
    date: day.date,
    meal,
    hall: chosen.hall,
    summary: anyEligible ? rec.summary : `No ${meal.toLowerCase()} dishes at any hall match your profile on USC's labels today.`,
    picks: [...rec.picks]
      .sort((a, b) => kindRank(byId.get(a.dishId)?.kind) - kindRank(byId.get(b.dishId)?.kind))
      .map((p) => {
        const d = byId.get(p.dishId)!;
        return {
          id: d.id,
          name: d.name,
          station: d.station,
          kind: d.kind,
          allergens: d.allergens,
          prefs: d.prefs,
          why: p.why,
          claims: p.claims,
        };
      }),
    halls: scores.map((s) => ({
      hall: s.hall,
      open: s.open,
      mains: s.mains.length,
      sides: s.sides.length,
      hiddenForAllergens: s.hidden.filter((h) => h.reason.type === "allergen" || h.reason.type === "not-analyzed").length,
      walk: s.walk,
    })),
    hidden: chosen.hidden
      .filter((h) => (h.reason.type === "allergen" || h.reason.type === "not-analyzed") && h.dish.kind !== "condiment")
      .slice(0, 12)
      .map((h) => ({
        id: h.dish.id,
        name: h.dish.name,
        station: h.dish.station,
        reason: describeReason(h.reason),
      })),
    verification: verification!,
    source,
    attempts,
    ms: Date.now() - started,
  };
}
