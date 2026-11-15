"use client";

import { useEffect, useState } from "react";
import type { T } from "@/lib/i18n";
import { profileKey, type Profile } from "@/lib/profile";
import { HALLS } from "@/lib/types";
import type { WeekDay } from "@/lib/week";
import { useLang, useT } from "./I18n";

const hallShort = (id: string) => HALLS.find((h) => h.id === id)?.short ?? id;

function dayLabel(date: string, i: number, t: T, lang: string): string {
  if (i === 0) return t("Today");
  if (i === 1) return t("Tomorrow");
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-US" : lang, { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
}

/** Collapsed by default: the next 7 days at a glance, from code scoring only. Tap a day to open it above. */
export function ThisWeek({
  profile,
  onOpenDay,
  embedded,
}: {
  profile: Profile;
  onOpenDay: (offset: number, meal: string | null) => void;
  /** Shown in place of the day view (from the "This week" chip): always open, no header button. */
  embedded?: boolean;
}) {
  const t = useT();
  const { lang } = useLang();
  const [open, setOpen] = useState(Boolean(embedded));
  const [data, setData] = useState<{ key: string; days: WeekDay[] | null; error: boolean } | null>(null);
  // Language and "I ate this" don't change the week's picks.
  const key = profileKey({ ...profile, ate: undefined, lang: undefined });

  useEffect(() => {
    if (!open || data?.key === key) return;
    let live = true;
    fetch("/api/week", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: { ...profile, ate: undefined } }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { days: WeekDay[] }) => live && setData({ key, days: j.days, error: false }))
      .catch(() => live && setData({ key, days: null, error: true }));
    return () => {
      live = false;
    };
  }, [open, key, data?.key, profile]);

  const days = data?.key === key ? data.days : null;
  const failed = data?.key === key && data.error;

  return (
    <section className={embedded ? "rise rounded-2xl bg-card shadow-sm ring-1 ring-stone-200" : "rounded-2xl bg-card shadow-sm ring-1 ring-stone-200"}>
      {embedded ? (
        <div className="p-4 pb-0">
          <h2 className="font-semibold">{t("Best hall for each meal, the next 7 days")}</h2>
        </div>
      ) : (
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between p-4 text-left">
        <span>
          <span className="block font-semibold">{t("This week")}</span>
          <span className="block text-sm text-stone-500">{t("Best hall for each meal, the next 7 days")}</span>
        </span>
        <span className="text-stone-400">{open ? "−" : "+"}</span>
      </button>
      )}
      {open && (
        <div className={embedded ? "p-4 pt-3" : "rise border-t border-stone-100 p-4 pt-3"}>
          {failed && <p className="text-sm text-stone-500">{t("Couldn't load the week right now. Try again in a minute.")}</p>}
          {!days && !failed && (
            <div className="flex flex-col gap-2" aria-label={t("Loading the week")}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-stone-100" />
              ))}
            </div>
          )}
          {days && (
            <ol className="flex flex-col gap-2">
              {days.map((d, i) => (
                <li key={d.date}>
                  <button
                    type="button"
                    disabled={!d.posted}
                    onClick={() => onOpenDay(i, null)}
                    className="w-full rounded-xl bg-stone-50 p-3 text-left transition active:scale-[0.99] disabled:active:scale-100"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">{dayLabel(d.date, i, t, lang)}</span>
                      {d.posted && <span className="text-xs font-medium text-cardinal">{t("Open")} →</span>}
                    </span>
                    {!d.posted ? (
                      <span className="mt-0.5 block text-sm text-stone-500">{t("USC hasn't posted menus for this day yet.")}</span>
                    ) : (
                      <span className="mt-1 flex flex-col gap-1">
                        {d.meals.map((m) => (
                          <span key={m.meal} className="grid grid-cols-[4.5rem_1fr] gap-x-2 text-sm">
                            <span className="text-stone-500">{t(m.meal)}</span>
                            {m.hall ? (
                              <span className="min-w-0">
                                <span className="font-semibold">{hallShort(m.hall)}</span>
                                <span className="text-stone-600"> · {m.dishes.join(", ")}</span>
                              </span>
                            ) : (
                              <span className="text-stone-500">{t("Nothing fits your profile")}</span>
                            )}
                          </span>
                        ))}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-3 text-xs text-stone-500">{t("Quick look from USC's labels and your profile. Open a day for the full pick and reasons.")}</p>
        </div>
      )}
    </section>
  );
}
