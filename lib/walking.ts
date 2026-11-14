import walking from "@/data/walking.json";
import type { HallId } from "./types";

export interface Dorm {
  id: string;
  name: string;
  /** Walking minutes to each hall, precomputed from OpenStreetMap foot routes (scripts/walking.mjs). */
  minutes: Record<HallId, number>;
}

export const DORMS: Dorm[] = walking.dorms;

export function findDorm(id: string | undefined | null): Dorm | null {
  return DORMS.find((d) => d.id === id) ?? null;
}

/** Each minute of walking costs this much hall score; ten extra minutes is roughly one main dish. */
export const WALK_PENALTY = 0.35;
