"use client";

import { useState } from "react";
import type { Profile } from "@/lib/profile";
import { ALLERGENS, LABEL_NAMES, PREFERENCES, type Allergen, type Preference } from "@/lib/types";
import { DORMS } from "@/lib/walking";
import { Chip } from "./Chip";

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

  return (
    <div className="rise flex flex-col gap-7 pb-32">
      <header className="pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="mb-2 -ml-1 rounded-full px-1 text-sm font-medium text-stone-500">
            ‹ Back
          </button>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-cardinal">{onCancel ? "Your profile" : "Where should I eat?"}</h1>
        <p className="mt-1 text-stone-600">Tell us what you can&apos;t eat and what you love. We check all three dining halls for you.</p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <label htmlFor="about" className="text-sm font-semibold">Describe how you eat</label>
        <textarea
          id="about"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. I'm halal, allergic to sesame, love spicy food, hate mushrooms"
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
        <p className="mb-2 text-sm text-stone-500">We hide anything USC labels with these.</p>
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
          onClick={() => onDone(p)}
          className="mx-auto block w-full max-w-md rounded-2xl bg-cardinal py-4 text-lg font-semibold text-white shadow-lg active:bg-cardinal-dark"
        >
          Find my dining hall
        </button>
      </div>
    </div>
  );
}
