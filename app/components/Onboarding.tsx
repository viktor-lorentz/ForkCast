"use client";

import { useEffect, useRef, useState } from "react";
import { GOALS } from "@/lib/plate";
import type { Profile } from "@/lib/profile";
import { STYLES } from "@/lib/styles";
import { rate, tasteSummary } from "@/lib/taste";
import { ALLERGENS, LABEL_NAMES, PREFERENCES, type Allergen, type Preference } from "@/lib/types";
import { DORMS } from "@/lib/walking";
import { Chip } from "./Chip";
import { TasteQuiz } from "./TasteQuiz";

const LIKE_IDEAS = ["spicy", "rice", "chicken", "pasta", "mexican", "asian", "burger", "salad", "breakfast", "soup"];
const DIET_NAMES: Record<Preference, string> = { "halal-ingredients": "Halal", vegan: "Vegan", vegetarian: "Vegetarian" };

function toggle<T>(xs: T[], x: T): T[] {
  return xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x];
}

export function Onboarding({
  initial,
  onDone,
  onCancel,
}: {
  initial: Profile;
  onDone: (p: Profile) => void;
  /** Set when editing an existing profile, so there is something to go back to. */
  onCancel?: () => void;
}) {
  const [p, setP] = useState<Profile>(initial);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [dislike, setDislike] = useState("");
  const [like, setLike] = useState("");
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
      if (!res.ok) throw new Error(parsed.error);
      setP((cur) => ({
        ...cur,
        avoid: [...new Set([...cur.avoid, ...parsed.avoid])],
        diet: [...new Set([...cur.diet, ...parsed.diet])],
        likes: [...new Set([...cur.likes, ...parsed.likes])],
        dislikes: [...new Set([...cur.dislikes, ...parsed.dislikes])],
        styles: [...new Set([...(cur.styles ?? []), ...(parsed.styles ?? [])])],
        goal: parsed.goal ?? cur.goal,
      }));
      setParseNote("Got it. Check the selections below and fix anything we got wrong.");
    } catch {
      setParseNote("Couldn't read that right now. Tap the options below instead.");
    } finally {
      setParsing(false);
    }
  }

  function addLike() {
    const w = like.trim().toLowerCase();
    if (w) setP({ ...p, likes: [...new Set([...p.likes, w])] });
    setLike("");
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
            ‹ Back
          </button>
          <p className="text-sm font-semibold uppercase tracking-wide text-cardinal">Last step · 15 seconds</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">What looks good?</h1>
          <p className="mt-1 text-stone-600">Five dishes from today&apos;s menus. Swipe right if you&apos;d eat it, left if not, and we&apos;ll pick better for you.</p>
        </header>
        <TasteQuiz profile={p} onRate={(dish, v) => setP((cur) => ({ ...cur, taste: rate(cur.taste, dish, v) }))} onFinish={finish} />
        <div className="fixed inset-x-0 bottom-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={finish}
            className="mx-auto block w-full max-w-md rounded-2xl py-3 text-base font-semibold text-stone-500 transition active:scale-[0.98]"
          >
            Skip, show my dining hall →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rise flex flex-col gap-7 pb-32">
      <header className="pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="mb-2 -ml-1 rounded-full px-1 text-sm font-medium text-stone-500">
            ‹ Back
          </button>
        )}
        <h1 className="select-none text-3xl font-bold tracking-tight text-cardinal">{onCancel ? "Your profile" : "ForkCast"}</h1>
        <p className="mt-1 text-stone-600">{onCancel ? "Tell us what you can't eat and what you love." : "Your forecast for USC dining: tell us what you can't eat and what you love, and we check all three halls for you."}</p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <label htmlFor="about" className="text-sm font-semibold">Describe how you eat</label>
        <textarea
          id="about"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. I'm halal, lactose intolerant, lifting to build muscle, love spicy food, hate mushrooms"
          className="mt-2 w-full resize-none rounded-xl border border-stone-300 p-3 text-base outline-none focus:border-cardinal"
        />
        <button
          type="button"
          onClick={readText}
          disabled={parsing || !text.trim()}
          className="mt-2 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {parsing ? "Reading..." : "Fill in for me"}
        </button>
        {parseNote && <p className="mt-2 text-sm text-stone-600">{parseNote}</p>}
      </section>

      <section>
        <h2 className="font-semibold">Allergies</h2>
        <p className="mb-2 text-sm text-stone-500">We hide anything USC labels with these. Lactose intolerant? Pick Dairy. Celiac? Pick Gluten/Wheat.</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((a: Allergen) => (
            <Chip key={a} label={LABEL_NAMES[a]} selected={p.avoid.includes(a)} onClick={() => setP({ ...p, avoid: toggle(p.avoid, a) })} />
          ))}
        </div>
        {p.avoid.length > 0 && (
          <label className="mt-3 flex items-start gap-2 text-sm text-stone-600">
            <input type="checkbox" className="mt-0.5 accent-cardinal" checked={Boolean(p.aaz)} onChange={(e) => setP({ ...p, aaz: e.target.checked })} />
            I&apos;m registered for Parkside&apos;s Allergen Awareness Zone
          </label>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Diet</h2>
        <p className="mb-2 text-sm text-stone-500">Only dishes USC labels this way.</p>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map((d) => (
            <Chip key={d} tone="green" label={DIET_NAMES[d]} selected={p.diet.includes(d)} onClick={() => setP({ ...p, diet: toggle(p.diet, d) })} />
          ))}
        </div>
        <p className="mt-4 mb-2 text-sm text-stone-500">USC doesn&apos;t label these, so we make a best guess from dish names and estimates.</p>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <Chip
              key={s.id}
              tone="green"
              label={s.name}
              selected={(p.styles ?? []).includes(s.id)}
              onClick={() => setP({ ...p, styles: toggle(p.styles ?? [], s.id) })}
            />
          ))}
        </div>
        {(p.styles ?? []).length > 0 && (
          <p className="mt-2 text-xs text-stone-500">{STYLES.filter((s) => p.styles!.includes(s.id)).map((s) => `${s.name}: ${s.blurb.toLowerCase()}`).join(" · ")}</p>
        )}
      </section>

      <section>
        <h2 className="font-semibold">Fitness goal</h2>
        <p className="mb-2 text-sm text-stone-500">We&apos;ll rank dishes and build a plate that suits it.</p>
        <div className="flex flex-wrap gap-2">
          <Chip label="No goal" selected={!p.goal} onClick={() => setP({ ...p, goal: undefined })} />
          {GOALS.map((g) => (
            <Chip key={g.id} label={g.name} selected={p.goal === g.id} onClick={() => setP({ ...p, goal: g.id })} />
          ))}
        </div>
        {p.goal && <p className="mt-2 text-xs text-stone-500">{GOALS.find((g) => g.id === p.goal)!.blurb}, using AI estimates from dish names.</p>}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">What do you love?</h2>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...LIKE_IDEAS, ...p.likes])].map((w) => (
            <Chip key={w} label={w} selected={p.likes.includes(w)} onClick={() => setP({ ...p, likes: toggle(p.likes, w) })} />
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={like}
            onChange={(e) => setLike(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLike()}
            maxLength={40}
            placeholder="Add your own, e.g. curry"
            aria-label="Add a food you love"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-cardinal"
          />
          <button type="button" onClick={addLike} className="rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium active:scale-95">
            Add
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Anything you don&apos;t like?</h2>
        <div className="flex gap-2">
          <input
            value={dislike}
            onChange={(e) => setDislike(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDislike()}
            maxLength={40}
            placeholder="e.g. mushrooms"
            aria-label="Add a food you don't like"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-cardinal"
          />
          <button type="button" onClick={addDislike} className="rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium">
            Add
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
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
          <h2 className="font-semibold">Your ratings</h2>
          <p className="mt-1 text-sm text-stone-600">
            You&apos;ve rated {taste.count} dish{taste.count === 1 ? "" : "es"}
            {taste.toward.length ? `. Leaning toward ${taste.toward.join(", ")}` : ""}
            {taste.away.length ? `${taste.toward.length ? ", away from" : ". Leaning away from"} ${taste.away.join(", ")}` : ""}.
          </p>
          <button type="button" onClick={() => setP({ ...p, taste: undefined })} className="mt-2 text-sm font-medium text-cardinal underline">
            Clear my ratings
          </button>
        </section>
      )}

      <section>
        <label htmlFor="dorm" className="font-semibold">Where do you live?</label>
        <p className="mb-2 text-sm text-stone-500">We&apos;ll show the walk to each hall and prefer closer ones when the food is similar.</p>
        <select
          id="dorm"
          value={p.dorm ?? ""}
          onChange={(e) => setP({ ...p, dorm: e.target.value || undefined })}
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-cardinal"
        >
          <option value="">Off campus or rather not say</option>
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
          className="mx-auto block w-full max-w-md rounded-2xl bg-cardinal py-4 text-lg font-semibold text-white shadow-lg active:bg-cardinal-dark"
        >
          {onCancel ? "Find my dining hall" : "Continue"}
        </button>
      </div>
    </div>
  );
}
