"use client";

import { useEffect, useRef, useState } from "react";
import { GOALS } from "@/lib/plate";
import type { Profile } from "@/lib/profile";
import { STARTERS, type Starter } from "@/lib/starters";
import { STYLES } from "@/lib/styles";
import { rate, tasteSummary } from "@/lib/taste";
import { ALLERGENS, LABEL_NAMES, PREFERENCES, type Allergen, type Preference } from "@/lib/types";
import { DORMS } from "@/lib/walking";
import { allergenFor, cleanExclude } from "@/lib/exclude";
import { dishEmoji } from "@/lib/emoji";
import { Chip, Tile } from "./Chip";
import { Logo } from "./Logo";
import { TasteQuiz } from "./TasteQuiz";
import { LangButton, useT } from "./I18n";
import { LIKE_IDEAS, NEVER_IDEAS } from "@/lib/i18n-dynamic";

const ALLERGEN_ICON: Record<Allergen, string> = {
  dairy: "🥛", eggs: "🥚", fish: "🐟", gluten: "🌾", peanuts: "🥜", pork: "🥓", sesame: "🥯", shellfish: "🦐", soy: "🫘", "tree-nuts": "🌰",
};
const NEVER_ICON: Record<string, string> = { beef: "🥩", chicken: "🍗", lamb: "🐑", mushroom: "🍄", turkey: "🦃", duck: "🦆", onion: "🧅", garlic: "🧄", tomato: "🍅", avocado: "🥑", corn: "🌽", coconut: "🥥", pepper: "🫑", meat: "🍖", "red meat": "🥩" };
const DIET_NAMES: Record<Preference, string> = { "halal-ingredients": "Halal", vegan: "Vegan", vegetarian: "Vegetarian" };

function toggle<T>(xs: T[], x: T): T[] {
  return xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x];
}

export function Onboarding({
  initial,
  onDone,
  onCancel,
  onStarter,
}: {
  initial: Profile;
  onDone: (p: Profile) => void;
  /** First run only: a one-tap starting profile that goes straight to recommendations. */
  onStarter?: (s: Starter) => void;
  /** Set when editing an existing profile, so there is something to go back to. */
  onCancel?: () => void;
}) {
  const t = useT();
  const [p, setP] = useState<Profile>(initial);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [dislike, setDislike] = useState("");
  const [like, setLike] = useState("");
  const [never, setNever] = useState("");
  const [neverNote, setNeverNote] = useState<string | null>(null);
  const taste = tasteSummary(p.taste);
  // First-time setup gets a short swipe step after the profile; editing keeps it as an optional card.
  const [step, setStep] = useState<"profile" | "taste">("profile");
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
  });
  const finish = () => onDone(latest.current);

  async function readText() {
    if (!text.trim()) return;
    setParsing(true);
    setParseNote(null);
    try {
      const res = await fetch("/api/parse-profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const parsed = await res.json();
      if (res.status === 429) {
        setParseNote(t("Too many requests, try again in a minute. You can also tap the options below."));
        return;
      }
      if (!res.ok) throw new Error(parsed.error);
      setP((cur) => ({
        ...cur,
        avoid: [...new Set([...cur.avoid, ...parsed.avoid])],
        diet: [...new Set([...cur.diet, ...parsed.diet])],
        likes: [...new Set([...cur.likes, ...parsed.likes])],
        dislikes: [...new Set([...cur.dislikes, ...parsed.dislikes])],
        exclude: [...new Set([...(cur.exclude ?? []), ...(parsed.exclude ?? [])])],
        styles: [...new Set([...(cur.styles ?? []), ...(parsed.styles ?? [])])],
        goal: parsed.goal ?? cur.goal,
      }));
      setParseNote(t("Got it. Check the selections below and fix anything we got wrong."));
    } catch {
      setParseNote(t("Couldn't read that right now. Tap the options below instead."));
    } finally {
      setParsing(false);
    }
  }

  function addLike() {
    const w = like.trim().toLowerCase();
    if (w) setP({ ...p, likes: [...new Set([...p.likes, w])] });
    setLike("");
  }

  function addNever() {
    const w = cleanExclude(never);
    setNever("");
    if (!w) return;
    const label = allergenFor(w);
    if (label) {
      setP({ ...p, avoid: [...new Set([...p.avoid, label])] });
      setNeverNote(t("USC labels that as {label}, so we selected it above.", { label: t(LABEL_NAMES[label]) }));
    } else {
      setP({ ...p, exclude: [...new Set([...(p.exclude ?? []), w])] });
      setNeverNote(null);
    }
  }

  function addDislike() {
    const w = dislike.trim().toLowerCase();
    if (w) setP({ ...p, dislikes: [...new Set([...p.dislikes, w])] });
    setDislike("");
  }

  if (step === "taste") {
    return (
      <div className="rise flex flex-col gap-5 pb-32">
        <header className="pt-2">
          <button type="button" onClick={() => setStep("profile")} className="mb-2 -ml-1 rounded-full px-1 text-sm font-medium text-stone-500">
            ‹ {t("Back")}
          </button>
          <p className="text-xs font-bold uppercase tracking-widest text-cardinal">{t("Last step")}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{t("What looks good?")}</h1>
          <p className="mt-1 text-stone-500">{t("Swipe right on what you'd eat. Eight different kinds of food from today's menus.")}</p>
        </header>
        <TasteQuiz profile={p} onRate={(dish, v) => setP((cur) => ({ ...cur, taste: rate(cur.taste, dish, v) }))} onFinish={finish} />
        <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={finish}
            className="mx-auto block w-full max-w-md rounded-2xl py-3 text-base font-semibold text-stone-500 transition active:scale-[0.98]"
          >
            {t("Skip, show my dining hall")} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rise flex flex-col gap-7 pb-32">
      <header className="pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {onCancel && (
              <button type="button" onClick={onCancel} className="mb-2 -ml-1 rounded-full px-1 text-sm font-medium text-stone-500">
                ‹ {t("Back")}
              </button>
            )}
            {onCancel ? (
              <h1 className="select-none text-3xl font-bold tracking-tight text-cardinal">{t("Your profile")}</h1>
            ) : (
              <h1 className="select-none text-3xl">
                <Logo />
              </h1>
            )}
          </div>
          <LangButton />
        </div>
        <p className="mt-1 text-stone-600">
          {onCancel
            ? t("Tell us what you can't eat and what you love.")
            : t("Your forecast for USC dining: tell us what you can't eat and what you love, and we check all three halls for you.")}
        </p>
      </header>

      {!onCancel && onStarter && (
        <section aria-labelledby="quick-start">
          <h2 id="quick-start" className="font-semibold">
            {t("Quick start")}
          </h2>
          <p className="mb-3 text-sm text-stone-500">{t("One tap and you'll see today's pick. You can adjust it anytime.")}</p>
          <div className="grid grid-cols-2 gap-2">
            {STARTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStarter(s)}
                className="flex min-h-14 items-center gap-2.5 rounded-2xl bg-card px-3 py-2 text-left text-[0.9375rem] font-semibold leading-tight shadow-sm ring-1 ring-stone-200 transition active:scale-[0.98] active:bg-stone-50"
              >
                <span className="w-6 shrink-0 text-center text-xl" aria-hidden>
                  {s.icon}
                </span>
                <span className="min-w-0">{t(s.label)}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            <span className="h-px flex-1 bg-stone-200" />
            {t("Or set it up your way")}
            <span className="h-px flex-1 bg-stone-200" />
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200">
        <label htmlFor="about" className="text-sm font-semibold">{t("Describe how you eat")}</label>
        <textarea
          id="about"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("e.g. I'm halal, lactose intolerant, lifting to build muscle, love spicy food, hate mushrooms")}
          className="mt-2 w-full resize-none rounded-xl border border-stone-300 p-3 text-base outline-none focus:border-cardinal"
        />
        <button
          type="button"
          onClick={readText}
          disabled={parsing || !text.trim()}
          className="mt-2 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-ink-fg disabled:opacity-40"
        >
          {parsing ? t("Reading...") : t("Fill in for me")}
        </button>
        {parseNote && <p className="mt-2 text-sm text-stone-600">{parseNote}</p>}
      </section>

      <section>
        <h2 className="font-semibold">{t("Allergies")}</h2>
        <p className="mb-3 text-sm text-stone-500">{t("We hide anything USC labels with these. Lactose intolerant? Pick Dairy. Celiac? Pick Gluten/Wheat.")}</p>
        <div className="grid grid-cols-2 gap-2">
          {ALLERGENS.map((a: Allergen) => (
            <Tile key={a} icon={ALLERGEN_ICON[a]} label={t(LABEL_NAMES[a])} selected={p.avoid.includes(a)} onClick={() => setP({ ...p, avoid: toggle(p.avoid, a) })} />
          ))}
        </div>
        {p.avoid.length > 0 && (
          <label className="mt-3 flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" className="mt-0.5 accent-cardinal" checked={Boolean(p.aaz)} onChange={(e) => setP({ ...p, aaz: e.target.checked })} />
            {t("I'm registered for Parkside's Allergen Awareness Zone")}
          </label>
        )}

        <h3 className="mt-6 font-semibold">{t("Anything else you never eat?")}</h3>
        <p className="mb-3 text-sm text-stone-500">{t("For foods USC doesn't label, like beef. We hide dishes whose names include them, so it's a best guess.")}</p>
        <div className="grid grid-cols-2 gap-2">
          {[...new Set([...NEVER_IDEAS, ...(p.exclude ?? [])])].map((w) => {
            const on = (p.exclude ?? []).includes(w);
            return (
              <Tile
                key={w}
                icon={NEVER_ICON[w] ?? dishEmoji(w)}
                label={t(w[0].toUpperCase() + w.slice(1))}
                selected={on}
                removable={on && !NEVER_IDEAS.includes(w)}
                onClick={() => setP({ ...p, exclude: toggle(p.exclude ?? [], w) })}
              />
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={never}
            onChange={(e) => setNever(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addNever()}
            maxLength={30}
            placeholder={t("Add another, e.g. turkey")}
            aria-label={t("Add a food you never eat")}
            className="h-12 min-w-0 flex-1 rounded-xl border border-stone-200 bg-card px-3 text-base outline-none focus:border-cardinal"
          />
          <button type="button" onClick={addNever} disabled={!never.trim()} className="h-12 rounded-xl bg-ink px-5 text-sm font-semibold text-ink-fg transition active:scale-95 disabled:opacity-30">
            {t("Add")}
          </button>
        </div>
        {neverNote && <p className="mt-2 text-sm text-cardinal">{neverNote}</p>}
      </section>

      <section>
        <h2 className="font-semibold">{t("Diet")}</h2>
        <p className="mb-3 text-sm text-stone-500">{t("Only dishes USC labels this way.")}</p>
        <div className="grid grid-cols-2 gap-2">
          {PREFERENCES.map((d) => (
            <Tile key={d} tone="green" label={t(DIET_NAMES[d])} selected={p.diet.includes(d)} onClick={() => setP({ ...p, diet: toggle(p.diet, d) })} />
          ))}
        </div>
        <p className="mt-4 mb-3 text-sm text-stone-500">{t("USC doesn't label these, so we make a best guess from dish names and estimates.")}</p>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <Tile
              key={s.id}
              tone="green"
              label={t(s.name)}
              selected={(p.styles ?? []).includes(s.id)}
              onClick={() => setP({ ...p, styles: toggle(p.styles ?? [], s.id) })}
            />
          ))}
        </div>
        {(p.styles ?? []).length > 0 && (
          <p className="mt-2 text-xs text-stone-500">{STYLES.filter((s) => p.styles!.includes(s.id)).map((s) => `${t(s.name)}: ${t(s.blurb)}`).join(" · ")}</p>
        )}
      </section>

      <section>
        <h2 className="font-semibold">{t("Fitness goal")}</h2>
        <p className="mb-2 text-sm text-stone-500">{t("We'll rank dishes and build a plate that suits it.")}</p>
        <div className="grid grid-cols-2 gap-2">
          <Tile label={t("No goal")} selected={!p.goal} onClick={() => setP({ ...p, goal: undefined })} />
          {GOALS.map((g) => (
            <Tile key={g.id} label={t(g.name)} selected={p.goal === g.id} onClick={() => setP({ ...p, goal: g.id })} />
          ))}
        </div>
        {p.goal && <p className="mt-2 text-xs text-stone-500">{t("{goal}, using AI estimates from dish names.", { goal: t(GOALS.find((g) => g.id === p.goal)!.blurb) })}</p>}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t("What do you love?")}</h2>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...LIKE_IDEAS, ...p.likes])].map((w) => (
            <Chip key={w} label={t(w)} selected={p.likes.includes(w)} onClick={() => setP({ ...p, likes: toggle(p.likes, w) })} />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={like}
            onChange={(e) => setLike(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLike()}
            maxLength={40}
            placeholder={t("Add your own, e.g. curry")}
            aria-label={t("Add a food you love")}
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-card px-3 py-2 text-base outline-none focus:border-cardinal"
          />
          <button type="button" onClick={addLike} className="rounded-xl border border-stone-300 bg-card px-4 text-sm font-medium active:scale-95">
            {t("Add")}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">{t("Anything you don't like?")}</h2>
        <div className="flex gap-2">
          <input
            value={dislike}
            onChange={(e) => setDislike(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDislike()}
            maxLength={40}
            placeholder={t("e.g. mushrooms")}
            aria-label={t("Add a food you don't like")}
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-card px-3 py-2 text-base outline-none focus:border-cardinal"
          />
          <button type="button" onClick={addDislike} className="rounded-xl border border-stone-300 bg-card px-4 text-sm font-medium">
            {t("Add")}
          </button>
        </div>
        {p.dislikes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {p.dislikes.map((w) => (
              <Chip key={w} label={`${w} ✕`} selected={false} onClick={() => setP({ ...p, dislikes: p.dislikes.filter((x) => x !== w) })} />
            ))}
          </div>
        )}
      </section>

      {onCancel && <TasteQuiz profile={p} onRate={(dish, v) => setP((cur) => ({ ...cur, taste: rate(cur.taste, dish, v) }))} />}

      {taste.count > 0 && (
        <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200">
          <h2 className="font-semibold">{t("Your ratings")}</h2>
          <p className="mt-1 text-sm text-stone-600">
            {taste.count === 1 ? t("You've rated 1 dish.") : t("You've rated {n} dishes.", { n: taste.count })}
            {taste.toward.length ? ` ${t("Leaning toward {list}.", { list: taste.toward.map((x) => t(x)).join(", ") })}` : ""}
            {taste.away.length ? ` ${t("Leaning away from {list}.", { list: taste.away.map((x) => t(x)).join(", ") })}` : ""}
          </p>
          <button type="button" onClick={() => setP({ ...p, taste: undefined })} className="mt-2 text-sm font-medium text-cardinal underline">
            {t("Clear my ratings")}
          </button>
        </section>
      )}

      <section>
        <label htmlFor="dorm" className="font-semibold">{t("Where do you live?")}</label>
        <p className="mb-2 text-sm text-stone-500">{t("We'll show the walk to each hall and prefer closer ones when the food is similar.")}</p>
        <select
          id="dorm"
          value={p.dorm ?? ""}
          onChange={(e) => setP({ ...p, dorm: e.target.value || undefined })}
          className="w-full rounded-xl border border-stone-300 bg-card px-3 py-2.5 text-base outline-none focus:border-cardinal"
        >
          <option value="">{t("Off campus or rather not say")}</option>
          {DORMS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-background/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          onClick={() => {
            if (onCancel) return onDone(p);
            setStep("taste");
            window.scrollTo(0, 0);
          }}
          className="mx-auto block w-full max-w-md rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-lg active:brightness-90"
        >
          {onCancel ? t("Find my dining hall") : t("Continue")}
        </button>
      </div>
    </div>
  );
}
