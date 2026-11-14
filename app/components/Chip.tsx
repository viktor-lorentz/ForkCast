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
  const on = tone === "green" ? "bg-emerald-700 border-emerald-700 text-white" : "bg-cardinal border-cardinal text-white";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
        selected ? on : "border-stone-300 bg-white text-stone-700"
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
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ${cls}`}>{text}</span>;
}
