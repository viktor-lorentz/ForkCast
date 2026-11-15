import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { DYNAMIC_STRINGS } from "./i18n-dynamic";

/** Every t("...") literal under app/, plus the data-driven strings. Used by the i18n script and test. */
export function allKeys(root = process.cwd()): string[] {
  const keys = new Set<string>(DYNAMIC_STRINGS);
  const walk = (dir: string) => {
    for (const f of readdirSync(dir)) {
      const p = path.join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (p.endsWith(".tsx") && !/ \d+\.tsx$/.test(p)) {
        const src = readFileSync(p, "utf8");
        for (const m of src.matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
      }
    }
  };
  walk(path.join(root, "app"));
  return [...keys].filter(Boolean).sort();
}
