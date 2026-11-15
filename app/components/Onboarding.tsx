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
import { ThemeToggle } from "./Theme";
import { LangButton, useT } from "./I18n";
import { LIKE_IDEAS, NEVER_IDEAS } from "@/lib/i18n-dynamic";

const ALLERGEN_ICON: Record<Allergen, string> = {
  dairy: "🥛", eggs: "🥚", fish: "🐟", gluten: "🌾", peanuts: "🥜", pork: "🥓", sesame: "🥯", shellfish: "🦐", soy: "🫘", "tree-nuts": "🌰",
};
const NEVER_ICON: Record<string, string> = { beef: "🥩", chicken: "🍗", lamb: "🐑", mushroom: "🍄", turkey: "🦃", duck: "🦆", onion: "🧅", garlic: "🧄", tomato: "🍅", avocado: "🥑", corn: "🌽", coconut: "🥥", pepper: "🫑", meat: "🍖", "red meat": "🥩" };
const DIET_NAMES: Record<Preference, string> = { "halal-ingredients": "Halal", vegan: "Vegan", vegetarian: "Vegetarian" };

const STEPS = ["welcome", "describe", "allergies", "diet", "goal", "loves", "dorm", "taste"] as const;

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
  // First-time setup is a wizard: one question per screen. Editing shows everything on one page.
  const wizard = !onCancel;
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [filled, setFilled] = useState(false);
  const [more, setMore] = useState<Record<string, boolean>>({});
  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(Math.max(0, Math.min(STEPS.length - 1, to)));
    window.scrollTo(0, 0);
  };
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
  });
  const finish = () => onDone(latest.current);

  async function readText(): Promise<boolean> {
    if (!text.trim()) return false;
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
        return false;
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
      setFilled(true);
      return true;
    } catch {
      setParseNote(t("Couldn't read that right now. Tap the options below instead."));
      return false;
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

  const rateDish = (dish: Parameters<typeof rate>[1], v: 1 | -1) => setP((cur) => ({ ...cur, taste: rate(cur.taste, dish, v) }));

  /** Extra options stay folded away during setup so each screen asks one thing; editing shows them all. */
  const extra = (id: string, label: string, children: React.ReactNode) =>
    !wizard || more[id] ? (
      <div className={wizard ? "rise" : ""}>{children}</div>
    ) : (
      <button
        type="button"
        onClick={() => setMore({ ...more, [id]: true })}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-cardinal transition active:scale-[0.98]"
      >
        <span aria-hidden>+</span> {label}
      </button>
    );

  const describe = (
    <section className={wizard ? "" : "rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200"}>
      {!wizard && <label htmlFor="about" className="text-sm font-semibold">{t("Describe how you eat")}</label>}
      <textarea
        id="about"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={wizard ? 4 : 2}
        maxLength={500}
        aria-label={t("Describe how you eat")}
        placeholder={t("e.g. I'm halal, lactose intolerant, lifting to build muscle, love spicy food, hate mushrooms")}
        className="mt-2 w-full resize-none rounded-xl border border-stone-300 bg-card p-3 text-base outline-none focus:border-cardinal"
      />
      {!wizard && (
        <button
          type="button"
          onClick={readText}
          disabled={parsing || !text.trim()}
          className="mt-2 w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-ink-fg disabled:opacity-40"
        >
          {parsing ? t("Reading...") : t("Fill in for me")}
        </button>
      )}
      {parseNote && <p className="mt-2 text-sm text-stone-600">{parseNote}</p>}
    </section>
  );

  const allergies = (
    <section>
      {!wizard && <h2 className="font-semibold">{t("Allergies")}</h2>}
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
      {extra("never", t("Anything else you never eat?"), <>
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
      </>)}
    </section>
  );

  const diet = (
    <section>
      {!wizard && <h2 className="font-semibold">{t("Diet")}</h2>}
      <p className="mb-3 text-sm text-stone-500">{t("Only dishes USC labels this way.")}</p>
      <div className="grid grid-cols-2 gap-2">
        {PREFERENCES.map((d) => (
          <Tile key={d} tone="green" label={t(DIET_NAMES[d])} selected={p.diet.includes(d)} onClick={() => setP({ ...p, diet: toggle(p.diet, d) })} />
        ))}
      </div>
      {extra("styles", t("More eating styles"), <>
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
      </>)}
    </section>
  );

  const goal = (
    <section>
      {!wizard && <h2 className="font-semibold">{t("Fitness goal")}</h2>}
      <p className="mb-2 text-sm text-stone-500">{t("We'll rank dishes and build a plate that suits it.")}</p>
      <div className="grid grid-cols-2 gap-2">
        <Tile label={t("No goal")} selected={!p.goal} onClick={() => setP({ ...p, goal: undefined })} />
        {GOALS.map((g) => (
          <Tile key={g.id} label={t(g.name)} selected={p.goal === g.id} onClick={() => setP({ ...p, goal: g.id })} />
        ))}
      </div>
      {p.goal && <p className="mt-2 text-xs text-stone-500">{t("{goal}, using AI estimates from dish names.", { goal: t(GOALS.find((g) => g.id === p.goal)!.blurb) })}</p>}
    </section>
  );

  const loves = (
    <section>
      {!wizard && <h2 className="mb-2 font-semibold">{t("What do you love?")}</h2>}
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
      {extra("dislikes", t("Anything you don't like?"), <>
        <h2 className="mt-6 mb-2 font-semibold">{t("Anything you don't like?")}</h2>
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
      </>)}
    </section>
  );

  const dorm = (
    <section>
      {!wizard && <label htmlFor="dorm" className="font-semibold">{t("Where do you live?")}</label>}
      <p className="mb-2 text-sm text-stone-500">{t("We'll show the walk to each hall and prefer closer ones when the food is similar.")}</p>
      <select
        id="dorm"
        value={p.dorm ?? ""}
        onChange={(e) => setP({ ...p, dorm: e.target.value || undefined })}
        aria-label={t("Where do you live?")}
        className="w-full rounded-xl border border-stone-300 bg-card px-3 py-3 text-base outline-none focus:border-cardinal"
      >
        <option value="">{t("Off campus or rather not say")}</option>
        {DORMS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </section>
  );

  const toolbar = (
    <div className="flex shrink-0 gap-2">
      <ThemeToggle />
      <LangButton />
    </div>
  );

  if (wizard) {
    const name = STEPS[step];
    const QUESTIONS: Record<string, { title: string; sub?: string; body: React.ReactNode }> = {
      describe: { title: t("Describe how you eat"), sub: t("In your own words. AI fills in the next steps for you, and you can fix anything."), body: describe },
      allergies: { title: t("Any allergies?"), body: allergies },
      diet: { title: t("Do you follow a diet?"), body: diet },
      goal: { title: t("Any fitness goal?"), body: goal },
      loves: { title: t("What do you love?"), sub: t("Pick a few. We'll put these first."), body: loves },
      dorm: { title: t("Where do you live?"), body: dorm },
      taste: { title: t("What looks good?"), sub: t("Swipe right on what you'd eat. Eight different kinds of food from today's menus."), body: null },
    };
    const anim = dir > 0 ? "slide-from-right" : "slide-from-left";

    if (name === "welcome") {
      return (
        <div key="welcome" className={`${anim} flex min-h-[calc(100dvh-2.5rem)] flex-col pb-8`}>
          <div className="flex items-center justify-between gap-3 pt-2">
            <span className="select-none text-2xl">
              <Logo />
            </span>
            {toolbar}
          </div>
          <div className="flex flex-1 flex-col justify-center py-10">
            <p className="text-xs font-bold uppercase tracking-widest text-cardinal">{t("USC dining, sorted")}</p>
            <h1 className="mt-3 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight">{t("Know where to eat before you go.")}</h1>
            <p className="mt-4 text-lg text-stone-600">{t("Tell us what you can't eat and what you love. We check all three dining halls for you, every meal.")}</p>
          </div>
          <button
            type="button"
            onClick={() => go(1)}
            className="w-full rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-lg shadow-cardinal/20 transition active:scale-[0.98]"
          >
            {t("Get started")} →
          </button>
          {onStarter && !more.starters && (
            <button type="button" onClick={() => setMore({ ...more, starters: true })} className="mt-3 w-full py-2 text-sm font-semibold text-stone-500">
              {t("Or try a quick start")}
            </button>
          )}
          {onStarter && more.starters && (
            <div className="rise mt-5">
              <p className="mb-2 text-center text-sm text-stone-500">{t("One tap and you'll see today's pick. You can adjust it anytime.")}</p>
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
            </div>
          )}
        </div>
      );
    }

    const q = QUESTIONS[name];
    const last = name === "taste";
    const next = async () => {
      if (name === "describe" && text.trim()) {
        if (await readText()) go(step + 1);
        return;
      }
      go(step + 1);
    };
    const nextLabel = name === "describe" ? (parsing ? t("Reading...") : text.trim() ? t("Fill in for me") : t("Skip")) : t("Next");

    return (
      <div className="flex flex-col pb-32">
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => go(step - 1)}
            aria-label={t("Back")}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-stone-500 transition active:scale-90"
          >
            ‹
          </button>
          {toolbar}
        </div>
        <div className={`mt-3 flex gap-1.5 ${last ? "invisible" : ""}`} aria-label={t("Step {i} of {n}", { i: step, n: STEPS.length - 1 })}>
          {STEPS.slice(1).map((s, n) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
              <span className={`block h-full rounded-full bg-cardinal transition-all duration-500 ease-out ${n < step ? "w-full" : "w-0"}`} />
            </span>
          ))}
        </div>
        <div key={name} className={`${anim} mt-7`}>
          {filled && name !== "describe" && !last && (
            <p className="mb-3 inline-block rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold text-stone-700">✨ {t("Filled in from what you wrote")}</p>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight">{q.title}</h1>
          {q.sub && <p className="mt-1.5 text-stone-500">{q.sub}</p>}
          <div className="mt-5">
            {last ? <TasteQuiz profile={p} onRate={rateDish} onFinish={finish} /> : q.body}
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/95 to-background/0 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {last ? (
            <button type="button" onClick={finish} className="mx-auto block w-full max-w-md rounded-2xl py-3 text-base font-semibold text-stone-500 transition active:scale-[0.98]">
              {t("Skip, show my dining hall")} →
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              disabled={parsing}
              className="mx-auto block w-full max-w-md rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-lg shadow-cardinal/20 transition active:scale-[0.98] disabled:opacity-60"
            >
              {nextLabel}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rise flex flex-col gap-7 pb-32">
      <header className="pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" onClick={onCancel} className="mb-2 -ml-1 rounded-full px-1 text-sm font-medium text-stone-500">
              ‹ {t("Back")}
            </button>
            <h1 className="select-none text-3xl font-bold tracking-tight text-cardinal">{t("Your profile")}</h1>
          </div>
          {toolbar}
        </div>
        <p className="mt-1 text-stone-600">{t("Tell us what you can't eat and what you love.")}</p>
      </header>
      {describe}
      {allergies}
      {diet}
      {goal}
      {loves}
      <TasteQuiz profile={p} onRate={rateDish} />
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
      {dorm}
      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-background/95 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button
          type="button"
          onClick={() => onDone(p)}
          className="mx-auto block w-full max-w-md rounded-2xl bg-brand py-4 text-lg font-semibold text-white shadow-lg active:brightness-90"
        >
          {t("Find my dining hall")}
        </button>
      </div>
    </div>
  );
}
