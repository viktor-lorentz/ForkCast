"use client";

import { useEffect, useRef, useState } from "react";
import type { EnrichedDish } from "@/lib/enrich";
import { hideReason } from "@/lib/filter";
import type { EnrichedDay } from "@/lib/menus";
import type { Profile } from "@/lib/profile";
import { ratingOf, type Rated } from "@/lib/taste";
import { dishEmoji } from "@/lib/emoji";
import { HALLS } from "@/lib/types";
import { FoodTags } from "./Taste";
import { ScoreBadge, useScores } from "./Ratings";

const COUNT = 10;
const NO_NAMES: string[] = [];
const todayLA = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;

/** Up to COUNT varied mains the student can eat, one per cuisine/protein combo first. */
function pickCards(day: EnrichedDay, profile: Profile): EnrichedDish[] {
  const seen = new Set<string>();
  const pool = day.halls
    .flatMap((h) => h.dishes)
    .filter((d) => d.kind === "main" && !hideReason(d, profile) && ratingOf(profile.taste, d.name) === 0)
    .filter((d) => !seen.has(d.name.toLowerCase()) && seen.add(d.name.toLowerCase()));
  const combos = new Set<string>();
  const varied = pool.filter((d) => {
    const k = `${d.cuisine}|${d.protein}`;
    return !combos.has(k) && combos.add(k);
  });
  return [...varied, ...pool.filter((d) => !varied.includes(d))].slice(0, COUNT);
}

/**
 * Optional setup step: swipe through real dishes from today's menus (right = yes, left = no)
 * so ForkCast knows your taste before your first pick. Only shows dishes you can eat.
 */
export function TasteQuiz({ profile, onRate }: { profile: Profile; onRate: (dish: Rated, value: 1 | -1) => void }) {
  const [open, setOpen] = useState(false);
  const [cards, setCards] = useState<EnrichedDish[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [exit, setExit] = useState<1 | -1 | 0>(0);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  });

  useEffect(() => {
    if (!open || cards) return;
    fetch(`/api/menu?date=${todayLA()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((day: EnrichedDay) => setCards(pickCards(day, profileRef.current)))
      .catch(() => setFailed(true));
  }, [open, cards]);

  const ratings = useScores(cards?.map((c) => c.name) ?? NO_NAMES);
  const card = cards?.[i];
  const next = cards?.[i + 1];

  function decide(value: 1 | -1) {
    if (!card || exit) return;
    setExit(value);
    setTimeout(() => {
      onRate(card, value);
      setI((n) => n + 1);
      setExit(0);
      setDx(0);
    }, 220);
  }
  function skip() {
    if (!card || exit) return;
    setI((n) => n + 1);
    setDx(0);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200 transition active:scale-[0.99]"
      >
        <span>
          <span className="block font-semibold">Quick taste check</span>
          <span className="block text-sm text-stone-500">Swipe through {COUNT} dishes from today&apos;s menus. Optional, about 30 seconds.</span>
        </span>
        <span className="text-2xl" aria-hidden>
          🍽️
        </span>
      </button>
    );
  }

  const done = cards && i >= cards.length;
  const offset = exit ? exit * 480 : dx;

  return (
    <section className="rise rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Quick taste check</h2>
        {cards && !done && (
          <span className="text-xs text-stone-400">
            {Math.min(i + 1, cards.length)} / {cards.length}
          </span>
        )}
      </div>

      {failed && <p className="mt-2 text-sm text-stone-500">Couldn&apos;t load today&apos;s dishes. You can skip this.</p>}
      {!cards && !failed && <div className="mt-3 h-52 animate-pulse rounded-2xl bg-stone-100" />}
      {cards && cards.length === 0 && <p className="mt-2 text-sm text-stone-500">No dishes to rate right now.</p>}

      {done && cards.length > 0 && (
        <div className="rise mt-3 rounded-2xl bg-emerald-50 p-4 text-center">
          <p className="text-2xl" aria-hidden>
            ✨
          </p>
          <p className="mt-1 font-semibold text-emerald-900">Got it. ForkCast knows your taste now.</p>
          <p className="text-sm text-emerald-800">Keep tapping the thumbs on any dish to fine-tune it.</p>
        </div>
      )}

      {card && (
        <>
          <div className="relative mt-3 h-52 select-none">
            {next && (
              <div className="absolute inset-0 scale-95 rounded-2xl bg-stone-50 ring-1 ring-stone-200" aria-hidden />
            )}
            <div
              key={card.id}
              className={`rise absolute inset-0 flex touch-pan-y flex-col justify-between rounded-2xl bg-white p-5 shadow-md ring-1 ring-stone-200 ${
                dragging ? "" : "transition-transform duration-200 ease-out"
              }`}
              style={{ transform: `translateX(${offset}px) rotate(${offset / 18}deg)` }}
              onPointerDown={(e) => {
                start.current = e.clientX;
                setDragging(true);
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
              onPointerUp={() => {
                start.current = null;
                setDragging(false);
                if (Math.abs(dx) > 90) decide(dx > 0 ? 1 : -1);
                else setDx(0);
              }}
              onPointerCancel={() => {
                start.current = null;
                setDragging(false);
                setDx(0);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-5xl" aria-hidden>
                  {dishEmoji(card.name)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold transition-opacity ${dx > 0 ? "bg-emerald-600 text-white" : "bg-stone-800 text-white"}`}
                  style={{ opacity: Math.min(1, Math.abs(offset) / 90) }}
                  aria-hidden
                >
                  {offset > 0 ? "Yum" : "Nah"}
                </span>
              </div>
              <div>
                <p className="text-xl font-bold leading-snug">{card.name}</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {hallShort(card.hall)} · {card.station.replace(/\s*\(.*\)\s*$/, "")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <ScoreBadge score={ratings.scoreOf(card.name)} long />
                  <FoodTags dish={card} />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => decide(-1)}
              aria-label={`No to ${card.name}`}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow ring-1 ring-stone-200 transition active:scale-90"
            >
              👎
            </button>
            <button type="button" onClick={skip} className="rounded-full px-4 py-2 text-sm font-medium text-stone-500 active:scale-95">
              Not sure
            </button>
            <button
              type="button"
              onClick={() => decide(1)}
              aria-label={`Yes to ${card.name}`}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow ring-1 ring-stone-200 transition active:scale-90"
            >
              👍
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-stone-400">Swipe right if you&apos;d eat it, left if not.</p>
        </>
      )}
    </section>
  );
}
