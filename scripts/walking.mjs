// Precomputes walking minutes from each USC residence to each dining hall using
// OpenStreetMap foot routing, and writes data/walking.json. Run once: node scripts/walking.mjs
// Coordinates are from OpenStreetMap; entries marked approx were placed by hand next to known neighbors.
import { writeFile } from "node:fs/promises";

const HALLS = {
  evk: [34.02138, -118.28211],
  parkside: [34.01888, -118.29109],
  "university-village": [34.02587, -118.28607],
};

const DORMS = [
  ["birnkrant", "Birnkrant", 34.0211, -118.2826, true],
  ["new-north", "New North", 34.0218, -118.2819, true],
  ["marks-tower", "Marks Tower", 34.01971, -118.28207],
  ["marks-hall", "Marks Hall", 34.0199, -118.2816, true],
  ["pardee-tower", "Pardee Tower", 34.02001, -118.28257],
  ["trojan-hall", "Trojan Hall", 34.0204, -118.2816, true],
  ["parkside-irc", "Parkside International (IRC)", 34.01919, -118.29091],
  ["parkside-ahf", "Parkside Arts & Humanities", 34.01873, -118.28976],
  ["parkside-apts", "Parkside Apartments", 34.01928, -118.29032],
  ["mccarthy", "McCarthy Honors (Village)", 34.02568, -118.28562],
  ["cale-irani", "Cale & Irani (Village)", 34.02492, -118.28566],
  ["cowlings-ilium", "Cowlings & Ilium (Village)", 34.02606, -118.28459],
  ["nemirovsky-bohnett", "Nemirovsky & Bohnett (Village)", 34.02472, -118.28422],
  ["mcmorrow", "McMorrow (Village)", 34.02442, -118.28467],
  ["webb-tower", "Webb Tower", 34.02463, -118.28772],
  ["fluor-tower", "Fluor Tower", 34.02492, -118.28831],
  ["cardinal-gardens", "Cardinal Gardens", 34.0261, -118.28704],
  ["century", "Century Apartments", 34.02625, -118.28951],
  ["la-sorbonne", "La Sorbonne", 34.0262, -118.28857],
  ["troy-hall", "Troy Hall", 34.02572, -118.28178],
  ["cardinal-n-gold", "Cardinal 'n Gold", 34.02654, -118.28061],
  ["annenberg-house", "Annenberg House", 34.02883, -118.27917],
  ["gateway", "University Gateway", 34.023, -118.28005],
];

const out = { source: "OpenStreetMap foot routing (routing.openstreetmap.de)", dorms: [] };
for (const [id, name, lat, lon, approx] of DORMS) {
  const minutes = {};
  for (const [hall, [hlat, hlon]] of Object.entries(HALLS)) {
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${lon},${lat};${hlon},${hlat}?overview=false`;
    const res = await fetch(url, { headers: { "User-Agent": "forkcast-hackathon/1.0" } });
    const json = await res.json();
    if (json.code !== "Ok") throw new Error(`${id} → ${hall}: ${json.code}`);
    minutes[hall] = Math.max(1, Math.round(json.routes[0].duration / 60));
    await new Promise((r) => setTimeout(r, 250));
  }
  out.dorms.push({ id, name, ...(approx ? { approx: true } : {}), minutes });
  console.log(name.padEnd(34), minutes);
}
await writeFile("data/walking.json", JSON.stringify(out, null, 2) + "\n");
