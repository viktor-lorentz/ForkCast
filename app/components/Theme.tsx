"use client";

import { useEffect, useState } from "react";
import { useT } from "./I18n";

export const THEME_KEY = "forkcast-theme";

/**
 * Runs in <head> before the page paints, so a saved theme never flashes the wrong colors.
 * Without a saved choice the page follows the phone's setting (globals.css).
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

function currentDark(): boolean {
  const set = document.documentElement.dataset.theme;
  if (set === "dark") return true;
  if (set === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Sun/moon switch for the header. Starts from the phone's setting; a tap saves your choice. */
export function ThemeToggle() {
  const t = useT();
  const [dark, setDark] = useState(currentDark);
  useEffect(() => {
    // Follow the phone if it changes and you haven't picked a theme here.
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => !document.documentElement.dataset.theme && setDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={t("Dark mode")}
      onClick={flip}
      className="relative flex h-8 w-[3.75rem] shrink-0 items-center rounded-full bg-card px-1 ring-1 ring-stone-300 transition active:scale-95"
    >
      <span
        aria-hidden
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-ink shadow transition-transform duration-200 ease-out ${dark ? "translate-x-[1.75rem]" : ""}`}
      />
      <svg viewBox="0 0 20 20" className={`relative h-4 w-4 transition-colors ${dark ? "text-stone-400" : "text-gold"}`} fill="currentColor" aria-hidden>
        <circle cx="10" cy="10" r="3.6" />
        <path d="M10 1.8v2.4M10 15.8v2.4M1.8 10h2.4M15.8 10h2.4M4.2 4.2l1.7 1.7M14.1 14.1l1.7 1.7M4.2 15.8l1.7-1.7M14.1 5.9l1.7-1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 20 20" className={`relative ml-auto h-4 w-4 transition-colors ${dark ? "text-ink-fg" : "text-stone-400"}`} fill="currentColor" aria-hidden>
        <path d="M15.5 12.6A6.5 6.5 0 0 1 7.4 4.5a6.5 6.5 0 1 0 8.1 8.1z" />
      </svg>
    </button>
  );
}
