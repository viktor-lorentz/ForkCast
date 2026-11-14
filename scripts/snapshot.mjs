// Saves USC's raw menus for today and the next N days to data/snapshots/<date>/<hall>.json.
// Usage: node scripts/snapshot.mjs [days=2]
import { mkdir, writeFile } from "node:fs/promises";

const HALLS = ["evk", "parkside", "university-village"];
const days = Number(process.argv[2] ?? 2);
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

for (let i = 0; i < days; i++) {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i);
  const date = d.toISOString().slice(0, 10);
  const [y, m, day] = date.split("-");
  await mkdir(`data/snapshots/${date}`, { recursive: true });
  for (const hall of HALLS) {
    const url = `https://hospitality.usc.edu/wp-json/hsp-api/v1/get-res-dining-menus/${hall}?y=${y}&m=${m}&d=${day}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (USC student hackathon project)" } });
    if (!res.ok) throw new Error(`${hall} ${date}: HTTP ${res.status}`);
    const json = await res.json();
    await writeFile(`data/snapshots/${date}/${hall}.json`, JSON.stringify(json, null, 2) + "\n");
    const items = (json.meals ?? []).flatMap((m) => m.stations ?? []).reduce((n, s) => n + (s.menu?.length ?? 0), 0);
    console.log(`${date} ${hall}: ${items} items`);
  }
}
