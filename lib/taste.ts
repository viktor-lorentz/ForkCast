/** A dish the student rated, with the AI tags it had at the time (it may not be on today's menu). */
export interface Rated {
  name: string;
  cuisine: string;
  protein: string;
}

export interface Taste {
  up: Rated[];
  down: Rated[];
}

export const MAX_RATINGS = 30;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function ratingOf(taste: Taste | undefined, name: string): 1 | 0 | -1 {
  if (taste?.up.some((r) => same(r.name, name))) return 1;
  if (taste?.down.some((r) => same(r.name, name))) return -1;
  return 0;
}

/** Sets a dish's rating (0 clears it). The newest ratings are kept when the list is full. */
export function rate(taste: Taste | undefined, dish: Rated, value: 1 | 0 | -1): Taste {
  const without = (xs: Rated[] = []) => xs.filter((r) => !same(r.name, dish.name));
  const entry = { name: dish.name, cuisine: dish.cuisine, protein: dish.protein };
  const up = without(taste?.up);
  const down = without(taste?.down);
  if (value === 1) up.push(entry);
  if (value === -1) down.push(entry);
  return { up: up.slice(-MAX_RATINGS), down: down.slice(-MAX_RATINGS) };
}

const real = (s: string) => Boolean(s) && s !== "none";

/** Net thumbs per cuisine and protein, e.g. { mexican: 2, fish: -1 }. */
function leanings(taste: Taste): Map<string, number> {
  const net = new Map<string, number>();
  const bump = (r: Rated, by: number) => {
    for (const k of new Set([r.cuisine, r.protein].map((s) => s.toLowerCase())))
      if (real(k)) net.set(k, (net.get(k) ?? 0) + by);
  };
  taste.up.forEach((r) => bump(r, 1));
  taste.down.forEach((r) => bump(r, -1));
  return net;
}

/**
 * How much the student's past thumbs move a dish's score. The same dish counts most;
 * dishes sharing a cuisine or protein with rated ones count a little, capped so a few taps can't swamp the menu.
 */
export function tasteScore(d: Rated, taste: Taste | undefined): number {
  if (!taste || taste.up.length + taste.down.length === 0) return 0;
  const own = ratingOf(taste, d.name);
  if (own === 1) return 3;
  if (own === -1) return -6;
  const net = leanings(taste);
  let s = 0;
  for (const k of new Set([d.cuisine, d.protein].map((x) => x.toLowerCase())))
    if (real(k)) s += Math.max(-2, Math.min(2, net.get(k) ?? 0)) * 0.75;
  return s;
}

/** Plain-words summary of what the ratings add up to, for the UI and the AI prompt. */
export function tasteSummary(taste: Taste | undefined): { count: number; toward: string[]; away: string[] } {
  if (!taste) return { count: 0, toward: [], away: [] };
  const net = [...leanings(taste)].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return {
    count: taste.up.length + taste.down.length,
    toward: net.filter(([, n]) => n > 0).map(([k]) => k).slice(0, 3),
    away: net.filter(([, n]) => n < 0).map(([k]) => k).slice(0, 3),
  };
}
