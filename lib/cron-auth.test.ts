import { afterEach, describe, expect, it, vi } from "vitest";
import { cronAuthorized } from "./cron-auth";

const req = (auth?: string) => new Request("https://x.test/api/email/daily", { headers: auth ? { authorization: auth } : {} });

describe("cronAuthorized", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("requires the exact bearer secret when one is set", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(cronAuthorized(req("Bearer s3cret"), { strict: true })).toBe(true);
    expect(cronAuthorized(req("Bearer wrong"), { strict: true })).toBe(false);
    expect(cronAuthorized(req(), { strict: false })).toBe(false);
  });

  it("refuses the email cron in production when the secret is missing", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(cronAuthorized(req(), { strict: true })).toBe(false);
    expect(cronAuthorized(req(), { strict: false })).toBe(true);
  });

  it("allows local runs without a secret", () => {
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "");
    expect(cronAuthorized(req(), { strict: true })).toBe(true);
  });
});
