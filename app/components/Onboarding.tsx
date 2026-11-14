"use client";

import { useState } from "react";
import type { Profile } from "@/lib/profile";
import { ALLERGENS, LABEL_NAMES, PREFERENCES, type Allergen, type Preference } from "@/lib/types";
import { Chip } from "./Chip";

const LIKE_IDEAS = ["spicy", "rice", "chicken", "pasta", "mexican", "asian", "burger", "salad", "breakfast", "soup"];
const DIET_NAMES: Record<Preference, string> = { "halal-ingredients": "Halal", vegan: "Vegan", vegetarian: "Vegetarian" };

function toggle<T>(xs: T[], x: T): T[] {
  return xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x];
}

export function Onboarding({ initial, onDone }: { initial: Profile; onDone: (p: Profile) => void }) {
  const [p, setP] = useState<Profile>(initial);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseNote, setParseNote] = useState<string | null>(null);
  const [dislike, setDislike] = useState("");

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

  function addDislike() {
    const w = dislike.trim().toLowerCase();
    if (w) setP({ ...p, dislikes: [...new Set([...p.dislikes, w])] });
    setDislike("");
  }

  return (
    <div className="flex flex-col gap-7 pb-28">
      <header className="pt-2">
        <h1 className="text-3xl font-bold tracking-tight text-cardinal">Where should I eat?</h1>
        <p className="mt-1 text-stone-600">Tell us what you can&apos;t eat and what you love. We check all three dining halls for you.</p>
      </header>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
        <label htmlFor="about" className="text-sm font-semibold">Describe how you eat</label>
        <textarea
          id="about"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. I'm halal, allergic to sesame, love spicy food, hate mushrooms"
          className="mt-2 w-full resize-none rounded-xl border border-stone-300 p-3 text-[15px] outline-none focus:border-cardinal"
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
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Anything you don&apos;t like?</h2>
        <div className="flex gap-2">
          <input
            value={dislike}
            onChange={(e) => setDislike(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDislike()}
            placeholder="e.g. mushrooms"
            className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-[15px] outline-none focus:border-cardinal"
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

      <div className="fixed inset-x-0 bottom-0 border-t border-stone-200 bg-background/95 p-4 backdrop-blur">
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
