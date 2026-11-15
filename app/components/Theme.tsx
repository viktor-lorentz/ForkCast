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
      className="relative h-8 w-[3.75rem] shrink-0 rounded-full bg-card ring-1 ring-stone-300 transition active:scale-95"
    >
      {/* The knob and both icons share the same two 24px slots (left 4px and left 32px), so each icon sits dead center in the knob. */}
      <span
        aria-hidden
        className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-ink shadow transition-transform duration-200 ease-out ${dark ? "translate-x-7" : ""}`}
      />
      <span aria-hidden className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center">
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-colors ${dark ? "text-stone-400" : "text-gold"}`} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      </span>
      <span aria-hidden className="absolute top-1 left-8 flex h-6 w-6 items-center justify-center">
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-colors ${dark ? "text-ink-fg" : "text-stone-400"}`} fill="currentColor">
          <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1z" />
        </svg>
      </span>
    </button>
  );
}
