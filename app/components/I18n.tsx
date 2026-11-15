"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { makeT, type T } from "@/lib/i18n";
import { findLang, isLang, LANGS, type LangId } from "@/lib/lang";

const LangContext = createContext<{ lang: LangId; setLang: (l: LangId) => void }>({ lang: "en", setLang: () => {} });

export function LangProvider({ lang, setLang, children }: { lang: LangId; setLang: (l: LangId) => void; children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useT(): T {
  const { lang } = useLang();
  return useMemo(() => makeT(lang), [lang]);
}

const SHORT: Record<LangId, string> = { en: "EN", es: "ES", fr: "FR", zh: "中", ko: "한", hi: "हि", vi: "VI" };

/** Small globe button for the header; opens the language list. */
export function LangButton() {
  const { lang, setLang } = useLang();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("Language: {name}. Change language", { name: findLang(lang).name })}
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-1 rounded-full bg-card px-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition active:scale-95"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M2.5 10h15M10 2.5c2.2 2.3 2.2 12.7 0 15M10 2.5c-2.2 2.3-2.2 12.7 0 15" />
        </svg>
        {SHORT[lang]}
      </button>
      {open && (
        <ul className="rise absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl bg-card py-1 shadow-xl ring-1 ring-stone-200">
          {LANGS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                lang={l.id}
                aria-current={l.id === lang}
                onClick={() => {
                  setLang(l.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[0.9375rem] ${l.id === lang ? "font-semibold text-cardinal" : "text-stone-800"} active:bg-stone-100`}
              >
                {l.name}
                {l.id === lang && <span aria-hidden>✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** For pages outside the main app (/rate): reads and saves the same language the app uses. */
export function StoredLangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangId>(() => {
    try {
      const saved = localStorage.getItem("forkcast-lang");
      if (isLang(saved)) return saved;
      const p = JSON.parse(localStorage.getItem("dining-profile-v1") ?? "null");
      if (isLang(p?.lang)) return p.lang;
    } catch {}
    return "en";
  });
  const setLang = useCallback((l: LangId) => {
    setLangState(l);
    try {
      localStorage.setItem("forkcast-lang", l);
      const p = JSON.parse(localStorage.getItem("dining-profile-v1") ?? "null");
      if (p) localStorage.setItem("dining-profile-v1", JSON.stringify({ ...p, lang: l === "en" ? undefined : l }));
    } catch {}
  }, []);
  return (
    <LangProvider lang={lang} setLang={setLang}>
      {children}
    </LangProvider>
  );
}
