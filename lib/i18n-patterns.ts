import type { T } from "./i18n";
import { LABEL_NAMES } from "./types";

/**
 * English strings that arrive from the server or from shared code (verifier checks, hidden-dish
 * reasons, opening hours) mapped to translatable templates. Label names inside them are translated too;
 * hall and dish names are left as USC writes them.
 */
const LABELS = new Set(Object.values(LABEL_NAMES));
const PATTERNS: { re: RegExp; key: string; names: string[] }[] = [
  { re: /^(.+) is a real dining hall$/, key: "{hall} is a real dining hall", names: ["hall"] },
  { re: /^(\d+) dishes picked$/, key: "{n} dishes picked", names: ["n"] },
  { re: /^Contains (.+) \(USC label\)$/, key: "Contains {label} (USC label)", names: ["label"] },
  { re: /^Not labeled (.+) by USC$/, key: "Not labeled {label} by USC", names: ["label"] },
  { re: /^Looks like it has (.+) \(from the dish name, not a USC label\)$/, key: "Looks like it has {food} (from the dish name, not a USC label)", names: ["food"] },
  { re: /^Open now · closes (.+)$/, key: "Open now · closes {time}", names: ["time"] },
  { re: /^Opens (.+)$/, key: "Opens {time}", names: ["time"] },
  { re: /^Closes in (\d+) min$/, key: "Closes in {n} min", names: ["n"] },
  { re: /^(.+) got a thumbs down from you$/, key: "{dish} got a thumbs down from you", names: ["dish"] },
  { re: /^(.+) conflicts with your profile$/, key: "{dish} conflicts with your profile", names: ["dish"] },
  { re: /^You had this (\d+) days ago$/, key: "You had this {n} days ago", names: ["n"] },
];

/** Exact strings (no variables) from shared code; listed so the i18n script and test include them. */
export const EXACT_SERVER_STRINGS = [
  "Every dish is on today's USC menu",
  "No dish carries an allergen you avoid",
  "No dish carries an allergen you avoid or misses a diet label you need",
  "Every label claim matches USC's labels",
  "Walking times match the map data",
  "A walking time in the answer doesn't match the map data",
  "Nothing recommended: no dish matches your profile",
  "Not analyzed for allergens by USC",
  "Allergen Awareness Zone: registered students only",
  "Looks like it has meat other than fish (from the dish name, not a USC label)",
  "Looks carb-heavy (AI estimate, not a USC label)",
  "Name mentions coffee, tea or alcohol",
  "Closed today",
  "Closed for today",
  "Closed now",
  "Hours not posted",
  "High protein",
  "Lighter",
  "Hearty",
  "Low carb",
  "You had this today",
  "You had this yesterday",
];

export const PATTERN_KEYS = PATTERNS.map((p) => p.key);

export function trServer(t: T, s: string): string {
  for (const p of PATTERNS) {
    const m = s.match(p.re);
    if (!m) continue;
    const vars = Object.fromEntries(p.names.map((n, i) => [n, LABELS.has(m[i + 1]) ? t(m[i + 1]) : m[i + 1]]));
    return t(p.key, vars);
  }
  return t(s);
}

/** "no:sesame" → "no Sesame", "vegan" → "Vegan", translated. */
export function trClaim(t: T, claim: string): string {
  if (claim.startsWith("no:")) return t("no {label}", { label: t(LABEL_NAMES[claim.slice(3)] ?? claim.slice(3)) });
  return t(LABEL_NAMES[claim] ?? claim);
}
