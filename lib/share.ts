import { cleanProfile, type Profile } from "./profile";
import type { Rated } from "./taste";
import { isLang } from "./lang";

/**
 * A profile packed into a URL fragment ("#p=..."), for opening the app on another device.
 * The fragment never reaches our server or anyone's logs: it stays in the browser.
 */
type Packed = {
  a?: string[];
  d?: string[];
  l?: string[];
  x?: string[];
  e?: string[];
  z?: 1;
  r?: string;
  g?: string;
  s?: string[];
  u?: [string, string, string][];
  w?: [string, string, string][];
  n?: string;
  h?: [string, string, string, string][];
};

const toTuples = (xs: Rated[] = []) => xs.map((r) => [r.name, r.cuisine, r.protein] as [string, string, string]);
const fromTuples = (xs: [string, string, string][] = []) => xs.map(([name, cuisine, protein]) => ({ name, cuisine, protein }));

function b64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function packProfile(p: Profile): string {
  const o: Packed = {};
  if (p.avoid.length) o.a = p.avoid;
  if (p.diet.length) o.d = p.diet;
  if (p.likes.length) o.l = p.likes;
  if (p.dislikes.length) o.x = p.dislikes;
  if (p.exclude?.length) o.e = p.exclude;
  if (p.aaz) o.z = 1;
  if (p.dorm) o.r = p.dorm;
  if (p.goal) o.g = p.goal;
  if (p.styles?.length) o.s = p.styles;
  if (p.taste?.up.length) o.u = toTuples(p.taste.up);
  if (p.taste?.down.length) o.w = toTuples(p.taste.down);
  if (p.lang && p.lang !== "en") o.n = p.lang;
  if (p.ate?.length) o.h = p.ate.map((h) => [h.name, h.cuisine, h.protein, h.date]);
  return b64urlEncode(JSON.stringify(o));
}

/** The profile in a "#p=..." fragment, or null if there isn't a valid one. */
export function unpackProfile(hash: string): Profile | null {
  const m = hash.match(/[#&]p=([\w-]+)/);
  if (!m) return null;
  try {
    const o = JSON.parse(b64urlDecode(m[1])) as Packed;
    return cleanProfile({
      avoid: o.a ?? [],
      diet: o.d ?? [],
      likes: o.l ?? [],
      dislikes: o.x ?? [],
      exclude: o.e,
      aaz: o.z === 1,
      dorm: o.r,
      goal: o.g,
      styles: o.s,
      lang: isLang(o.n) ? o.n : undefined,
      ate: o.h?.map(([name, cuisine, protein, date]) => ({ name, cuisine, protein, date })),
      taste: o.u || o.w ? { up: fromTuples(o.u), down: fromTuples(o.w) } : undefined,
    });
  } catch {
    return null;
  }
}

export const shareUrl = (origin: string, p: Profile) => `${origin}/#p=${packProfile(p)}`;
