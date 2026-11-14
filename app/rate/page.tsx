"use client";

import dynamic from "next/dynamic";

const RatePage = dynamic(() => import("../components/RatePage"), {
  ssr: false,
  loading: () => <main className="min-h-dvh" />,
});

export default function Rate() {
  return <RatePage />;
}
