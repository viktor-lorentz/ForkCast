// Renders cover.html to cover.png (3000x2000) with headless Chrome. Run: node docs/cover/export.mjs
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const dir = dirname(fileURLToPath(import.meta.url));
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
execFileSync(chrome, ["--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=3000,2000", "--virtual-time-budget=8000", `--screenshot=${join(dir, "cover.png")}`, "file://" + join(dir, "cover.html")], { stdio: "inherit" });
console.log("wrote", join(dir, "cover.png"));
