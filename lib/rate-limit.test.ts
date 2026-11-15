import { describe, expect, it, vi } from "vitest";

const counts = new Map<string, number>();
vi.mock("./email/store", () => ({
  redis: () => ({
    incr: async (k: string) => {
      counts.set(k, (counts.get(k) ?? 0) + 1);
      return counts.get(k)!;
    },
    expire: async () => 1,
  }),
}));

const { clientIp, LIMITS, rateLimit, TOO_MANY } = await import("./rate-limit");
const req = (ip: string) => new Request("https://x.test/api/parse-profile", { method: "POST", headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });

describe("per-IP rate limits", () => {
  it("allows up to the limit, then answers 429 with a friendly message", async () => {
    const now = 1_000_000_020_000;
    for (let i = 0; i < LIMITS["parse-profile"]; i++) expect(await rateLimit(req("1.2.3.4"), "parse-profile", now)).toBeNull();
    const res = await rateLimit(req("1.2.3.4"), "parse-profile", now);
    expect(res?.status).toBe(429);
    expect(await res?.json()).toEqual({ error: TOO_MANY, tooMany: true });
    expect(Number(res?.headers.get("retry-after"))).toBeGreaterThan(0);
  });
  it("counts each IP, route and minute separately", async () => {
    const now = 1_000_000_020_000;
    expect(await rateLimit(req("5.6.7.8"), "parse-profile", now)).toBeNull();
    expect(await rateLimit(req("1.2.3.4"), "recommend", now)).toBeNull();
    expect(await rateLimit(req("1.2.3.4"), "parse-profile", now + 60_000)).toBeNull();
  });
  it("reads the client IP from the first forwarded address", () => {
    expect(clientIp(req("9.9.9.9"))).toBe("9.9.9.9");
  });
});
