"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./Theme";
import { LangButton, StoredLangProvider, useT } from "./I18n";

export default function NotFoundWithLang() {
  return (
    <StoredLangProvider>
      <NotFound />
    </StoredLangProvider>
  );
}

function NotFound() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-12 pt-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="text-base" aria-label={t("ForkCast home")}>
          <Logo />
        </Link>
        <div className="flex shrink-0 gap-2">
          <ThemeToggle />
          <LangButton />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="text-5xl" aria-hidden>
          🍽️
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("This page isn't on the menu")}</h1>
        <p className="mt-2 text-sm text-stone-500">{t("The link may be old or mistyped.")}</p>
        <Link href="/" className="mt-6 rounded-2xl bg-brand px-6 py-3 text-base font-semibold text-white transition active:scale-95">
          {t("Go to today's pick")}
        </Link>
      </div>
    </main>
  );
}
