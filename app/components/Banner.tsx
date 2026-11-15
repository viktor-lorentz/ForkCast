"use client";

import { useEffect, useState } from "react";

/** The optional one-line notice from the emergency switches (Vercel Global Config). */
export function Banner() {
  const [text, setText] = useState("");
  useEffect(() => {
    fetch("/api/switches")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { banner?: string } | null) => setText(d?.banner ?? ""))
      .catch(() => {});
  }, []);
  if (!text) return null;
  return (
    <p role="status" className="rise mb-4 rounded-xl bg-gold/25 px-3 py-2 text-sm font-medium text-stone-900 ring-1 ring-gold/60">
      {text}
    </p>
  );
}
