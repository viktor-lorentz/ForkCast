"use client";

import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/profile";
import { useT } from "./I18n";
import { TakeItWithYou } from "./TakeItWithYou";

/** Envelope button in the header: opens a sheet with the daily email and the share link / QR code. */
export function GetPicks({ profile }: { profile: Profile }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    const btn = button.current;
    panel.current?.querySelector<HTMLElement>("input, button")?.focus();
    // No scrolling the page behind the sheet.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
      btn?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("Email & share")}
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-stone-700 ring-1 ring-stone-300 transition active:scale-95"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden>
          <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
          <path d="M3 5.5l7 5.5 7-5.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setOpen(false)}>
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={t("Email & share")}
            onClick={(e) => e.stopPropagation()}
            className="rise max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="mx-auto h-1 w-10 rounded-full bg-stone-300 sm:hidden" aria-hidden />
            </div>
            <TakeItWithYou profile={profile} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-2xl py-3 text-base font-semibold text-stone-600 active:scale-[0.98]"
            >
              {t("Close")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
