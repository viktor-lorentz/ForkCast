import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate the food · ForkCast",
  description: "Score USC dining hall dishes from 1 to 10 so other students know what's good.",
};

export default function RateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
