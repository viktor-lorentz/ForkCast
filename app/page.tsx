"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("./components/App"), {
  ssr: false,
  loading: () => <main className="min-h-dvh" />,
});

export default function Home() {
  return <App />;
}
