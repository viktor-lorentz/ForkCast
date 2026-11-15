"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import type { EnrichedDay } from "@/lib/menus";
import { hoursOn, openStatus, type HoursData } from "@/lib/hours";
import { findGoal } from "@/lib/plate";
import { cleanProfile, profileKey, type Profile } from "@/lib/profile";
import type { Recommendation } from "@/lib/recommend";
import { currentMeal, scoreHalls, type HallScore } from "@/lib/score";
import { HALLS, LABEL_NAMES, NOT_ANALYZED } from "@/lib/types";
import { describeClaim } from "@/lib/verify";
import { STYLES } from "@/lib/styles";
import { rate, ratingOf, type Rated } from "@/lib/taste";
import { findDorm } from "@/lib/walking";
import { LabelTag } from "./Chip";
import { TakeItWithYou } from "./TakeItWithYou";
import { Logo } from "./Logo";
import { ThisWeek } from "./ThisWeek";
import { card, mealName } from "@/lib/lang";
import { ateNote, ateOn, logAte, pruneHistory, type Ate } from "@/lib/history";
import { closingMap, closingText, HERO_WINDOW, laMinutes } from "@/lib/closing";
import { FoodTags, PlateCard, Thumbs } from "./Taste";
import { logMealVisit, pendingVisit, RateInline, RateMealPrompt, ScoreBadge, useScores, type Ratings } from "./Ratings";

const keyNoTaste = (p: Profile) => profileKey({ ...p, taste: undefined, ate: undefined });
const hallName = (id: string) => HALLS.find((h) => h.id === id)?.name ?? id;
const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;
const shortStation = (s: string) => s.replace(/\s*\(.*\)\s*$/, "");

function laDate(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

/** After 10 PM the halls are closed, so open on tomorrow's menus. */
function laHour(): number {
  const [h, m] = new Date().toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour12: false }).split(":").map(Number);
  return h + m / 60;
}

function initialDayOffset(): number {
  const hour = Number(new Date().toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", hour12: false }));
  return hour >= 22 ? 1 : 0;
}

type Loaded<T> = { ok: true; data: T } | { ok: false; tooMany?: boolean };
const TOO_MANY = "Too many requests, try again in a minute";
const failed = (err: unknown) => ({ ok: false as const, tooMany: (err as Error)?.message === TOO_MANY });

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  // Give up after 45s so a stalled request turns into a "Try again" button instead of an endless spinner.
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(45_000) });
  if (res.status === 429) throw new Error(TOO_MANY);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function ProfileLine({ profile }: { profile: Profile }) {
  const parts = [
    ...profile.avoid.map((a) => `No ${LABEL_NAMES[a]}`),
    ...(profile.exclude ?? []).map((w) => `No ${w}`),
    ...profile.diet.map((d) => LABEL_NAMES[d]),
    ...(profile.styles ?? []).map((s) => STYLES.find((x) => x.id === s)!.name),
    ...(profile.goal ? [findGoal(profile.goal)!.name] : []),
    ...profile.likes.slice(0, 3).map((l) => `Loves ${l}`),
  ];
  return <p className="truncate text-sm text-stone-500">{parts.length ? parts.join(" · ") : "No restrictions set"}</p>;
}

function HallRow({
  s,
  meal,
  isPick,
  max,
  open,
  onToggle,
  rateProps,
  hoursText,
  ratings,
  ate,
  today,
}: {
  ate?: Ate[];
  today: string;
  ratings: Ratings;
  rateProps: Omit<Parameters<typeof Thumbs>[0], "dish" | "small">;
  hoursText: { text: string; open: boolean | null; warn: boolean } | null;
  s: HallScore;
  meal: string;
  isPick: boolean;
  max: number;
  open: boolean;
  onToggle: () => void;
}) {
  const n = s.mains.length + s.sides.length;
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={[
          hallShort(s.hall),
          isPick ? "our pick" : null,
          s.walk !== null ? `${s.walk} minute walk` : null,
          s.open ? `${s.mains.length} mains and ${s.sides.length} sides you can eat` : `not serving ${meal.toLowerCase()}`,
          hoursText?.text ?? null,
        ]
          .filter(Boolean)
          .join(", ")}
        className="block w-full rounded-lg text-left"
      >
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className={`font-semibold transition-colors ${isPick ? "text-cardinal" : ""}`}>
            {hallShort(s.hall)}
            {isPick && <span aria-label="our pick"> ★</span>}
            {s.walk !== null && <span className="ml-2 font-normal text-stone-400">{s.walk} min walk</span>}
          </span>
          <span className="shrink-0 text-stone-500">
            {s.open ? `${s.mains.length} mains · ${s.sides.length} sides` : `Not serving ${meal.toLowerCase()}`}
            <span className="ml-1.5 inline-block w-2 text-stone-400">{open ? "−" : "+"}</span>
          </span>
        </div>
        {hoursText && (
          <p
            className={`text-xs ${
              hoursText.warn
                ? "font-semibold text-red-700"
                : hoursText.open === true
                  ? "text-emerald-700"
                  : hoursText.open === false
                    ? "text-stone-400"
                    : "text-stone-500"
            }`}
          >
            {hoursText.warn && "⏱ "}
            {hoursText.text}
          </p>
        )}
        <div aria-hidden className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${isPick ? "bg-cardinal" : "bg-stone-400"}`}
            style={{ width: `${(n / max) * 100}%` }}
          />
        </div>
      </button>
      {open && (
        <div className="rise mt-3 rounded-xl bg-stone-50 p-3 text-sm">
          {n === 0 && <p className="text-stone-500">Nothing here fits your profile for {meal.toLowerCase()}.</p>}
          {(["mains", "sides"] as const).map(
            (group) =>
              s[group].length > 0 && (
                <div key={group} className="mb-2 last:mb-0">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">{group}</p>
                  <ul className="flex flex-col gap-2">
                    {s[group].map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-stone-800">
                            {d.name}
                            <ScoreBadge score={ratings.scoreOf(d.name)} className="ml-1.5 align-[1px]" />
                          </span>
                          <span className="block truncate text-xs text-stone-400">
                            {shortStation(d.station)}
                            {ateNote(ate, d.name, today) && <span className="text-amber-900"> · {ateNote(ate, d.name, today)}</span>}
                          </span>
                        </span>
                        <Thumbs small dish={d} {...rateProps} />
                      </li>
                    ))}
                  </ul>
                </div>
              ),
          )}
        </div>
      )}
    </li>
  );
}

export function Today({
  profile,
  starter,
  onEdit,
  onSwitch,
  onChange,
}: {
  profile: Profile;
  /** Set right after a one-tap starter, e.g. "Halal". */
  starter?: string | null;
  onEdit: () => void;
  onSwitch: (p: Profile) => void;
  /** Saves a small change (a rating) without leaving the screen. */
  onChange: (p: Profile) => void;
}) {
  const [dayOffset, setDayOffset] = useState(initialDayOffset);
  const date = laDate(dayOffset);
  const [chosenMeal, setChosenMeal] = useState<string | null>(null);
  // Results are kept by key, so going back to a day, meal or profile you've already seen is instant.
  const [menus, setMenus] = useState<Record<string, Loaded<EnrichedDay>>>({});
  const [recs, setRecs] = useState<Record<string, Loaded<Recommendation>>>({});
  const inFlight = useRef(new Set<string>());
  const [whyOpenFor, setWhyOpenFor] = useState<string | null>(null);
  const [hours, setHours] = useState<HoursData | null>(null);
  const [showWeek, setShowWeek] = useState(false);
  useEffect(() => {
    getJson<HoursData>("/api/hours")
      .then(setHours)
      .catch(() => {});
  }, []);
  const [openHall, setOpenHall] = useState<string | null>(null);
  // After a meal, ask how the picks you looked at were.
  const [visit, setVisit] = useState(() => pendingVisit(laDate(0), Date.now(), laHour()));
  // ?ask=rate shows the rating card right away for the current picks (for demos and screenshots).
  const [askNow, setAskNow] = useState(() => new URLSearchParams(window.location.search).get("ask") === "rate");

  const menuEntry = menus[date];
  const day = menuEntry?.ok ? menuEntry.data : null;

  useEffect(() => {
    const key = `menu|${date}`;
    if (menuEntry || inFlight.current.has(key)) return;
    const pending = inFlight.current;
    pending.add(key);
    getJson<EnrichedDay>(`/api/menu?date=${date}`)
      .then((data) => setMenus((m) => ({ ...m, [date]: { ok: true, data } })))
      .catch((err) => setMenus((m) => ({ ...m, [date]: failed(err) })))
      .finally(() => pending.delete(key));
  }, [date, menuEntry]);

  const meals = useMemo(() => (day ? [...new Set(day.halls.flatMap((h) => h.meals))] : []), [day]);
  const meal = chosenMeal && meals.includes(chosenMeal) ? chosenMeal : dayOffset === 0 ? currentMeal(meals) : (meals[0] ?? null);

  // Ratings don't reshuffle the screen while you tap: the view keeps the taste it loaded with,
  // a 👎 just slides that dish away, and "Refresh picks" (or the next visit) asks the AI again.
  const [frozen, setFrozen] = useState({ k: keyNoTaste(profile), taste: profile.taste });
  const viewProfile = useMemo(
    () => {
      // "I ate this" taps count from the next day on, so marking a dish never reloads the picks you're looking at.
      const ate = profile.ate?.filter((h) => h.date < date);
      return { ...profile, ate: ate?.length ? ate : undefined, taste: frozen.k === keyNoTaste(profile) ? frozen.taste : profile.taste };
    },
    [profile, frozen, date],
  );
  const ratingsPending = profileKey({ ...viewProfile, ate: undefined }) !== profileKey({ ...profile, ate: undefined });
  const refreshPicks = () => setFrozen({ k: keyNoTaste(profile), taste: profile.taste });
  // Closing soon: only for today's meal that's on right now. Re-checked every minute.
  const [nowMin, setNowMin] = useState(laMinutes);
  useEffect(() => {
    const id = setInterval(() => setNowMin(laMinutes()), 60_000);
    return () => clearInterval(id);
  }, []);
  const closing = useMemo(
    () =>
      hours && dayOffset === 0 && meal && meal === currentMeal(meals)
        ? closingMap(hours.halls, date, nowMin, findDorm(profile.dorm)?.minutes ?? {})
        : {},
    [hours, dayOffset, meal, meals, date, nowMin, profile.dorm],
  );
  const scores = useMemo(() => (day && meal ? scoreHalls(day, meal, viewProfile, closing) : []), [day, meal, viewProfile, closing]);

  const recKey = `${date}|${meal}|${profileKey(viewProfile)}`;
  const recEntry = recs[recKey];
  const rec = recEntry?.ok ? recEntry.data : null;
  const recFailed = recEntry?.ok === false;
  const canRecommend = Boolean(day && meal);

  const recProfileKey = profileKey(viewProfile);
  useEffect(() => {
    if (!canRecommend || !meal) return;
    const pending = inFlight.current;
    const load = (m: string) => {
      const key = `${date}|${m}|${recProfileKey}`;
      if (recs[key] || pending.has(key)) return;
      pending.add(key);
      getJson<Recommendation>("/api/recommend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: viewProfile, date, meal: m }),
      })
        .then((data) => setRecs((r) => ({ ...r, [key]: { ok: true, data } })))
        .catch((err) => setRecs((r) => ({ ...r, [key]: failed(err) })))
        .finally(() => pending.delete(key));
    };
    load(meal);
    // Once the meal on screen is answered, get the day's other meals ready so switching tabs is instant.
    if (recs[`${date}|${meal}|${recProfileKey}`]) meals.filter((m) => m !== meal).forEach(load);
  }, [canRecommend, recs, recProfileKey, viewProfile, date, meal, meals]);

  const retry = () => {
    const drop = <T,>(m: Record<string, T>, key: string) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== key));
    if (!day) setMenus((m) => drop(m, date));
    else setRecs((m) => drop(m, recKey));
  };

  const showWhy = whyOpenFor === recKey;
  const pickHall = rec?.hall ?? null;
  const pickScore = scores.find((s) => s.hall === pickHall);
  const pickClose = pickHall ? closing[pickHall as keyof typeof closing] : undefined;
  // The main card shows the closing time when the pick closes within 45 minutes.
  const pickClosing = pickClose && pickClose.minutesLeft !== null && pickClose.minutesLeft <= HERO_WINDOW ? pickClose.closesAt : null;
  const maxCount = Math.max(1, ...scores.map((s) => s.mains.length + s.sides.length));
  const nothing = scores.length > 0 && scores.every((s) => s.mains.length + s.sides.length === 0);
  const totalDishes = day ? day.halls.reduce((n, h) => n + h.dishes.filter((d) => d.meal === meal && d.kind !== "notice").length, 0) : 0;
  const totalHidden = scores.reduce((n, s) => n + s.hidden.length, 0);
  const dorm = findDorm(profile.dorm);
  const t = card(profile.lang);
  // "I ate this" keeps 7 days; drop older entries when the app opens.
  useEffect(() => {
    const kept = pruneHistory(profile.ate, laDate(0));
    if (profile.ate && kept.length !== profile.ate.length) onChange({ ...profile, ate: kept.length ? kept : undefined });
  }, [profile, onChange]);
  const goal = findGoal(profile.goal);
  const byId = new Map((day?.halls ?? []).flatMap((h) => h.dishes).map((d) => [d.id, d]));
  const [leaving, setLeaving] = useState<string[]>([]);
  const toastSeq = useRef(0);
  const [toast, setToast] = useState<{ dish: Rated; prev: 1 | 0 | -1; at: number } | null>(null);
  const commitRate = (dish: Rated, value: 1 | 0 | -1) => onChange({ ...profile, taste: rate(profile.taste, dish, value) });
  const onRate = (dish: Rated, value: 1 | 0 | -1) => {
    const prev = ratingOf(profile.taste, dish.name);
    commitRate(dish, value);
    if (value === -1) {
      const at = ++toastSeq.current;
      setToast({ dish, prev, at });
      setTimeout(() => setToast((t) => (t?.at === at ? null : t)), 4500);
    }
  };
  const rateProps = { taste: profile.taste, onRate };
  // A 👎 on one of your picks slides the card away first, then saves the rating.
  const ratePick = (id: string) => (dish: Rated, value: 1 | 0 | -1) => {
    if (value !== -1) return onRate(dish, value);
    setLeaving((l) => [...l, id]);
    setTimeout(() => {
      onRate(dish, -1);
      setLeaving((l) => l.filter((x) => x !== id));
    }, 280);
  };
  useEffect(() => {
    if (dayOffset !== 0 || !rec || !meal || rec.picks.length === 0) return;
    logMealVisit({ date, meal, hall: rec.hall, dishes: rec.picks.filter((p) => ratingOf(profile.taste, p.name) !== -1).map((p) => p.name) });
  }, [dayOffset, rec, meal, date, profile.taste]);
  const shownPicks = (rec?.picks ?? []).filter((p) => ratingOf(profile.taste, p.name) !== -1 || leaving.includes(p.id));
  const hoursFor = (hall: string) => {
    const h = hours?.halls.find((x) => x.hall === hall);
    if (!h) return null;
    const soon = closingText(closing[hall as keyof typeof closing]);
    if (soon) return { text: soon, open: null, warn: true };
    const { hours: range, label } = hoursOn(h, date);
    const status = dayOffset === 0 ? openStatus(range, nowMin) : null;
    return { text: `${status ? status.text : range}${label ? ` · ${label}` : ""}`, open: status ? status.open : null, warn: false };
  };
  const askVisit = useMemo(
    () => (askNow && rec && meal && rec.picks.length > 0 ? { date, meal, hall: rec.hall, dishes: rec.picks.map((p) => p.name), at: 0 } : null),
    [askNow, rec, meal, date],
  );
  const shownVisit = visit ?? askVisit;
  const dishNames = useMemo(
    () => [...(day?.halls ?? []).flatMap((h) => h.dishes).filter((d) => d.kind === "main" || d.kind === "side" || d.kind === "dessert").map((d) => d.name), ...(visit?.dishes ?? []), ...(askVisit?.dishes ?? [])],
    [day, visit, askVisit],
  );
  const ratings = useScores(dishNames, date);
  // The logo takes you home: today, the meal that's on now, everything closed, back at the top.
  const goHome = () => {
    setDayOffset(initialDayOffset());
    setChosenMeal(null);
    setOpenHall(null);
    setWhyOpenFor(null);
    setShowWeek(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const plateHall = scores.find((s) => s.hall === (pickHall ?? scores[0]?.hall));

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 pt-1">
        <div className="min-w-0">
          <h1>
            <button
              type="button"
              onClick={goHome}
              aria-label="ForkCast: back to today's pick"
              className="select-none text-xl transition active:scale-95 active:opacity-70"
            >
              <Logo />
            </button>
          </h1>
          {starter ? (
            <p className="text-sm text-stone-500">
              Quick start: {starter} ·{" "}
              <button type="button" onClick={onEdit} className="font-semibold text-cardinal underline-offset-2 active:underline">
                Adjust
              </button>
            </p>
          ) : (
            <ProfileLine profile={profile} />
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/rate?date=${date}${meal ? `&meal=${encodeURIComponent(meal)}` : ""}${pickHall ? `&hall=${pickHall}` : ""}`}
            className="flex items-center gap-1 rounded-full bg-[#1c1917] px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 transition active:scale-95"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-gold" aria-hidden>
              <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
            </svg>
            Rate
          </a>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-stone-300 bg-card px-3.5 py-1.5 text-sm font-medium transition active:scale-95"
          >
            Edit
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          "Today",
          "Tomorrow",
          // A later day opened from "This week" gets its own chip.
          ...(dayOffset >= 2
            ? [new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })]
            : []),
        ].map((label, idx) => {
          const i = idx === 2 ? dayOffset : idx;
          return (
          <button
            key={label}
            type="button"
            aria-pressed={dayOffset === i}
            onClick={() => {
              setDayOffset(i);
              setChosenMeal(null);
              setOpenHall(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
              dayOffset === i ? "bg-ink text-ink-fg" : "bg-card text-stone-600 ring-1 ring-stone-300"
            }`}
          >
            {label}
          </button>
          );
        })}
      </div>

      {shownVisit && (
        <RateMealPrompt
          key={`${shownVisit.date}|${shownVisit.meal}`}
          visit={shownVisit}
          ratings={ratings}
          onClose={() => (visit ? setVisit(null) : setAskNow(false))}
        />
      )}

      {meals.length > 1 && (
        <div className="flex gap-1 rounded-xl bg-stone-200/70 p-1" role="tablist" aria-label="Meal">
          {meals.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={m === meal}
              onClick={() => {
                setChosenMeal(m);
                setOpenHall(null);
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${m === meal ? "bg-card text-cardinal shadow-sm" : "text-stone-600"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {menuEntry?.ok === false && (
        <div className="rise rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ring-stone-200">
          <p className="font-semibold">Couldn&apos;t load USC&apos;s menus</p>
          <p className="mt-1 text-sm text-stone-500">Check your connection and try again.</p>
          <button type="button" onClick={retry} className="mt-3 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white active:brightness-90">
            Try again
          </button>
        </div>
      )}

      {!menuEntry && (
        <div className="rounded-3xl bg-brand p-5 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-wide text-gold">Just a moment</p>
          <p className="mt-1 animate-pulse text-3xl font-bold leading-tight text-white/70">Reading menus...</p>
          <p className="mt-2 min-h-[4.5rem] text-[0.9375rem] leading-snug text-white/90">Getting the dishes from all three dining halls.</p>
        </div>
      )}

      {day && !meal && (
        <div className="rise rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ring-stone-200">
          <p className="font-semibold">No menus posted yet</p>
          <p className="mt-1 text-sm text-stone-500">USC hasn&apos;t published menus for this day.</p>
        </div>
      )}

      {day && meal && (
        <>
          <section className="rounded-3xl bg-brand p-5 text-white shadow-lg" aria-live="polite" lang={profile.lang ?? "en"}>
            <p className="text-sm font-medium uppercase tracking-wide text-gold">
              {mealName(meal, profile.lang)} · {nothing ? t.headsUp : t.goTo}
            </p>
            {nothing ? (
              <p className="mt-1 text-3xl font-bold leading-tight">{t.noMatch}</p>
            ) : pickHall ? (
              <p key={`${date}|${meal}|${pickHall}`} className="rise mt-1 text-3xl font-bold leading-tight">
                {hallName(pickHall)}
              </p>
            ) : recFailed ? (
              <p className="mt-1 text-3xl font-bold leading-tight">Hmm, that didn&apos;t work</p>
            ) : (
              <p className="mt-1 animate-pulse text-3xl font-bold leading-tight text-white/70">{t.comparing}</p>
            )}

            <div className="mt-2 min-h-[4.5rem] text-[0.9375rem] leading-snug text-white/90">
              {rec ? (
                <div key={rec.summary} className="rise">
                  {pickClosing && !nothing && (
                    <p className="mb-1 text-sm font-semibold text-gold">⏱ {t.closesAt(pickClosing)}</p>
                  )}
                  {pickScore && pickScore.walk !== null && dorm && !nothing && (
                    <p className="mb-1 text-sm font-medium text-gold">
                      {t.walk(pickScore.walk, dorm.name)}
                    </p>
                  )}
                  <p>{rec.summary}</p>
                </div>
              ) : recFailed ? (
                <div>
                  <p>
                    {recEntry && !recEntry.ok && recEntry.tooMany
                      ? `${TOO_MANY}. The hall comparison below still works.`
                      : "We couldn't get your picks. The hall comparison below still works."}
                  </p>
                  <button type="button" onClick={retry} className="mt-2 rounded-full bg-card px-4 py-1.5 text-sm font-semibold text-cardinal active:scale-95">
                    Try again
                  </button>
                </div>
              ) : nothing ? (
                <p>Nothing on USC&apos;s {meal.toLowerCase()} menus matches your profile.</p>
              ) : (
                <p>
                  Checked {totalDishes} dishes at 3 halls{totalHidden > 0 ? ` and hid ${totalHidden} that don't fit you` : ""}. Picking your plate...
                </p>
              )}
            </div>

            {rec && rec.picks.length > 0 && rec.verification.passed && (
              <button
                type="button"
                onClick={() => setWhyOpenFor(recKey)}
                className="rise mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition active:scale-95"
              >
                <span className="text-gold">✓</span> {t.checked}
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-3 text-sm font-semibold text-stone-500">Dishes that fit you, by hall</h2>
            <ul className="flex flex-col gap-3.5">
              {scores.map((s) => (
                <HallRow
                  key={s.hall}
                  s={s}
                  meal={meal}
                  isPick={s.hall === pickHall && !nothing}
                  max={maxCount}
                  rateProps={rateProps}
                  ratings={ratings}
                  ate={profile.ate}
                  today={laDate(0)}
                  hoursText={hoursFor(s.hall)}
                  open={openHall === s.hall}
                  onToggle={() => setOpenHall(openHall === s.hall ? null : s.hall)}
                />
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-400">
              Tap a hall to see everything you can eat there. Thumbs up or down any dish to teach ForkCast your taste.{" "}
              <a href={`/rate?date=${date}&meal=${encodeURIComponent(meal)}${pickHall ? `&hall=${pickHall}` : ""}`} className="font-medium text-cardinal">
                Rate what you ate →
              </a>
            </p>
          </section>

          {!nothing && !recFailed && (
            <section className="flex flex-col gap-2">
              <h2 className="flex justify-between px-1 text-sm font-semibold text-stone-500">
                <span>Your plate{pickHall ? ` at ${hallShort(pickHall)}` : ""}</span>
                {ratingsPending && rec && (
                  <button type="button" onClick={refreshPicks} className="rise rounded-full bg-ink px-3 py-1 text-xs font-semibold text-ink-fg transition active:scale-95">
                    ↻ Refresh picks
                  </button>
                )}
              </h2>
              {!rec && [0, 1, 2].map((i) => <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-card ring-1 ring-stone-200" />)}
              {rec && shownPicks.length === 0 && (
                <p className="rise rounded-2xl bg-card p-4 text-sm text-stone-500 ring-1 ring-stone-200">You passed on all of these. Tap Refresh picks for new ones.</p>
              )}
              {shownPicks.map((p, i) => {
                const others = p.allergens.filter((a) => a !== NOT_ANALYZED && !(profile.avoid as string[]).includes(a));
                const out = leaving.includes(p.id);
                return (
                  <div key={`${recKey}|${p.id}`} className={`grid transition-all duration-300 ease-out ${out ? "grid-rows-[0fr] -translate-x-6 opacity-0" : "grid-rows-[1fr]"}`}>
                  <article
                    className="rise min-h-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{p.name}</h3>
                        <p className="truncate text-xs text-stone-400">{shortStation(p.station)}</p>
                      </div>
                      {byId.get(p.id) && <Thumbs dish={byId.get(p.id)!} taste={profile.taste} onRate={ratePick(p.id)} />}
                    </div>
                    <p className="mt-1 text-sm text-stone-600" lang={profile.lang ?? "en"}>
                      {p.why}
                    </p>
                    <FoodTags dish={p} className="mt-1.5" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.claims.map((c) => (
                        <LabelTag key={c} tone="green" text={describeClaim(c)} />
                      ))}
                      {others.length > 0 && <LabelTag tone="stone" text={`Contains ${others.map((a) => LABEL_NAMES[a] ?? a).join(", ")}`} />}
                    </div>
                    <RateInline
                      name={p.name}
                      ratings={ratings}
                      ate={
                        dayOffset === 0 && byId.get(p.id)
                          ? {
                              eaten: ateOn(profile.ate, p.name, date),
                              note: ateNote(profile.ate, p.name, date),
                              onToggle: () => onChange({ ...profile, ate: logAte(profile.ate, byId.get(p.id)!, date, !ateOn(profile.ate, p.name, date)) }),
                            }
                          : undefined
                      }
                    />
                  </article>
                  </div>
                );
              })}
            </section>
          )}

          {goal && plateHall && !nothing && plateHall.open && (
            <PlateCard
              key={`${date}|${meal}|${plateHall.hall}`}
              goal={goal}
              hallLabel={hallShort(plateHall.hall)}
              plate={plateHall.plate}
              onChangeGoal={onEdit}
              {...rateProps}
            />
          )}

          {rec && rec.picks.length > 0 && (
            <section className="rise rounded-2xl bg-card shadow-sm ring-1 ring-stone-200">
              <button
                type="button"
                aria-expanded={showWhy}
                onClick={() => setWhyOpenFor(showWhy ? null : recKey)}
                className="flex w-full items-center justify-between p-4 text-left font-semibold"
              >
                Why {hallShort(rec.hall)}? How we checked
                <span className="text-stone-400">{showWhy ? "−" : "+"}</span>
              </button>
              {showWhy && (
                <div className="rise flex flex-col gap-4 border-t border-stone-100 p-4 text-sm">
                  <div>
                    <p className="mb-1 font-semibold">
                      {rec.source === "ai" ? "AI picks, verified by code against USC's labels" : "Picked by our rules (the AI was unavailable)"}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {rec.verification.checks.map((c, i) => (
                        <li key={i} className="flex gap-2">
                          <span className={c.ok ? "text-emerald-700" : "text-red-700"}>{c.ok ? "✓" : "✗"}</span>
                          <span className="text-stone-700">{c.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {rec.hidden.length > 0 && (
                    <div>
                      <p className="mb-1 font-semibold">Hidden at {hallShort(rec.hall)} for you</p>
                      <ul className="flex flex-col gap-1.5">
                        {rec.hidden.map((h) => (
                          <li key={h.id} className="flex flex-col">
                            <span className="text-stone-800">{h.name}</span>
                            <span className="text-xs text-red-700">{h.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rec.halls.some((h) => h.hiddenForAllergens > 0) && (
                    <p className="text-xs text-stone-500">
                      {rec.halls
                        .filter((h) => h.open)
                        .map((h) => `${hallShort(h.hall)}: ${h.hiddenForAllergens} hidden for allergies`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <ThisWeek
        profile={profile}
        onOpenDay={(offset, m) => {
          setDayOffset(offset);
          setChosenMeal(m);
          setOpenHall(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <TakeItWithYou profile={profile} />

      {hours && (
        <section className="rounded-2xl bg-card shadow-sm ring-1 ring-stone-200">
          <button
            type="button"
            aria-expanded={showWeek}
            onClick={() => setShowWeek(!showWeek)}
            className="flex w-full items-center justify-between p-4 text-left font-semibold"
          >
            Dining hall hours
            <span className="text-stone-400">{showWeek ? "−" : "+"}</span>
          </button>
          {showWeek && (
            <div className="rise flex flex-col gap-4 border-t border-stone-100 p-4 text-sm">
              {hours.halls.map((h) => (
                <div key={h.hall}>
                  <p className="mb-1 font-semibold">{hallName(h.hall)}</p>
                  <ul className="grid grid-cols-[3rem_1fr] gap-x-2 gap-y-0.5 text-stone-600">
                    {Object.entries(h.regular).map(([d, r]) => (
                      <li key={d} className="contents">
                        <span className="text-stone-400">{d}</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                  {h.special
                    .filter((s) => s.date >= date.slice(5).replace("-", "/"))
                    .map((s) => (
                      <p key={s.date} className="mt-1 text-xs text-cardinal">
                        {s.date} {s.label}: {s.hours}
                      </p>
                    ))}
                </div>
              ))}
              <p className="text-xs text-stone-400">From USC Hospitality&apos;s hours page{hours.source === "saved" ? " (saved copy)" : ", updated every few hours"}.</p>
            </div>
          )}
        </section>
      )}

      <p className="px-1 text-xs leading-relaxed text-stone-500">
        Based on USC Hospitality&apos;s allergen and diet labels{day?.source === "snapshot" ? " (saved copy)" : ""}. Labels can change and kitchens
        share equipment, so always confirm with dining staff if you have a serious allergy.
        {dorm && " Walking times are estimates from OpenStreetMap."}
      </p>

      {toast && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" role="status">
          <div key={toast.at} className="rise flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-ink-fg shadow-xl">
            <span className="min-w-0 truncate">We&apos;ll skip {toast.dish.name} from now on</span>
            <button
              type="button"
              onClick={() => {
                commitRate(toast.dish, toast.prev);
                setToast(null);
              }}
              className="shrink-0 font-semibold text-gold"
            >
              Undo
            </button>
          </div>
        </div>
      )}

      <label className="flex items-center gap-2 px-1 text-xs text-stone-500">
        <span className="shrink-0">Try a sample student:</span>
        <select
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-card px-2 py-1.5 text-stone-700"
          value=""
          onChange={(e) => {
            const demo = DEMO_PROFILES.find((d) => d.id === e.target.value);
            if (demo) onSwitch(cleanProfile(demo.profile));
          }}
        >
          <option value="">Choose...</option>
          {DEMO_PROFILES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
