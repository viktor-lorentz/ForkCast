import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { THEME_SCRIPT } from "./components/Theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://forkcast-usc.vercel.app"),
  title: "ForkCast · USC dining",
  description: "ForkCast tells you which USC dining hall has food you can eat, every meal.",
  appleWebApp: { capable: true, title: "ForkCast", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#990000", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        {/* Vercel Web Analytics (visitors, pages) and Speed Insights (real-device load times). No cookies. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
