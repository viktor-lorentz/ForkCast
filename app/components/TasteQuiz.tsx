"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./I18n";
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
const STEP_COUNT = 5;
const NO_NAMES: string[] = [];
const todayLA = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;

/** Up to COUNT varied mains the student can eat, one per cuisine/protein combo first. */
function pickCards(day: EnrichedDay, profile: Profile, count: number): EnrichedDish[] {
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
  return [...varied, ...pool.filter((d) => !varied.includes(d))].slice(0, count);
}

/**
 * Optional setup step: swipe through real dishes from today's menus (right = yes, left = no)
 * so ForkCast knows your taste before your first pick. Only shows dishes you can eat.
 */
export function TasteQuiz({
  profile,
  onRate,
  onFinish,
}: {
  profile: Profile;
  onRate: (dish: Rated, value: 1 | -1) => void;
  /** Set when this is a setup step (not the optional card): starts open, 5 cards, and calls this when done. */
  onFinish?: () => void;
}) {
  const step = Boolean(onFinish);
  const total = step ? STEP_COUNT : COUNT;
  const t = useT();
  const [open, setOpen] = useState(step);
  const finishRef = useRef(onFinish);
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
    finishRef.current = onFinish;
  });

  useEffect(() => {
    if (!open || cards) return;
    fetch(`/api/menu?date=${todayLA()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((day: EnrichedDay) => {
        const picked = pickCards(day, profileRef.current, total);
        setCards(picked);
        // Nothing to swipe? Don't hold anyone up.
        if (picked.length === 0) finishRef.current?.();
      })
      .catch(() => {
        setFailed(true);
        finishRef.current?.();
      });
  }, [open, cards, total]);

  const ratings = useScores(cards?.map((c) => c.name) ?? NO_NAMES);
  const card = cards?.[i];

  function decide(value: 1 | -1) {
    if (!card || exit) return;
    setExit(value);
    setTimeout(() => {
      onRate(card, value);
      if (cards && i + 1 >= cards.length) setTimeout(() => finishRef.current?.(), 900);
      setI((n) => n + 1);
      setExit(0);
      setDx(0);
    }, 220);
  }
  function skip() {
    if (!card || exit) return;
    if (cards && i + 1 >= cards.length) setTimeout(() => finishRef.current?.(), 900);
    setI((n) => n + 1);
    setDx(0);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-stone-200 transition active:scale-[0.99]"
      >
        <span>
          <span className="block font-semibold">{t("Quick taste check")}</span>
          <span className="block text-sm text-stone-500">{t("Swipe through {n} dishes from today's menus. Optional, about 30 seconds.", { n: total })}</span>
        </span>
        <span className="text-2xl" aria-hidden>
          🍽️
        </span>
      </button>
    );
  }

  const done = cards && i >= cards.length;
  const offset = exit ? exit * 480 : dx;
  const lean = Math.max(-1, Math.min(1, offset / 110));
  const cardH = step ? "h-[21rem]" : "h-72";

  return (
    <section className={step ? "" : "rise rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200"}>
      {step ? (
        <div className="flex gap-1.5" aria-label={cards ? t("{i} of {n}", { i: Math.min(i + 1, cards.length), n: cards.length }) : undefined}>
          {Array.from({ length: cards?.length || total }, (_, n) => (
            <span key={n} className="h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
              <span className={`block h-full rounded-full bg-cardinal transition-all duration-300 ease-out ${n < i ? "w-full" : "w-0"}`} />
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">{t("Quick taste check")}</h2>
          {cards && !done && (
            <span className="text-xs text-stone-400">
              {Math.min(i + 1, cards.length)} / {cards.length}
            </span>
          )}
        </div>
      )}

      {failed && <p className="mt-4 text-sm text-stone-500">{t("Couldn't load today's dishes. You can skip this.")}</p>}
      {!cards && !failed && <div className={`mt-4 ${cardH} animate-pulse rounded-3xl bg-stone-200/60`} />}
      {cards && cards.length === 0 && <p className="mt-4 text-sm text-stone-500">{t("No dishes to rate right now.")}</p>}

      {done && cards.length > 0 && (
        <div className={`rise mt-4 flex ${cardH} flex-col items-center justify-center rounded-3xl bg-card p-6 text-center shadow-sm ring-1 ring-stone-200`}>
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <p className="mt-4 text-lg font-bold">{t("Got it, ForkCast knows your taste")}</p>
          <p className="mt-1 text-sm text-stone-500">{step ? t("Finding your dining hall...") : t("Keep using the thumbs on any dish to fine-tune it.")}</p>
        </div>
      )}

      {card && (
        <>
          <div className={`relative mt-4 mb-8 ${cardH} select-none`}>
            {cards!.slice(i + 1, i + 3).map((c, n) => (
              <div
                key={c.id}
                className="absolute inset-0 rounded-3xl bg-card shadow-sm ring-1 ring-stone-200 transition-transform duration-300"
                style={{ transform: `translateY(${(n + 1) * 16}px) scale(${1 - (n + 1) * 0.04})`, zIndex: 1 - n }}
                aria-hidden
              />
            ))}
            <div
              key={card.id}
              className={`rise absolute inset-0 z-10 flex touch-pan-y cursor-grab flex-col overflow-hidden rounded-3xl bg-card shadow-lg ring-1 ring-stone-200 active:cursor-grabbing ${
                dragging ? "" : "transition-transform duration-200 ease-out"
              }`}
              style={{ transform: `translateX(${offset}px) rotate(${offset / 20}deg)` }}
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
              <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-amber-50 to-white">
                <span className="text-[5.5rem] leading-none drop-shadow-sm" aria-hidden>
                  {dishEmoji(card.name)}
                </span>
                <span
                  className="absolute left-4 top-4 -rotate-12 rounded-lg border-[3px] border-emerald-500 px-2 py-0.5 text-lg font-black tracking-wider text-emerald-600"
                  style={{ opacity: Math.max(0, lean) }}
                  aria-hidden
                >
                  {t("YUM")}
                </span>
                <span
                  className="absolute right-4 top-4 rotate-12 rounded-lg border-[3px] border-stone-500 px-2 py-0.5 text-lg font-black tracking-wider text-stone-600"
                  style={{ opacity: Math.max(0, -lean) }}
                  aria-hidden
                >
                  {t("NAH")}
                </span>
              </div>
              <div className="px-5 pb-5 pt-3">
                <p className="text-xl font-bold leading-snug">{card.name}</p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {hallShort(card.hall)} · {card.station.replace(/\s*\(.*\)\s*$/, "")}
                </p>
                <div className="mt-2.5 flex min-h-6 flex-wrap items-center gap-1.5">
                  <ScoreBadge score={ratings.scoreOf(card.name)} long />
                  <FoodTags dish={card} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => decide(-1)}
              aria-label={t("No to {dish}", { dish: card.name })}
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-card text-stone-500 shadow-md ring-1 ring-stone-200 transition active:scale-90 ${lean < -0.3 ? "scale-110 text-stone-800" : ""}`}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <button type="button" onClick={skip} className="rounded-full px-3 py-2 text-sm font-medium text-stone-400 active:scale-95">
              {t("Not sure")}
            </button>
            <button
              type="button"
              onClick={() => decide(1)}
              aria-label={t("Yes to {dish}", { dish: card.name })}
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-md shadow-cardinal/30 transition active:scale-90 ${lean > 0.3 ? "scale-110" : ""}`}
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
                <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
              </svg>
            </button>
          </div>
        </>
      )}
    </section>
  );
}
