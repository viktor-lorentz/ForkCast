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
import { rate, type Rated } from "@/lib/taste";
import { findDorm } from "@/lib/walking";
import { LabelTag } from "./Chip";
import { FoodTags, PlateCard, Thumbs } from "./Taste";

const keyNoTaste = (p: Profile) => profileKey({ ...p, taste: undefined });
const hallName = (id: string) => HALLS.find((h) => h.id === id)?.name ?? id;
const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;
const shortStation = (s: string) => s.replace(/\s*\(.*\)\s*$/, "");

function laDate(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

/** After 10 PM the halls are closed, so open on tomorrow's menus. */
function initialDayOffset(): number {
  const hour = Number(new Date().toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour: "2-digit", hour12: false }));
  return hour >= 22 ? 1 : 0;
}

type Loaded<T> = { ok: true; data: T } | { ok: false };

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  // Give up after 45s so a stalled request turns into a "Try again" button instead of an endless spinner.
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function ProfileLine({ profile }: { profile: Profile }) {
  const parts = [
    ...profile.avoid.map((a) => `No ${LABEL_NAMES[a]}`),
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
}: {
  rateProps: Omit<Parameters<typeof Thumbs>[0], "dish" | "small">;
  hoursText: { text: string; open: boolean | null } | null;
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
      <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full text-left">
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
          <p className={`text-xs ${hoursText.open === true ? "text-emerald-700" : hoursText.open === false ? "text-stone-400" : "text-stone-500"}`}>{hoursText.text}</p>
        )}
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
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
                          <span className="block text-stone-800">{d.name}</span>
                          <span className="block truncate text-xs text-stone-400">{shortStation(d.station)}</span>
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
  onEdit,
  onSwitch,
  onChange,
}: {
  profile: Profile;
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

  const menuEntry = menus[date];
  const day = menuEntry?.ok ? menuEntry.data : null;

  useEffect(() => {
    const key = `menu|${date}`;
    if (menuEntry || inFlight.current.has(key)) return;
    const pending = inFlight.current;
    pending.add(key);
    getJson<EnrichedDay>(`/api/menu?date=${date}`)
      .then((data) => setMenus((m) => ({ ...m, [date]: { ok: true, data } })))
      .catch(() => setMenus((m) => ({ ...m, [date]: { ok: false } })))
      .finally(() => pending.delete(key));
  }, [date, menuEntry]);

  const meals = useMemo(() => (day ? [...new Set(day.halls.flatMap((h) => h.meals))] : []), [day]);
  const meal = chosenMeal && meals.includes(chosenMeal) ? chosenMeal : dayOffset === 0 ? currentMeal(meals) : (meals[0] ?? null);
  const scores = useMemo(() => (day && meal ? scoreHalls(day, meal, profile) : []), [day, meal, profile]);

  // Ratings re-rank the halls instantly in the browser; the AI is asked again only after the taps settle.
  const [settled, setSettled] = useState(profile);
  const recProfile = keyNoTaste(settled) === keyNoTaste(profile) ? settled : profile;
  useEffect(() => {
    if (profileKey(settled) === profileKey(profile)) return;
    const t = setTimeout(() => setSettled(profile), 1200);
    return () => clearTimeout(t);
  }, [profile, settled]);
  const [latest, setLatest] = useState<Record<string, { k: string; data: Recommendation }>>({});

  const recKey = `${date}|${meal}|${profileKey(recProfile)}`;
  const recEntry = recs[recKey];
  const fresh = recEntry?.ok ? recEntry.data : null;
  // While new picks load after a rating, keep showing the previous ones for this meal instead of a spinner.
  const stale = latest[`${date}|${meal}`];
  const rec = fresh ?? (!recEntry && stale?.k === keyNoTaste(recProfile) ? stale.data : null);
  const updating = !fresh && Boolean(rec);
  const recFailed = recEntry?.ok === false;
  const canRecommend = Boolean(day && meal);

  const recProfileKey = profileKey(recProfile);
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
        body: JSON.stringify({ profile: recProfile, date, meal: m }),
      })
        .then((data) => {
          setRecs((r) => ({ ...r, [key]: { ok: true, data } }));
          setLatest((r) => ({ ...r, [`${date}|${m}`]: { k: keyNoTaste(recProfile), data } }));
        })
        .catch(() => setRecs((r) => ({ ...r, [key]: { ok: false } })))
        .finally(() => pending.delete(key));
    };
    load(meal);
    // Once the meal on screen is answered, get the day's other meals ready so switching tabs is instant.
    if (recs[`${date}|${meal}|${recProfileKey}`]) meals.filter((m) => m !== meal).forEach(load);
  }, [canRecommend, recs, recProfileKey, recProfile, date, meal, meals]);

  const retry = () => {
    const drop = <T,>(m: Record<string, T>, key: string) => Object.fromEntries(Object.entries(m).filter(([k]) => k !== key));
    if (!day) setMenus((m) => drop(m, date));
    else setRecs((m) => drop(m, recKey));
  };

  const showWhy = whyOpenFor === recKey;
  const pickHall = rec?.hall ?? null;
  const pickScore = scores.find((s) => s.hall === pickHall);
  const maxCount = Math.max(1, ...scores.map((s) => s.mains.length + s.sides.length));
  const nothing = scores.length > 0 && scores.every((s) => s.mains.length + s.sides.length === 0);
  const totalDishes = day ? day.halls.reduce((n, h) => n + h.dishes.filter((d) => d.meal === meal && d.kind !== "notice").length, 0) : 0;
  const totalHidden = scores.reduce((n, s) => n + s.hidden.length, 0);
  const dorm = findDorm(profile.dorm);
  const goal = findGoal(profile.goal);
  const byId = new Map((day?.halls ?? []).flatMap((h) => h.dishes).map((d) => [d.id, d]));
  const onRate = (dish: Rated, value: 1 | 0 | -1) => onChange({ ...profile, taste: rate(profile.taste, dish, value) });
  const rateProps = { taste: profile.taste, onRate };
  const nowMin = (() => {
    const [h, m] = new Date().toLocaleTimeString("en-GB", { timeZone: "America/Los_Angeles", hour12: false }).split(":").map(Number);
    return h * 60 + m;
  })();
  const hoursFor = (hall: string) => {
    const h = hours?.halls.find((x) => x.hall === hall);
    if (!h) return null;
    const { hours: range, label } = hoursOn(h, date);
    const status = dayOffset === 0 ? openStatus(range, nowMin) : null;
    return { text: `${status ? status.text : range}${label ? ` · ${label}` : ""}`, open: status ? status.open : null };
  };
  const plateHall = scores.find((s) => s.hall === (pickHall ?? scores[0]?.hall));

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-cardinal">Where should I eat?</h1>
          <ProfileLine profile={profile} />
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-sm font-medium transition active:scale-95"
        >
          Edit
        </button>
      </header>

      <div className="flex gap-2">
        {["Today", "Tomorrow"].map((label, i) => (
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
              dayOffset === i ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${m === meal ? "bg-white text-cardinal shadow-sm" : "text-stone-600"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {menuEntry?.ok === false && (
        <div className="rise rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
          <p className="font-semibold">Couldn&apos;t load USC&apos;s menus</p>
          <p className="mt-1 text-sm text-stone-500">Check your connection and try again.</p>
          <button type="button" onClick={retry} className="mt-3 rounded-full bg-cardinal px-5 py-2 text-sm font-semibold text-white active:bg-cardinal-dark">
            Try again
          </button>
        </div>
      )}

      {!menuEntry && (
        <div className="rounded-3xl bg-cardinal p-5 text-white shadow-lg">
          <p className="text-sm font-medium uppercase tracking-wide text-gold">Just a moment</p>
          <p className="mt-1 animate-pulse text-3xl font-bold leading-tight text-white/70">Reading menus...</p>
          <p className="mt-2 min-h-[4.5rem] text-[15px] leading-snug text-white/90">Getting the dishes from all three dining halls.</p>
        </div>
      )}

      {day && !meal && (
        <div className="rise rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-stone-200">
          <p className="font-semibold">No menus posted yet</p>
          <p className="mt-1 text-sm text-stone-500">USC hasn&apos;t published menus for this day.</p>
        </div>
      )}

      {day && meal && (
        <>
          <section className="rounded-3xl bg-cardinal p-5 text-white shadow-lg" aria-live="polite">
            <p className="text-sm font-medium uppercase tracking-wide text-gold">
              {meal} · {nothing ? "heads up" : "go to"}
            </p>
            {nothing ? (
              <p className="mt-1 text-3xl font-bold leading-tight">No hall has a match</p>
            ) : pickHall ? (
              <p key={`${date}|${meal}|${pickHall}`} className="rise mt-1 text-3xl font-bold leading-tight">
                {hallName(pickHall)}
              </p>
            ) : recFailed ? (
              <p className="mt-1 text-3xl font-bold leading-tight">Hmm, that didn&apos;t work</p>
            ) : (
              <p className="mt-1 animate-pulse text-3xl font-bold leading-tight text-white/70">Comparing halls...</p>
            )}

            <div className="mt-2 min-h-[4.5rem] text-[15px] leading-snug text-white/90">
              {rec ? (
                <div key={rec.summary} className="rise">
                  {pickScore && pickScore.walk !== null && dorm && !nothing && (
                    <p className="mb-1 text-sm font-medium text-gold">
                      {pickScore.walk} min walk from {dorm.name}
                    </p>
                  )}
                  <p>{rec.summary}</p>
                </div>
              ) : recFailed ? (
                <div>
                  <p>We couldn&apos;t get your picks. The hall comparison below still works.</p>
                  <button type="button" onClick={retry} className="mt-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-cardinal active:scale-95">
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
                <span className="text-gold">✓</span> Checked against USC labels
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
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
                  hoursText={hoursFor(s.hall)}
                  open={openHall === s.hall}
                  onToggle={() => setOpenHall(openHall === s.hall ? null : s.hall)}
                />
              ))}
            </ul>
            <p className="mt-3 text-xs text-stone-400">Tap a hall to see everything you can eat there. 👍 or 👎 dishes to teach it your taste.</p>
          </section>

          {!nothing && !recFailed && (
            <section className="flex flex-col gap-2">
              <h2 className="flex justify-between px-1 text-sm font-semibold text-stone-500">
                <span>Your plate{pickHall ? ` at ${hallShort(pickHall)}` : ""}</span>
                {updating && <span className="animate-pulse font-normal text-stone-400">Updating with your ratings...</span>}
              </h2>
              {!rec && [0, 1, 2].map((i) => <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-white ring-1 ring-stone-200" />)}
              {rec?.picks.map((p, i) => {
                const others = p.allergens.filter((a) => a !== NOT_ANALYZED && !(profile.avoid as string[]).includes(a));
                return (
                  <article
                    key={`${recKey}|${p.id}`}
                    className="rise rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold leading-snug">{p.name}</h3>
                        <p className="truncate text-xs text-stone-400">{shortStation(p.station)}</p>
                      </div>
                      {byId.get(p.id) && <Thumbs dish={byId.get(p.id)!} {...rateProps} />}
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{p.why}</p>
                    <FoodTags dish={p} className="mt-1.5" />
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.claims.map((c) => (
                        <LabelTag key={c} tone="green" text={describeClaim(c)} />
                      ))}
                      {others.length > 0 && <LabelTag tone="stone" text={`Contains ${others.map((a) => LABEL_NAMES[a] ?? a).join(", ")}`} />}
                    </div>
                  </article>
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
            <section className="rise rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
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

      {hours && (
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
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

      <label className="flex items-center gap-2 px-1 text-xs text-stone-500">
        <span className="shrink-0">Try a sample student:</span>
        <select
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
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
