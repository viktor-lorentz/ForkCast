"use client";

import dynamic from "next/dynamic";

const NotFound = dynamic(() => import("./components/NotFound"), {
  ssr: false,
  loading: () => <main className="min-h-dvh" />,
});

export default function NotFoundPage() {
  return <NotFound />;
}
