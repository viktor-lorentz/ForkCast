"use client";

import { useEffect, useMemo, useState } from "react";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import type { EnrichedDay } from "@/lib/menus";
import { profileKey, type Profile } from "@/lib/profile";
import type { Recommendation } from "@/lib/recommend";
import { currentMeal, scoreHalls } from "@/lib/score";
import { HALLS, LABEL_NAMES, NOT_ANALYZED } from "@/lib/types";
import { describeClaim } from "@/lib/verify";
import { LabelTag } from "./Chip";

const hallName = (id: string) => HALLS.find((h) => h.id === id)?.name ?? id;
const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;

function laDate(offset: number): string {
  const d = new Date(Date.now() + offset * 86_400_000);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

function ProfileLine({ profile }: { profile: Profile }) {
  const parts = [
    ...profile.avoid.map((a) => `No ${LABEL_NAMES[a]}`),
    ...profile.diet.map((d) => LABEL_NAMES[d]),
    ...profile.likes.slice(0, 3).map((l) => `Loves ${l}`),
  ];
  return <p className="truncate text-sm text-stone-500">{parts.length ? parts.join(" · ") : "No restrictions set"}</p>;
}

export function Today({
  profile,
  onEdit,
  onSwitch,
}: {
  profile: Profile;
  onEdit: () => void;
  onSwitch: (p: Profile) => void;
}) {
  const [dayOffset, setDayOffset] = useState(0);
  const date = laDate(dayOffset);
  const [chosenMeal, setChosenMeal] = useState<string | null>(null);
  // Results are stored by key, so switching date/meal/profile shows the right state without resetting anything.
  const [menus, setMenus] = useState<Record<string, EnrichedDay | "error">>({});
  const [recs, setRecs] = useState<Record<string, Recommendation | "error">>({});
  const [whyOpenFor, setWhyOpenFor] = useState<string | null>(null);

  const menuEntry = menus[date];
  const day = menuEntry && menuEntry !== "error" ? menuEntry : null;
  const menuError = menuEntry === "error" ? "Couldn't load USC's menus. Try again in a minute." : null;

  useEffect(() => {
    if (menus[date]) return;
    const ctrl = new AbortController();
    fetch(`/api/menu?date=${date}`, { signal: ctrl.signal })
      .then(async (r) => {
        const j = await r.json();
        setMenus((m) => ({ ...m, [date]: r.ok ? j : "error" }));
      })
      .catch((e) => e.name !== "AbortError" && setMenus((m) => ({ ...m, [date]: "error" })));
    return () => ctrl.abort();
  }, [date, menus]);

  const meals = useMemo(() => (day ? [...new Set(day.halls.flatMap((h) => h.meals))] : []), [day]);
  const meal = chosenMeal && meals.includes(chosenMeal) ? chosenMeal : dayOffset === 0 ? currentMeal(meals) : (meals[0] ?? null);
  const scores = useMemo(() => (day && meal ? scoreHalls(day, meal, profile) : []), [day, meal, profile]);

  const recKey = `${date}|${meal}|${profileKey(profile)}`;
  const recEntry = recs[recKey];
  const rec = recEntry && recEntry !== "error" ? recEntry : null;
  const recLoading = Boolean(day && meal) && !recEntry;
  const showWhy = whyOpenFor === recKey;
  const setShowWhy = (open: boolean) => setWhyOpenFor(open ? recKey : null);

  useEffect(() => {
    if (!day || !meal || recs[recKey]) return;
    const ctrl = new AbortController();
    fetch("/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profile, date, meal }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const j = await r.json();
        setRecs((m) => ({ ...m, [recKey]: r.ok ? j : "error" }));
      })
      .catch((e) => e.name !== "AbortError" && setRecs((m) => ({ ...m, [recKey]: "error" })));
    return () => ctrl.abort();
  }, [day, meal, profile, date, recKey, recs]);

  const pickHall = rec?.hall ?? null;
  const maxCount = Math.max(1, ...scores.map((s) => s.mains.length + s.sides.length));
  const nothing = scores.length > 0 && scores.every((s) => s.mains.length + s.sides.length === 0);

  return (
    <div className="flex flex-col gap-4 pb-10">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-cardinal">Where should I eat?</h1>
          <ProfileLine profile={profile} />
        </div>
        <button type="button" onClick={onEdit} className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium">
          Edit
        </button>
      </header>

      <div className="flex gap-2">
        {["Today", "Tomorrow"].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setDayOffset(i);
              setChosenMeal(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${dayOffset === i ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-300"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {meals.length > 0 && (
        <div className="flex gap-1 rounded-xl bg-stone-200/70 p-1">
          {meals.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setChosenMeal(m)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold ${m === meal ? "bg-white text-cardinal shadow-sm" : "text-stone-600"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {menuError && <p className="rounded-xl bg-red-50 p-4 text-red-800">{menuError}</p>}
      {!day && !menuError && (
        <div className="animate-pulse rounded-3xl bg-cardinal/80 p-6 text-white">
          <p className="text-sm opacity-80">Reading today&apos;s menus from all three halls...</p>
          <div className="mt-3 h-8 w-2/3 rounded bg-white/30" />
        </div>
      )}

      {day && meal && (
        <>
          <section className="rounded-3xl bg-cardinal p-5 text-white shadow-lg">
            <p className="text-sm font-medium uppercase tracking-wide text-gold">{meal} · go to</p>
            {nothing ? (
              <p className="mt-1 text-2xl font-bold">No hall has a match</p>
            ) : pickHall ? (
              <p className="mt-1 text-3xl font-bold leading-tight">{hallName(pickHall)}</p>
            ) : (
              <p className="mt-1 animate-pulse text-3xl font-bold leading-tight text-white/70">Comparing halls...</p>
            )}
            <p className="mt-2 min-h-[3rem] text-[15px] leading-snug text-white/90">
              {rec ? rec.summary : nothing ? `Nothing on USC's ${meal.toLowerCase()} menus matches your profile.` : "Checking every dish against your profile and USC's labels..."}
            </p>
            {rec?.source === "ai" && rec.verification.passed && (
              <button type="button" onClick={() => setShowWhy(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                <span className="text-gold">✓</span> Checked against USC labels
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
            <h2 className="mb-3 text-sm font-semibold text-stone-500">Dishes that fit you, by hall</h2>
            <ul className="flex flex-col gap-3">
              {scores.map((s) => {
                const n = s.mains.length + s.sides.length;
                const isPick = s.hall === pickHall && !nothing;
                return (
                  <li key={s.hall}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className={`font-semibold ${isPick ? "text-cardinal" : ""}`}>
                        {hallShort(s.hall)} {isPick && "★"}
                      </span>
                      <span className="text-stone-500">
                        {s.open ? `${s.mains.length} mains · ${s.sides.length} sides` : `Not serving ${meal.toLowerCase()}`}
                      </span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${isPick ? "bg-cardinal" : "bg-stone-400"}`} style={{ width: `${(n / maxCount) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold text-stone-500">Your picks</h2>
            {recLoading && !rec && [0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white ring-1 ring-stone-200" />)}
            {rec?.picks.map((p) => {
              const others = p.allergens.filter((a) => a !== NOT_ANALYZED && !profile.avoid.includes(a as never));
              return (
                <article key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{p.name}</h3>
                    <span className="max-w-[40%] shrink-0 truncate text-right text-xs text-stone-400">{p.station.replace(/\s*\(.*\)\s*$/, "")}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{p.why}</p>
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

          {rec && (
            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
              <button type="button" onClick={() => setShowWhy(!showWhy)} className="flex w-full items-center justify-between p-4 text-left font-semibold">
                Why {hallShort(rec.hall)}? How we checked
                <span className="text-stone-400">{showWhy ? "−" : "+"}</span>
              </button>
              {showWhy && (
                <div className="flex flex-col gap-4 border-t border-stone-100 p-4 text-sm">
                  <div>
                    <p className="mb-1 font-semibold">
                      {rec.source === "ai" ? "AI picks, verified by code against USC's labels" : "Picked by our rules (AI unavailable)"}
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
                  <p className="text-xs text-stone-500">
                    {rec.halls
                      .filter((h) => h.open)
                      .map((h) => `${hallShort(h.hall)}: ${h.hiddenForAllergens} hidden for allergies`)
                      .join(" · ")}
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}

      <p className="px-1 text-xs leading-relaxed text-stone-500">
        Based on USC Hospitality&apos;s allergen and diet labels{day?.source === "snapshot" ? " (saved copy)" : ""}. Labels can change and kitchens
        share equipment, so always confirm with dining staff if you have a serious allergy.
      </p>

      <label className="flex items-center gap-2 px-1 text-xs text-stone-500">
        Try as a sample student:
        <select
          className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-2 py-1 text-stone-700"
          value=""
          onChange={(e) => {
            const demo = DEMO_PROFILES.find((d) => d.id === e.target.value);
            if (demo) onSwitch(demo.profile);
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
