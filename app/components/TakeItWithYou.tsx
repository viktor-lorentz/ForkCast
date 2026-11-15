"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/profile";
import { shareUrl } from "@/lib/share";

type EmailStatus = { enabled: boolean; daily: boolean };
type SendState = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; daily: boolean } | { kind: "error"; text: string };

/** Open your profile on another device (link + QR), and get your picks by email. */
export function TakeItWithYou({ profile }: { profile: Profile }) {
  const link = shareUrl(window.location.origin, profile);
  const [showQr, setShowQr] = useState(false);
  const [qr, setQr] = useState<{ link: string; src: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [email, setEmail] = useState("");
  const [daily, setDaily] = useState(true);
  const [send, setSend] = useState<SendState>({ kind: "idle" });

  useEffect(() => {
    fetch("/api/email/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!showQr || qr?.link === link) return;
    import("qrcode")
      .then((QR) => QR.toDataURL(link, { margin: 1, width: 440, errorCorrectionLevel: "L", color: { dark: "#1c1917", light: "#ffffff" } }))
      .then((src) => setQr({ link, src }))
      // Very long profiles (lots of ratings) can be too big for a QR code; the link still works.
      .catch(() => setQr({ link, src: null }));
  }, [showQr, link, qr]);

  async function copy() {
    try {
      if (navigator.share) await navigator.share({ title: "My dining profile", url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Share sheet dismissed.
    }
  }

  async function sendEmail() {
    setSend({ kind: "sending" });
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, profile, daily: daily && status?.daily }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send");
      setSend({ kind: "sent", daily: data.daily });
    } catch (err) {
      setSend({ kind: "error", text: (err as Error).message });
    }
  }

  const validEmail = /^[^\s@]+@usc\.edu$/i.test(email.trim());

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-stone-200">
      <h2 className="font-semibold">Take it with you</h2>

      <div className="mt-3">
        <p className="text-sm text-stone-600">Open your profile and ratings on another device. No account needed.</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setShowQr(!showQr)}
            aria-expanded={showQr}
            className="flex-1 rounded-xl border border-stone-300 bg-card py-2.5 text-sm font-semibold transition active:scale-95"
          >
            {showQr ? "Hide QR code" : "Show QR code"}
          </button>
          <button type="button" onClick={copy} className="flex-1 rounded-xl bg-ink py-2.5 text-sm font-semibold text-ink-fg transition active:scale-95">
            {copied ? "Copied ✓" : "Share link"}
          </button>
        </div>
        {showQr && (
          <div className="rise mt-3 flex flex-col items-center">
            {qr?.link === link && qr.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, nothing to optimize
              <img src={qr.src} alt="QR code. Scan it with another phone to open your ForkCast profile there." width={220} height={220} className="rounded-xl ring-1 ring-stone-200" />
            ) : qr?.link === link ? (
              <p className="text-sm text-stone-500">Too much to fit in a QR code. Use Share link instead.</p>
            ) : (
              <div className="h-[220px] w-[220px] animate-pulse rounded-xl bg-stone-100" />
            )}
            <p className="mt-2 text-xs text-stone-400">Scan with your other phone&apos;s camera. Anyone with this link sees your profile.</p>
          </div>
        )}
      </div>

      {status?.enabled && (
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-600">Get today&apos;s picks for every meal by email.</p>
          {send.kind === "sent" ? (
            <p className="rise mt-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              Sent to {email.trim()}.{send.daily ? " Tap “Yes, send it daily” in the email to get it every morning." : ""}
            </p>
          ) : (
            <>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && validEmail && sendEmail()}
                  placeholder="you@usc.edu"
                  aria-label="Your USC email"
                  className="min-w-0 flex-1 rounded-xl border border-stone-300 bg-card px-3 py-2 text-base outline-none focus:border-cardinal"
                />
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={!validEmail || send.kind === "sending"}
                  className="rounded-xl bg-brand px-4 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
                >
                  {send.kind === "sending" ? "Sending..." : "Email me"}
                </button>
              </div>
              {status.daily && (
                <label className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                  <input type="checkbox" className="accent-cardinal" checked={daily} onChange={(e) => setDaily(e.target.checked)} />
                  Also every morning around 7 AM
                </label>
              )}
              {send.kind === "error" && <p className="mt-2 text-sm text-red-700">{send.text}</p>}
              {email.trim() && !validEmail && <p className="mt-1 text-xs text-stone-400">Use your @usc.edu address.</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}
