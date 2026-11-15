/**
 * Fills in missing translations: `npm run i18n`. Finds every t("...") string and data label,
 * asks Sonnet for the ones a language file is missing, and writes lib/i18n/<lang>.json.
 * Needs ANTHROPIC_API_KEY (reads .env.local). Run it after adding UI text; the test fails until you do.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { allKeys } from "../lib/i18n-keys";
import { LANGS } from "../lib/lang";
import { overstatesSafety } from "../lib/lang";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^(\w+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const client = new Anthropic({ timeout: 120_000, maxRetries: 2 });

const SYSTEM = `You translate the interface of ForkCast, a phone app that tells USC students which dining hall has food they can eat, based on USC's allergen and diet labels.
Translate each English UI string into the target language: short, natural, friendly, the way a student app would say it.
Rules:
- Keep {placeholders} exactly as written (same names, same braces), and keep symbols like ✓ → · ★ unchanged.
- Never use a word meaning "safe", "allergen-free" or "guaranteed". Talk about USC's labels instead.
- Keep proper names as they are: ForkCast, USC, USC Hospitality, Parkside, EVK, USC Village, OpenStreetMap, @usc.edu, QR.
- Food tags and allergen names should be the common word in the target language.
Return JSON only: {"<english>": "<translation>", ...} with every input string as a key.`;

async function translate(lang: string, name: string, keys: string[], have: Record<string, string>): Promise<Record<string, string>> {
  // Strings that quote a button (Tap “I ate this”) must use that button's own translation.
  const quoted = [...new Set(keys.flatMap((k) => [...k.matchAll(/“([^”]+)”/g)].map((m) => m[1])))].filter((q) => have[q]);
  const glossary = quoted.length ? `\n\nWhen a string quotes one of these buttons, use exactly this translation inside the quotes:\n${quoted.map((q) => `${q} = ${have[q]}`).join("\n")}` : "";
  const res = await client.messages.create({
    model: "claude-sonnet-5-5",
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: `Target language: ${name}${glossary}\n\n${JSON.stringify(keys, null, 1)}` }],
  });
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as Record<string, string>;
  const ok: Record<string, string> = {};
  for (const k of keys) {
    const v = json[k];
    const holes = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort().join();
    if (typeof v === "string" && v.trim() && holes(v) === holes(k) && !overstatesSafety(v)) ok[k] = v;
    else console.warn(`  ${lang}: skipped ${JSON.stringify(k)} -> ${JSON.stringify(v)}`);
  }
  return ok;
}

const keys = allKeys();
console.log(`${keys.length} strings`);
await Promise.all(
  LANGS.filter((l) => l.id !== "en").map(async (l) => {
    const file = path.join("lib", "i18n", `${l.id}.json`);
    const have = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
    const missing = keys.filter((k) => !have[k]);
    for (let i = 0; i < missing.length; i += 120) {
      Object.assign(have, await translate(l.id, l.english, missing.slice(i, i + 120), have));
    }
    // Drop strings the app no longer uses, keep the file sorted for clean diffs.
    const out = Object.fromEntries(keys.filter((k) => have[k]).map((k) => [k, have[k]]));
    writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
    console.log(`${l.id}: ${missing.length} translated, ${Object.keys(out).length}/${keys.length} total`);
  }),
);
