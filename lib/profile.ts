import { z } from "zod";
import { ALLERGENS, PREFERENCES, type Allergen, type Preference } from "./types";
import { GOAL_IDS, type GoalId } from "./plate";
import { STYLE_IDS, type StyleId } from "./styles";
import { MAX_RATINGS, type Taste } from "./taste";
import { findDorm } from "./walking";

export interface Profile {
  /** USC allergen codes to avoid. */
  avoid: Allergen[];
  /** USC diet labels every dish must carry (vegetarian is also satisfied by vegan). */
  diet: Preference[];
  likes: string[];
  dislikes: string[];
  /** Registered for Parkside's Allergen Awareness Zone (its station is otherwise off-limits). */
  aaz?: boolean;
  /** Residence id from lib/walking.ts, used for walking times. */
  dorm?: string;
  /** Dishes the student gave a thumbs up or down; they shift scores and the AI's picks. */
  taste?: Taste;
  /** Eating styles without a USC label (lib/styles.ts): judged from dish names and AI estimates. */
  styles?: StyleId[];
  /** Fitness goal from lib/plate.ts; adds a macro target for each meal. */
  goal?: GoalId;
}

export const EMPTY_PROFILE: Profile = { avoid: [], diet: [], likes: [], dislikes: [] };

const RatedSchema = z.object({ name: z.string().min(1).max(80), cuisine: z.string().max(30), protein: z.string().max(30) });

export const ProfileSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)),
  diet: z.array(z.enum(PREFERENCES)),
  likes: z.array(z.string().max(40)).max(12),
  dislikes: z.array(z.string().max(40)).max(12),
  aaz: z.boolean().optional(),
  dorm: z.string().max(40).optional(),
  taste: z.object({ up: z.array(RatedSchema).max(MAX_RATINGS), down: z.array(RatedSchema).max(MAX_RATINGS) }).optional(),
  goal: z.enum(GOAL_IDS).optional(),
  styles: z.array(z.enum(STYLE_IDS)).max(STYLE_IDS.length).optional(),
});

export function cleanProfile(input: unknown): Profile {
  const p = ProfileSchema.parse(input);
  const words = (xs: string[]) => [...new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  const out: Profile = {
    avoid: [...new Set(p.avoid)],
    diet: [...new Set(p.diet)],
    likes: words(p.likes),
    dislikes: words(p.dislikes),
    aaz: Boolean(p.aaz),
    dorm: findDorm(p.dorm)?.id,
  };
  if (p.goal) out.goal = p.goal;
  if (p.styles?.length) out.styles = [...new Set(p.styles)].sort();
  if (p.taste && p.taste.up.length + p.taste.down.length > 0) {
    // One rating per dish: a thumbs up wins over an older thumbs down of the same name.
    const key = (r: { name: string }) => r.name.toLowerCase();
    const uniq = <T extends { name: string }>(xs: T[]) => [...new Map(xs.map((r) => [key(r), r])).values()];
    const up = uniq(p.taste.up);
    const liked = new Set(up.map(key));
    out.taste = { up, down: uniq(p.taste.down).filter((r) => !liked.has(key(r))) };
  }
  return out;
}

/** Stable string for cache keys. */
export function profileKey(p: Profile): string {
  const names = (xs: { name: string }[] = []) => xs.map((r) => r.name.toLowerCase()).sort();
  return JSON.stringify([
    [...p.avoid].sort(),
    [...p.diet].sort(),
    [...p.likes].sort(),
    [...p.dislikes].sort(),
    Boolean(p.aaz),
    p.dorm ?? "",
    p.goal ?? "",
    [...(p.styles ?? [])].sort(),
    names(p.taste?.up),
    names(p.taste?.down),
  ]);
}
