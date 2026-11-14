// Saves USC's current dining hours to data/hours.json (the fallback when the live page is unavailable).
import { writeFileSync } from "node:fs";
import { parseHours } from "../lib/hours";
const res = await fetch("https://hospitality.usc.edu/hours-of-operation/");
const halls = parseHours(await res.text());
writeFileSync("data/hours.json", JSON.stringify(halls, null, 2) + "\n");
console.log(JSON.stringify(halls));
