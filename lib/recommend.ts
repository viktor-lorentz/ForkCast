import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getClient, MODELS } from "./ai";
import type { EnrichedDish } from "./enrich";
import { describeReason, hasPref } from "./filter";
import { findGoal, type Macros } from "./plate";
import type { EnrichedDay } from "./menus";
import type { Profile } from "./profile";
import { scoreHalls, type HallScore } from "./score";
import { dishKey, formatAvg, type Score } from "./ratings";
import { STYLES } from "./styles";
import { ratingOf, tasteSummary } from "./taste";
import { HALLS, LABEL_NAMES } from "./types";
import { findDorm } from "./walking";
import { card, findLang } from "./lang";
import { historyNote } from "./history";
import { isClosing, type Closing, type ClosingMap } from "./closing";
import { verify, type AiRecommendation, type Pick, type Verification } from "./verify";

/** The prompt names halls by id ("evk", "university-village"); the model sometimes copies those ids into its text. */
export function hallNames(text: string): string {
  return text
    .replace(/\buniversity-village\b/gi, "USC Village")
    .replace(/\bevk\b/g, "EVK")
    .replace(/\bparkside\b/g, "Parkside");
}

export interface HallSummary {
  hall: string;
  open: boolean;
  mains: number;
  sides: number;
  hiddenForAllergens: number;
  /** Walking minutes from the student's residence, or null if they didn't set one. */
  walk: number | null;
  /** Closing soon / closed now, for today's current meal only. */
  closing: Closing | null;
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
  /** AI estimate for one serving, when available. */
  macros: Macros | null;
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
If the student has a fitness goal, favor dishes that help build a plate close to it (a suggested plate is given per hall). Never write calorie or gram numbers: the app shows its own estimated totals.
If the student rated dishes, lean toward what they liked and away from what they disliked.
Some dishes show "students: X/10 (N)", the average score other USC students gave it. It tells you what's actually good: favor dishes students rate 7 or higher (a dish rated 8+ is worth suggesting even if it isn't on the student's likes), and avoid ones rated 4 or lower when there are alternatives. Weigh a score from 1-2 students lightly. Ratings never change which dishes are allowed. If you mention a score, use the exact number shown.
When a language is given, write "summary" and every "why" in that language. Keep dish names and hall names exactly as listed (do not translate them), keep "claims" as the codes above, and write walking minutes as digits. The safety rule applies in every language: no word meaning "safe", "allergen-free" or "guaranteed".
A hall marked "CLOSING SOON" or "CLOSED NOW" must not be your pick when another hall has dishes for the student. Never write how many minutes until a hall closes; you may give its closing time as shown.
If an "Ate recently" line is given, gently favor variety (a different protein or cuisine) when the options are otherwise close. Recently eaten dishes are still allowed and can be picked if they are clearly the best; never treat them as excluded.
Write like a helpful friend, briefly.`;

function labelsOf(d: EnrichedDish, profile: Profile): string {
  const facts = [...d.prefs, ...profile.avoid.filter((a) => !d.allergens.includes(a)).map((a) => `no:${a}`)];
  return facts.join(" ");
}

export type RatingMap = Record<string, Score>;

function ratingNote(d: EnrichedDish, ratings?: RatingMap): string {
  const r = ratings?.[dishKey(d.name)];
  return r ? ` | students: ${formatAvg(r.avg)}/10 (${r.n})` : "";
}

function dishLine(d: EnrichedDish, profile: Profile, ratings?: RatingMap): string {
  const m = profile.goal && d.macros ? ` | est ${d.macros.cal}kcal ${d.macros.protein}p ${d.macros.carbs}c ${d.macros.fat}f` : "";
  return `${d.id} | ${d.station} | ${d.name} | ${d.kind} | ${d.cuisine}/${d.protein}${d.spicy ? " spicy" : ""} | labels: ${labelsOf(d, profile)}${m}${ratingNote(d, ratings)}`;
}

export function buildPrompt(profile: Profile, meal: string, scores: HallScore[], ratings?: RatingMap, date?: string): string {
  const ate = date ? historyNote(profile.ate, date) : "";
  const dorm = findDorm(profile.dorm);
  const goal = findGoal(profile.goal);
  const taste = tasteSummary(profile.taste);
  const p = [
    `Meal: ${meal}`,
    ...(profile.lang && profile.lang !== "en"
      ? [`Language: write "summary" and every "why" in ${findLang(profile.lang).english}. Dish names stay exactly as listed.`]
      : []),
    `Avoids (allergens): ${profile.avoid.join(", ") || "none"}`,
    `Requires (diet labels): ${profile.diet.join(", ") || "none"}`,
    `Likes: ${profile.likes.join(", ") || "anything"}`,
    `Dislikes: ${profile.dislikes.join(", ") || "nothing listed"}`,
    ...(profile.exclude?.length ? [`Never eats (already removed by dish name): ${profile.exclude.join(", ")}`] : []),
    ...(dorm ? [`Lives at: ${dorm.name}`] : []),
    ...(profile.styles?.length ? [`Eating styles (already applied): ${profile.styles.map((s) => STYLES.find((x) => x.id === s)!.name).join(", ")}`] : []),
    ...(goal ? [`Fitness goal: ${goal.name} (about ${goal.cal} kcal and ${goal.protein}g protein this meal)`] : []),
    ...(taste.count ? [`Rated dishes: liked ${profile.taste!.up.map((r) => r.name).slice(-8).join("; ") || "none"}; disliked ${profile.taste!.down.map((r) => r.name).slice(-8).join("; ") || "none"}`] : []),
    ...(ate ? [ate] : []),
    ...(taste.toward.length || taste.away.length ? [`Ratings lean toward: ${taste.toward.join(", ") || "-"}; away from: ${taste.away.join(", ") || "-"}`] : []),
    "",
  ];
  for (const s of scores) {
    const name = HALLS.find((h) => h.id === s.hall)!.name;
    if (!s.open) {
      p.push(`## ${s.hall} (${name}): not serving ${meal}`, "");
      continue;
    }
    const walk = s.walk === null ? "" : `, ${s.walk} min walk`;
    const closing =
      s.closing?.state === "closed"
        ? " | CLOSED NOW"
        : s.closing?.state === "closing"
          ? ` | CLOSING SOON at ${s.closing.closesAt} (not enough time to walk there and eat)`
          : "";
    p.push(`## ${s.hall} (${name}): ${s.mains.length} mains, ${s.sides.length} sides for this student${walk}${closing}`);
    // A dish the student gave a thumbs down is never offered to the model again.
    const ok = (d: EnrichedDish) => ratingOf(profile.taste, d.name) !== -1;
    for (const d of [...s.mains.filter(ok), ...s.sides.filter(ok).slice(0, 15), ...s.desserts.filter(ok).slice(0, 4)]) p.push(dishLine(d, profile, ratings));
    if (s.plate.length) p.push(`Suggested plate for the goal: ${s.plate.map((d) => d.id).join(", ")}`);
    p.push("");
  }
  return p.join("\n");
}

function rulesRecommendation(scores: HallScore[], profile: Profile, ratings?: RatingMap): AiRecommendation {
  const top = scores[0];
  const ok = (d: EnrichedDish) => ratingOf(profile.taste, d.name) !== -1;
  // Without the AI, well-rated dishes go first (unrated ones count as a middling 6).
  const stars = (d: EnrichedDish) => ratings?.[dishKey(d.name)]?.avg ?? 6;
  const best = (list: EnrichedDish[]) => [...list].filter(ok).sort((a, b) => stars(b) - stars(a));
  const dishes = [...best(top.mains).slice(0, 3), ...best(top.sides).slice(0, 2)].slice(0, 5);
  const picks: Pick[] = dishes.map((d) => {
    const claims = [
      ...profile.diet.filter((p) => hasPref(d, p)),
      ...profile.avoid.filter((a) => !d.allergens.includes(a)).map((a) => `no:${a}`),
    ];
    const labelText = claims.map((c) => (c.startsWith("no:") ? `no ${LABEL_NAMES[c.slice(3)]}` : LABEL_NAMES[c])).join(", ");
    const t = card(profile.lang);
    return {
      dishId: d.id,
      why: labelText ? t.perLabels(labelText) : profile.lang && profile.lang !== "en" ? t.fits : `A ${d.kind} that fits your profile.`,
      claims,
    };
  });
  const name = HALLS.find((h) => h.id === top.hall)!.name;
  return {
    hall: top.hall,
    picks,
    summary: card(profile.lang).rulesSummary(name, top.walk, top.mains.length, top.sides.length),
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
export async function recommend(
  day: EnrichedDay,
  meal: string,
  profile: Profile,
  ratings?: RatingMap,
  opts: { rulesOnly?: boolean; closing?: ClosingMap } = {},
): Promise<Recommendation> {
  const started = Date.now();
  const scores = scoreHalls(day, meal, profile, opts.closing);
  const hasFood = (s: HallScore) => s.open && s.mains.length + s.sides.length > 0;
  const closingHalls = scores.filter((s) => isClosing(s.closing)).map((s) => s.hall);
  const closingCheck = { halls: closingHalls, otherHasFood: scores.some((s) => hasFood(s) && !isClosing(s.closing)) };
  const dishes = day.halls.flatMap((h) => h.dishes);
  const walks = scores.flatMap((s) => (s.walk === null ? [] : [s.walk]));
  let attempts = 0;
  const anyEligible = scores.some((s) => s.open && s.mains.length + s.sides.length > 0);

  let rec: AiRecommendation | null = null;
  let verification: Verification | null = null;
  let source: Recommendation["source"] = "rules";

  if (anyEligible && !opts.rulesOnly && getClient()) {
    const prompt = buildPrompt(profile, meal, scores, ratings, day.date);
    let note: string | undefined;
    for (let attempt = 0; attempt < 2 && !rec; attempt++) {
      try {
        attempts++;
        const candidate = await askModel(prompt, note);
        const v = verify(candidate, dishes, meal, profile, walks, closingCheck);
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
    rec = anyEligible ? rulesRecommendation(scores, profile, ratings) : { hall: scores[0].hall, picks: [], summary: "" };
    verification = anyEligible
      ? verify(rec, dishes, meal, profile, walks, closingCheck)
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
  const tidy = (text: string) => (rec.picks.length ? hallNames(text) : text);
  const byId = new Map(dishes.map((d) => [d.id, d]));
  return {
    date: day.date,
    meal,
    hall: chosen.hall,
    summary: anyEligible ? tidy(rec.summary) : `No ${meal.toLowerCase()} dishes at any hall match your profile on USC's labels today.`,
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
          why: tidy(p.why),
          claims: p.claims,
          macros: d.macros ?? null,
        };
      }),
    halls: scores.map((s) => ({
      hall: s.hall,
      open: s.open,
      mains: s.mains.length,
      sides: s.sides.length,
      hiddenForAllergens: s.hidden.filter((h) => h.reason.type === "allergen" || h.reason.type === "not-analyzed").length,
      walk: s.walk,
      closing: s.closing,
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
