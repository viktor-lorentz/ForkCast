import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  /** Cheap, fast: dish classification and profile parsing. */
  fast: "claude-haiku-5-5",
  /** Picks dishes and writes the explanation. */
  smart: "claude-sonnet-5-5",
} as const;

let client: Anthropic | null = null;

/** Null when no API key is configured, so callers can fall back to code-only behavior. */
export function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  return client;
}
