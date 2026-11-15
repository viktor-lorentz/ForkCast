"use client";

export function Chip({
  label,
  selected,
  onClick,
  tone = "cardinal",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone?: "cardinal" | "green";
}) {
  const on = tone === "green" ? "bg-[#047857] border-[#047857] text-white" : "bg-brand border-cardinal text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
        selected ? on : "border-stone-300 bg-card text-stone-700"
      }`}
    >
      {label}
    </button>
  );
}

export function LabelTag({ text, tone }: { text: string; tone: "green" | "stone" | "red" }) {
  const cls = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    stone: "bg-stone-100 text-stone-600 ring-stone-200",
    red: "bg-red-50 text-red-800 ring-red-200",
  }[tone];
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium ring-1 ${cls}`}>{text}</span>;
}

/** An even, full-width option tile with a check: for allergies, diets and goals. */
export function Tile({
  label,
  icon,
  selected,
  onClick,
  tone = "cardinal",
  removable,
}: {
  label: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
  tone?: "cardinal" | "green";
  /** Shows an ✕ instead of a check (for foods you added yourself). */
  removable?: boolean;
}) {
  const on =
    tone === "green" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600" : "border-cardinal bg-cardinal/5 text-cardinal ring-1 ring-cardinal";
  const dot = tone === "green" ? "border-[#047857] bg-[#047857]" : "border-brand bg-brand";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex h-12 w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 text-left text-[0.9375rem] font-medium transition active:scale-[0.98] ${
        selected ? on : "border-stone-200 bg-card text-stone-700"
      }`}
    >
      {icon && (
        <span className="w-6 shrink-0 text-center text-lg" aria-hidden>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${selected ? `${dot} text-white` : "border-stone-300 text-stone-400"}`}
        aria-hidden
      >
        {selected && !removable && (
          <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 10.5l3.5 3.5 7.5-8" />
          </svg>
        )}
        {selected && removable && (
          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        )}
        {!selected && (
          <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
        )}
      </span>
    </button>
  );
}
