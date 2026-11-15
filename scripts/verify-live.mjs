// End-to-end check of a running ForkCast (the live site by default).
//   node scripts/verify-live.mjs                      → checks https://forkcast-usc.vercel.app
//   node scripts/verify-live.mjs http://localhost:3000
//   node scripts/verify-live.mjs --md                 → prints a Markdown table (used for docs/VERIFICATION.md)
//
// It does not trust the app's own "verification" field. For every sample student in data/test-profiles it
// asks the app for a pick, then re-checks each picked dish against the menu feed with separate code:
// the dish must be on the menu at the chosen hall and meal, carry no allergen the student avoids,
// not be "not analyzed" by USC, and carry every diet label the student requires.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const md = args.includes("--md");
const base = (args.find((a) => a.startsWith("http")) ?? "https://forkcast-usc.vercel.app").replace(/\/$/, "");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const results = [];
const record = (area, name, ok, detail = "") => results.push({ area, name, ok, detail });
const get = (path) => fetch(base + path);
const post = (path, body, raw = false) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: raw ? body : JSON.stringify(body) });

// 1. Pages and static files load.
for (const path of ["/", "/rate", "/manifest.webmanifest", "/forkcast-deck.html", "/?demo=halal-sesame"]) {
  const r = await get(path);
  record("Pages", `GET ${path}`, r.status === 200, `HTTP ${r.status}`);
}

// 2. Read-only endpoints answer with the expected shape.
const menuRes = await get("/api/menu");
const menu = menuRes.ok ? await menuRes.json() : { halls: [] };
const dishes = menu.halls.flatMap((h) => h.dishes);
record("Data", "GET /api/menu returns 3 halls with dishes", menu.halls.length === 3 && dishes.length > 0, `${menu.halls.length} halls, ${dishes.length} dishes for ${menu.date}`);
for (const path of ["/api/hours", "/api/switches", "/api/email/status"]) {
  const r = await get(path);
  record("Data", `GET ${path}`, r.status === 200 && typeof (await r.json()) === "object", `HTTP ${r.status}`);
}

// 3. Bad input is rejected, not processed.
const bad = [
  ["GET /api/menu with a malformed date", () => get("/api/menu?date=not-a-date"), 400],
  ["GET /api/menu a year ahead", () => get("/api/menu?date=2027-11-15"), 400],
  ["POST /api/recommend with a broken body", () => post("/api/recommend", "{not json", true), 400],
  ["POST /api/recommend with an unknown allergen", () => post("/api/recommend", { profile: { avoid: ["<script>"], diet: [], likes: [], dislikes: [] } }), 400],
  ["POST /api/recommend with an out-of-range date", () => post("/api/recommend", { profile: { avoid: [], diet: [], likes: [], dislikes: [] }, date: "1999-01-01" }), 400],
  ["POST /api/week with no profile", () => post("/api/week", {}), 400],
  ["POST /api/parse-profile with empty text", () => post("/api/parse-profile", { text: "" }), 400],
  ["POST /api/email/send to a non-USC address", () => post("/api/email/send", { email: "someone@example.com", profile: { avoid: [], diet: [], likes: [], dislikes: [] } }), [400, 503]],
  ["POST /api/ratings with score 11", () => post("/api/ratings", { dish: "Test", score: 11, rater: "x" }), [400, 503]],
  ["GET /api/email/confirm with a made-up token", () => get("/api/email/confirm?t=nope"), 200, async (r) => (await r.text()).includes("Link expired")],
];
for (const [name, call, want, extra] of bad) {
  const r = await call();
  const ok = [want].flat().includes(r.status) && (extra ? await extra(r) : true);
  record("Input checks", name, ok, `HTTP ${r.status}`);
}

// 4. Every sample student: ask for a pick, then re-check it independently against the menu feed.
const byId = new Map(dishes.map((d) => [d.id, d]));
const overstates = /\b(safe|allergen[- ]free)\b/i;
const dir = join(root, "data", "test-profiles");
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const { id, profile } = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const r = await post("/api/recommend", { profile });
  if (!r.ok) {
    record("Picks", id, false, `HTTP ${r.status}`);
    continue;
  }
  const rec = await r.json();
  const problems = [];
  if (!rec.verification?.passed) problems.push("app's own checks failed");
  if (!rec.picks?.length) problems.push("no dishes picked");
  for (const p of rec.picks ?? []) {
    const d = byId.get(p.id);
    if (!d) problems.push(`${p.name}: not in the menu feed`);
    else {
      if (d.hall !== rec.hall || d.meal !== rec.meal) problems.push(`${p.name}: not served at ${rec.hall} for ${rec.meal}`);
      const hit = (profile.avoid ?? []).filter((a) => d.allergens.includes(a));
      if (hit.length) problems.push(`${p.name}: carries ${hit.join(", ")}`);
      if ((profile.avoid ?? []).length && d.allergens.includes("not-analyzed")) problems.push(`${p.name}: not analyzed for allergens`);
      // USC sometimes labels a dish vegan without also labeling it vegetarian; vegan counts as vegetarian.
      const has = (x) => d.prefs.includes(x) || (x === "vegetarian" && d.prefs.includes("vegan"));
      const missing = (profile.diet ?? []).filter((x) => !has(x));
      if (missing.length) problems.push(`${p.name}: missing ${missing.join(", ")}`);
    }
    if (overstates.test(p.why)) problems.push(`${p.name}: reason overstates safety`);
    if ((rec.hidden ?? []).some((h) => h.id === p.id)) problems.push(`${p.name}: is also in the hidden list`);
  }
  if (overstates.test(rec.summary ?? "")) problems.push("summary overstates safety");
  record("Picks", `${id} (${rec.meal}, ${rec.date})`, problems.length === 0, problems.join("; ") || `${rec.hall}, ${rec.picks.length} dishes, ${rec.hidden?.length ?? 0} hidden, source: ${rec.source}`);
}

// 5. The week view answers for a restricted profile.
const week = await post("/api/week", { profile: { avoid: ["peanuts", "tree-nuts"], diet: [], likes: [], dislikes: [] } });
const days = week.ok ? ((await week.json()).days ?? []) : [];
record("Planning", "POST /api/week returns 7 days", days.length === 7, `HTTP ${week.status}, ${days.length} days`);

// Report.
const failed = results.filter((r) => !r.ok);
if (md) {
  console.log("| Area | Check | Result | Detail |\n| --- | --- | --- | --- |");
  for (const r of results) console.log(`| ${r.area} | ${r.name} | ${r.ok ? "Pass" : "**FAIL**"} | ${r.detail.replaceAll("|", "/")} |`);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed against ${base}.`);
} else {
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  [${r.area}] ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
  console.log(`\n${results.length - failed.length} of ${results.length} checks passed against ${base}`);
}
process.exit(failed.length ? 1 : 0);
