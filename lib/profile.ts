import { z } from "zod";
import { ALLERGENS, PREFERENCES, type Allergen, type Preference } from "./types";

export interface Profile {
  /** USC allergen codes to avoid. */
  avoid: Allergen[];
  /** USC diet labels every dish must carry (vegetarian is also satisfied by vegan). */
  diet: Preference[];
  likes: string[];
  dislikes: string[];
  /** Registered for Parkside's Allergen Awareness Zone (its station is otherwise off-limits). */
  aaz?: boolean;
}

export const EMPTY_PROFILE: Profile = { avoid: [], diet: [], likes: [], dislikes: [] };

export const ProfileSchema = z.object({
  avoid: z.array(z.enum(ALLERGENS)),
  diet: z.array(z.enum(PREFERENCES)),
  likes: z.array(z.string().max(40)).max(12),
  dislikes: z.array(z.string().max(40)).max(12),
  aaz: z.boolean().optional(),
});

export function cleanProfile(input: unknown): Profile {
  const p = ProfileSchema.parse(input);
  const words = (xs: string[]) => [...new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean))];
  return { avoid: [...new Set(p.avoid)], diet: [...new Set(p.diet)], likes: words(p.likes), dislikes: words(p.dislikes), aaz: Boolean(p.aaz) };
}

/** Stable string for cache keys. */
export function profileKey(p: Profile): string {
  return JSON.stringify([[...p.avoid].sort(), [...p.diet].sort(), [...p.likes].sort(), [...p.dislikes].sort(), Boolean(p.aaz)]);
}
