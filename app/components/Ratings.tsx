"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "./I18n";
import {
  applyScore,
  dishKey,
  formatAvg,
  MAX_SCORE,
  scoreWord,
  type Score,
} from "@/lib/ratings";
import { HALLS } from "@/lib/types";

const RATER_KEY = "forkcast-rater";
const MINE_KEY = "forkcast-scores-v1";
const VISITS_KEY = "forkcast-meals-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode: ratings still send, they just aren't remembered here.
  }
}

/** A random id for this browser, so rating a dish again replaces your old score. No account needed. */
function raterId(): string {
  let id = read<string | null>(RATER_KEY, null);
  if (!id) {
    id = crypto.randomUUID();
    write(RATER_KEY, id);
  }
  return id;
}

export interface Ratings {
  scoreOf: (name: string) => Score | null;
  mineOf: (name: string) => number | null;
  submit: (name: string, score: number) => void;
  ratedCount: number;
}

/** Students' average scores for these dishes, plus this browser's own scores. */
const todayLA = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

/** `date` is the menu day the scores belong to (defaults to today), so badges can show today's ratings. */
export function useScores(names: string[], date: string = todayLA()): Ratings {
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [mine, setMine] = useState<Record<string, number>>(() =>
    read(MINE_KEY, {}),
  );
  const scoresRef = useRef(scores);
  useEffect(() => {
    scoresRef.current = scores;
  });
  const keyList = useMemo(() => [...new Set(names)].sort().join("\n"), [names]);

  useEffect(() => {
    if (!keyList) return;
    let live = true;
    fetch("/api/ratings/lookup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ names: keyList.split("\n"), rater: raterId(), date }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (d: { scores: Record<string, Score> }) =>
          live && setScores((s) => ({ ...s, ...d.scores })),
      )
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [keyList, date]);

  const submit = (name: string, score: number) => {
    const k = dishKey(name);
    const prev = mine[k] ?? null;
    if (prev === score) return;
    const before = scoresRef.current[k] ?? null;
    const nextMine = { ...mine, [k]: score };
    setMine(nextMine);
    write(MINE_KEY, nextMine);
    const guess = applyScore(before, prev, score);
    // Today's average moves too (a first score today, or a changed one).
    const todayGuess = applyScore(before?.today ?? null, before?.today ? prev : null, score);
    setScores((s) => (guess ? { ...s, [k]: { ...guess, ...(todayGuess ? { today: todayGuess } : {}) } } : s));
    fetch("/api/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dish: name, score, rater: raterId(), date }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (d: { score: Score | null }) =>
          d.score && setScores((s) => ({ ...s, [k]: d.score! })),
      )
      .catch(() => {});
  };

  return {
    scoreOf: (name) => scores[dishKey(name)] ?? null,
    mineOf: (name) => mine[dishKey(name)] ?? null,
    submit,
    ratedCount: Object.keys(mine).length,
  };
}

const Star = () => (
  <svg viewBox="0 0 20 20" className="h-3 w-3 fill-current" aria-hidden>
    <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
  </svg>
);

/** "★ 8.2 · 3": what students think, out of 10. Nothing shows until someone rates it. */
export function ScoreBadge({
  score: all,
  long,
  className = "",
}: {
  score: Score | null;
  long?: boolean;
  className?: string;
}) {
  const t = useT();
  if (!all) return null;
  // Prefer what students said about today's menu.
  const score = all.today ?? all;
  const n = all.today
    ? score.n === 1 ? t("1 student today") : t("{n} students today", { n: score.n })
    : score.n === 1 ? t("1 student") : t("{n} students", { n: score.n });
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1c1917] px-2 py-0.5 text-xs font-semibold text-white ring-1 ring-white/10 ${className}`}
      title={t("Students rate it {score} out of 10 ({who})", { score: formatAvg(score.avg), who: n })}
      aria-label={t("Students rate it {score} out of 10 ({who})", { score: formatAvg(score.avg), who: n })}
    >
      <span className="text-gold">
        <Star />
      </span>
      <span className="tabular-nums">{formatAvg(score.avg)}</span>
      <span className="font-normal text-white/60">
        {long ? `/10 · ${n}` : all.today ? `· ${t("{n} today", { n: score.n })}` : `· ${score.n}`}
      </span>
    </span>
  );
}

/** A 1–10 row that fills up to your score like a meter. */
export function ScorePicker({
  value,
  onPick,
  label,
  hint = true,
}: {
  value: number | null;
  onPick: (v: number) => void;
  label: string;
  hint?: boolean;
}) {
  const t = useT();
  return (
    <div>
      <div
        role="radiogroup"
        aria-label={t("Rate {dish} from 1 to 10", { dish: label })}
        className="flex gap-1"
      >
        {Array.from({ length: MAX_SCORE }, (_, i) => i + 1).map((v) => {
          const on = value === v;
          return (
            <button
              key={on ? `${v}-on` : v}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={t("{n} out of 10", { n: v })}
              onClick={() => onPick(v)}
              className={`h-8 min-w-0 flex-1 rounded-lg text-sm font-semibold tabular-nums transition-colors active:scale-90 ${
                on
                  ? "pop bg-brand text-white"
                  : value !== null && v < value
                    ? "bg-cardinal/10 text-cardinal"
                    : "bg-stone-100 text-stone-500"
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
      {(hint || value !== null) && (
        <p className="mt-1 flex justify-between text-[0.6875rem] text-stone-400">
          {value !== null ? (
            <span className="font-medium text-cardinal">
              {t("You gave it {n}: {word}", { n: value, word: t(scoreWord(value)) })}
            </span>
          ) : (
            <>
              <span>{t("1 skip it")}</span>
              <span>{t("10 get it again")}</span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ---- "How was lunch?": remember which picks you looked at, then ask about them after the meal.

export interface MealVisit {
  date: string;
  meal: string;
  hall: string;
  dishes: string[];
  at: number;
  done?: boolean;
}

/** Rough start times (LA hours), so looking at dinner picks at 3 PM doesn't ask how dinner was at 3:45. */
const MEAL_START: Record<string, number> = {
  Breakfast: 7,
  Brunch: 9,
  Lunch: 11,
  Dinner: 16.5,
};
const WAIT_MS = 20 * 60 * 1000;

export function logMealVisit(v: Omit<MealVisit, "at" | "done">) {
  const visits = read<MealVisit[]>(VISITS_KEY, []);
  const old = visits.find((x) => x.date === v.date && x.meal === v.meal);
  if (old && old.hall === v.hall && !old.done) return;
  const rest = visits.filter((x) => x !== old);
  write(
    VISITS_KEY,
    [
      ...rest,
      { ...v, at: old?.hall === v.hall ? old.at : Date.now(), done: old?.done },
    ].slice(-4),
  );
}

/** The most recent meal you looked at that should be over by now and you haven't rated or dismissed. */
export function pendingVisit(
  today: string,
  nowMs: number,
  nowHour: number,
): MealVisit | null {
  const visits = read<MealVisit[]>(VISITS_KEY, []);
  const over = (v: MealVisit) =>
    !v.done &&
    v.dishes.length > 0 &&
    nowMs - v.at > WAIT_MS &&
    nowMs - v.at < 36 * 3600 * 1000 &&
    (v.date < today ||
      (v.date === today && nowHour >= (MEAL_START[v.meal] ?? 0) + 0.5));
  return [...visits].reverse().find(over) ?? null;
}

/** Done with this one (and anything older), so we never ask twice. */
export function closeVisit(v: MealVisit) {
  const visits = read<MealVisit[]>(VISITS_KEY, []);
  write(
    VISITS_KEY,
    visits.map((x) => (x.at <= v.at ? { ...x, done: true } : x)),
  );
}

export function RateMealPrompt({
  visit,
  ratings,
  onClose,
}: {
  visit: MealVisit;
  ratings: Ratings;
  onClose: () => void;
}) {
  const t = useT();
  const [thanks, setThanks] = useState(false);
  const hall = HALLS.find((h) => h.id === visit.hall)?.short ?? visit.hall;
  const rated = visit.dishes.filter((d) => ratings.mineOf(d) !== null).length;
  const finish = () => {
    closeVisit(visit);
    setThanks(true);
    setTimeout(onClose, 1800);
  };
  const dismiss = () => {
    closeVisit(visit);
    onClose();
  };

  if (thanks) {
    return (
      <section className="rise rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-200">
        <p className="font-semibold text-emerald-900">
          {t("Thanks! Your scores help other students pick.")}
        </p>
      </section>
    );
  }

  return (
    <section className="rise rounded-2xl bg-card p-4 shadow-sm ring-1 ring-amber-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {t("How was {meal} at {hall}?", { meal: t(visit.meal), hall })}
          </h2>
          <p className="text-sm text-stone-500">
            {t("Rate what you ate. Everyone sees the average.")}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("Not now")}
          className="-mr-1 -mt-1 rounded-full p-1.5 text-stone-400 transition active:scale-90"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {visit.dishes.slice(0, 5).map((d, i) => (
          <li key={d}>
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium">{d}</span>
              <ScoreBadge score={ratings.scoreOf(d)} />
            </div>
            <ScorePicker
              value={ratings.mineOf(d)}
              label={d}
              hint={i === 0}
              onPick={(v) => ratings.submit(d, v)}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2">
        <a
          href={`/rate?date=${visit.date}&meal=${encodeURIComponent(visit.meal)}&hall=${visit.hall}`}
          className="text-sm font-medium text-cardinal"
        >
          {t("Ate something else?")}
        </a>
        <div className="flex gap-2">
          {rated === 0 && (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-stone-500 active:scale-95"
            >
              {t("Didn't go")}
            </button>
          )}
          <button
            type="button"
            onClick={finish}
            disabled={rated === 0}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-semibold text-ink-fg transition active:scale-95 disabled:opacity-30"
          >
            {t("Done")}
          </button>
        </div>
      </div>
    </section>
  );
}

/** A quiet row under a dish: today's score, and one tap to give yours. */
/** "I ate this" state for one dish today: shown next to the rating button. */
export interface AteToggle {
  eaten: boolean;
  /** "You had this yesterday" when it was eaten in the last week (not today). */
  note: string | null;
  onToggle: () => void;
}

export function RateInline({ name, ratings, ate }: { name: string; ratings: Ratings; ate?: AteToggle }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const mine = ratings.mineOf(name);
  const score = ratings.scoreOf(name);
  return (
    <div className="mt-3 border-t border-stone-100 pt-2.5">
      {ate?.note && !ate.eaten && <p className="mb-2 text-xs font-medium text-amber-900">↺ {ate.note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {score ? <ScoreBadge score={score} long /> : <span className="text-xs text-stone-500">{t("No ratings yet today")}</span>}
        <span className="flex shrink-0 gap-1.5">
        {ate && (
          <button
            type="button"
            aria-pressed={ate.eaten}
            aria-label={ate.eaten ? t("You ate {dish} today. Tap to undo", { dish: name }) : t("I ate {dish}", { dish: name })}
            onClick={() => {
              if (!ate.eaten && mine === null) setOpen(true);
              ate.onToggle();
            }}
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
              ate.eaten ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-stone-100 text-stone-700"
            }`}
          >
            {ate.eaten ? `✓ ${t("Ate it")}` : t("I ate this")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition active:scale-95 ${
            mine !== null ? "bg-cardinal/10 text-cardinal" : "bg-stone-100 text-stone-700"
          }`}
        >
          <Star />
          {mine !== null ? t("You: {n}", { n: mine }) : ate ? t("Rate it") : t("Ate it? Rate it")}
        </button>
        </span>
      </div>
      {open && (
        <div className="rise mt-2.5">
          <ScorePicker
            value={mine}
            label={name}
            onPick={(v) => {
              ratings.submit(name, v);
              // Rating a dish today means you ate it.
              if (ate && !ate.eaten && v !== null) ate.onToggle();
              setTimeout(() => setOpen(false), 600);
            }}
          />
        </div>
      )}
    </div>
  );
}
