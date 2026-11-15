import { createClient } from "@vercel/global-config";

/**
 * Emergency switches, flipped in Vercel's dashboard (Storage → Global Config, formerly Edge Config)
 * without a redeploy. Everything is off when the store isn't connected or can't be read.
 */
export interface Switches {
  /** Read data/snapshots instead of USC's live site (same as DEMO_MODE=1). */
  useSavedMenus: boolean;
  /** Skip the AI picker and use the code-only rules pick. */
  rulesOnly: boolean;
  /** One-line notice at the top of the app; empty = none. */
  banner: string;
}

export const SWITCHES_OFF: Switches = { useSavedMenus: false, rulesOnly: false, banner: "" };
const TTL_MS = 15_000;

/** Accepts true/"true"/1 for the flags and trims the banner to one short line. */
export function parseSwitches(raw: Record<string, unknown> | null | undefined): Switches {
  const on = (v: unknown) => v === true || v === 1 || (typeof v === "string" && ["true", "1", "on", "yes"].includes(v.trim().toLowerCase()));
  const banner = typeof raw?.banner === "string" ? raw.banner.replace(/\s+/g, " ").trim().slice(0, 140) : "";
  return { useSavedMenus: on(raw?.useSavedMenus), rulesOnly: on(raw?.rulesOnly), banner };
}

let cache: { at: number; value: Switches } | null = null;

export async function getSwitches(env: Record<string, string | undefined> = process.env): Promise<Switches> {
  const conn = env.GLOBAL_CONFIG || env.EDGE_CONFIG;
  if (!conn) return SWITCHES_OFF;
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let value = cache?.value ?? SWITCHES_OFF;
  try {
    const client = createClient(conn);
    const raw = await Promise.race([
      client.getAll(["useSavedMenus", "rulesOnly", "banner"]),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("switches timeout")), 1500)),
    ]);
    value = parseSwitches(raw as unknown as Record<string, unknown>);
  } catch (err) {
    console.warn("Couldn't read emergency switches, keeping the last known values:", (err as Error).message);
  }
  cache = { at: Date.now(), value };
  return value;
}
