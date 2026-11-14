"use client";

import type { EnrichedDish } from "@/lib/enrich";
import { foodTags, type Goal, type Macros } from "@/lib/plate";
import { ratingOf, type Rated, type Taste } from "@/lib/taste";

const THUMB = (
  <>
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
  </>
);

/** Thumbs up / down for one dish: quiet outline icons that fill and pop when chosen. Tapping the active one clears it. */
export function Thumbs({
  dish,
  taste,
  onRate,
  small,
}: {
  dish: Rated;
  taste: Taste | undefined;
  onRate: (dish: Rated, value: 1 | 0 | -1) => void;
  small?: boolean;
}) {
  const r = ratingOf(taste, dish.name);
  const size = small ? "h-8 w-8" : "h-9 w-9";
  const icon = small ? 15 : 17;
  const btn = (value: 1 | -1, label: string, on: string) => {
    const active = r === value;
    return (
      <button
        type="button"
        aria-label={`${label} ${dish.name}`}
        aria-pressed={active}
        onClick={() => onRate(dish, active ? 0 : value)}
        className={`inline-flex ${size} items-center justify-center rounded-full transition-colors duration-150 active:scale-90 ${
          active ? on : "text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        }`}
      >
        <svg
          key={String(active)}
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill={active ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${value === -1 ? "rotate-180" : ""} ${active ? "pop" : ""}`}
          aria-hidden
        >
          {THUMB}
        </svg>
      </button>
    );
  };
  return (
    <span className="inline-flex shrink-0 items-center">
      {btn(1, "More like", "bg-emerald-50 text-emerald-600")}
      {btn(-1, "Less like", "bg-stone-100 text-stone-700")}
    </span>
  );
}

/** "High protein", "Lighter"... from the AI estimate. No numbers: they're too rough to show. */
export function FoodTags({ dish, className = "" }: { dish: { kind: string; macros?: Macros | null }; className?: string }) {
  const tags = foodTags(dish);
  if (tags.length === 0) return null;
  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {tags.map((t) => (
        <span key={t} className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
          {t}
        </span>
      ))}
    </span>
  );
}

/** The plate that best fits the student's fitness goal at one hall. Ranked from estimates; shown as labels only. */
export function PlateCard({
  goal,
  hallLabel,
  plate,
  taste,
  onRate,
  onChangeGoal,
}: {
  goal: Goal;
  hallLabel: string;
  plate: EnrichedDish[];
  taste: Taste | undefined;
  onRate: (dish: Rated, value: 1 | 0 | -1) => void;
  onChangeGoal: () => void;
}) {
  return (
    <section className="rise rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold">
          {goal.plateName} at {hallLabel}
        </h2>
        <button type="button" onClick={onChangeGoal} className="shrink-0 text-xs font-medium text-stone-500 underline">
          Change goal
        </button>
      </div>
      <p className="text-xs text-stone-500">For your goal: {goal.name.toLowerCase()}</p>
      {plate.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">We can&apos;t build a goal plate for this meal right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2.5">
          {plate.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium leading-snug text-stone-800">{d.name}</p>
                <FoodTags dish={d} className="mt-0.5" />
              </div>
              <Thumbs small dish={d} taste={taste} onRate={onRate} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-stone-400">Based on AI estimates from dish names. USC doesn&apos;t publish nutrition for these menus.</p>
    </section>
  );
}
