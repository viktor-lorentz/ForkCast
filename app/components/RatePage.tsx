"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EnrichedDish } from "@/lib/enrich";
import { dishEmoji } from "@/lib/emoji";
import type { EnrichedDay } from "@/lib/menus";
import { currentMeal } from "@/lib/score";
import { HALLS } from "@/lib/types";
import { ScoreBadge, ScorePicker, useScores } from "./Ratings";

const todayLA = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const shortStation = (s: string) => s.replace(/\s*\(.*\)\s*$/, "");
const GROUPS = [
  { kind: "main", label: "Mains" },
  { kind: "side", label: "Sides" },
  { kind: "dessert", label: "Desserts" },
] as const;

function initial() {
  const q = new URLSearchParams(window.location.search);
  const date = q.get("date");
  return {
    date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayLA(),
    meal: q.get("meal"),
    hall: HALLS.some((h) => h.id === q.get("hall")) ? q.get("hall")! : null,
  };
}

/** Rate anything on today's menus, 1 to 10. Every browser counts once per dish; everyone sees the average. */
export default function RatePage() {
  const [start] = useState(initial);
  const [day, setDay] = useState<EnrichedDay | null>(null);
  const [failed, setFailed] = useState(false);
  const [meal, setMeal] = useState<string | null>(start.meal);
  const [hall, setHall] = useState<string>(start.hall ?? HALLS[0].id);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/menu?date=${start.date}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDay)
      .catch(() => setFailed(true));
  }, [start.date]);

  const meals = useMemo(() => (day ? [...new Set(day.halls.flatMap((h) => h.meals))] : []), [day]);
  const shownMeal = meal && meals.includes(meal) ? meal : start.date === todayLA() ? currentMeal(meals) : (meals[0] ?? null);
  const dishes = useMemo(() => {
    const seen = new Set<string>();
    return (day?.halls.find((h) => h.hall === hall)?.dishes ?? [])
      .filter((d) => d.meal === shownMeal && GROUPS.some((g) => g.kind === d.kind))
      .filter((d) => !seen.has(d.name.toLowerCase()) && seen.add(d.name.toLowerCase()));
  }, [day, hall, shownMeal]);
  const names = useMemo(() => dishes.map((d) => d.name), [dishes]);
  const ratings = useScores(names, start.date);

  const row = (d: EnrichedDish) => {
    const mine = ratings.mineOf(d.name);
    const isOpen = open === d.id;
    return (
      <li key={d.id} className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
        <button type="button" onClick={() => setOpen(isOpen ? null : d.id)} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3 text-left">
          <span className="text-2xl" aria-hidden>
            {dishEmoji(d.name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium leading-snug">{d.name}</span>
            <span className="block truncate text-xs text-stone-400">{shortStation(d.station)}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end gap-1">
            <ScoreBadge score={ratings.scoreOf(d.name)} />
            {mine !== null ? (
              <span className="text-xs font-semibold text-cardinal">You: {mine}</span>
            ) : (
              <span className="text-xs font-medium text-stone-400">{isOpen ? "" : "Rate"}</span>
            )}
          </span>
        </button>
        {isOpen && (
          <div className="rise px-3 pb-3">
            <ScorePicker
              value={mine}
              label={d.name}
              onPick={(v) => {
                ratings.submit(d.name, v);
                setTimeout(() => setOpen((o) => (o === d.id ? null : o)), 450);
              }}
            />
          </div>
        )}
      </li>
    );
  };

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-12 pt-5">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
        <span className="text-stone-900">Fork</span>
        <span className="-ml-1.5 text-cardinal">Cast</span>
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Rate the food</h1>
      <p className="mt-1 text-sm text-stone-500">
        Tap anything you&apos;ve tried and give it 1 to 10. Everyone sees the average, so the next student knows what&apos;s good.
      </p>
      {ratings.ratedCount > 0 && <p className="mt-1 text-sm font-medium text-cardinal">You&apos;ve rated {ratings.ratedCount} {ratings.ratedCount === 1 ? "dish" : "dishes"}. Thank you!</p>}

      {meals.length > 1 && (
        <div className="mt-4 flex rounded-xl bg-stone-200/60 p-1" role="tablist">
          {meals.map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={m === shownMeal}
              onClick={() => setMeal(m)}
              className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition ${m === shownMeal ? "bg-white text-cardinal shadow-sm" : "text-stone-500"}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {HALLS.map((h) => (
          <button
            key={h.id}
            type="button"
            aria-pressed={hall === h.id}
            onClick={() => setHall(h.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
              hall === h.id ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-300"
            }`}
          >
            {h.short}
          </button>
        ))}
      </div>

      {failed && <p className="mt-6 text-sm text-stone-500">Couldn&apos;t load the menu. Try again in a minute.</p>}
      {!day && !failed && (
        <div className="mt-4 flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-stone-200" />
          ))}
        </div>
      )}
      {day && dishes.length === 0 && <p className="mt-6 text-sm text-stone-500">Nothing listed here for {shownMeal?.toLowerCase() ?? "this meal"}.</p>}
      {GROUPS.map((g) => {
        const list = dishes.filter((d) => d.kind === g.kind);
        return (
          list.length > 0 && (
            <section key={g.kind} className="mt-5">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-stone-400">{g.label}</h2>
              <ul className="flex flex-col gap-2">{list.map(row)}</ul>
            </section>
          )
        );
      })}
    </main>
  );
}
