import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// WCAG AA contrast for the theme tokens in app/globals.css, in light and dark.
const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const lightBlock = css.slice(css.indexOf(":root {"), darkStart);
const darkBlock = css.slice(darkStart, css.indexOf("@theme inline"));

// Tailwind defaults for the shades we don't override in light mode.
const TAILWIND: Record<string, string> = {
  "color-emerald-50": "#ecfdf5",
  "color-emerald-700": "#047857",
  "color-emerald-900": "#064e3b",
  "color-amber-50": "#fffbeb",
  "color-amber-900": "#78350f",
  "color-red-50": "#fef2f2",
  "color-red-700": "#b91c1c",
  "color-stone-100": "#f5f5f4",
  "color-stone-600": "#57534e",
  "color-stone-800": "#292524",
};

function vars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]] = m[2];
  return out;
}
const light = { ...TAILWIND, ...vars(lightBlock) };
const dark = { ...light, ...vars(darkBlock) };

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// [text, background]: all small text, so 4.5:1.
const PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["color-stone-500", "card"],
  ["color-stone-500", "background"],
  ["color-stone-400", "card"],
  ["color-stone-400", "background"],
  ["color-stone-600", "card"],
  ["color-stone-800", "color-stone-100"],
  ["cardinal", "card"],
  ["cardinal", "background"],
  ["ink-fg", "ink"],
  ["color-emerald-700", "card"],
  ["color-emerald-900", "color-emerald-50"],
  ["color-amber-900", "color-amber-50"],
  ["color-red-700", "color-red-50"],
];

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s theme contrast", (_name, t) => {
  it.each(PAIRS)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(t[fg], fg).toBeDefined();
    expect(t[bg], bg).toBeDefined();
    expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
  it("white text on the cardinal card is at least 4.5:1", () => {
    expect(ratio("#ffffff", t.brand)).toBeGreaterThanOrEqual(4.5);
  });
  it("gold on the cardinal card is at least 3:1 (large text and icons)", () => {
    expect(ratio(t.gold, t.brand)).toBeGreaterThanOrEqual(3);
  });
});

it("dark mode actually changes the page colors", () => {
  expect(dark.background).not.toBe(light.background);
  expect(dark.card).not.toBe(light.card);
  expect(ratio(dark.foreground, light.foreground)).toBeGreaterThan(10);
});
