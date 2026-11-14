"use client";

import { useState } from "react";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import { EMPTY_PROFILE, type Profile } from "@/lib/profile";
import { Onboarding } from "./Onboarding";
import { Today } from "./Today";

const KEY = "dining-profile-v1";

function loadSaved(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

function save(p: Profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Private mode: the profile just won't persist.
  }
}

function initialProfile(): Profile | null {
  // ?demo=<id> loads a sample student (for judges); otherwise use the saved profile.
  const demoId = new URLSearchParams(window.location.search).get("demo");
  return DEMO_PROFILES.find((d) => d.id === demoId)?.profile ?? loadSaved();
}

/** Browser-only (see app/page.tsx), so it can read localStorage and the URL on first render. */
export default function App() {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [editing, setEditing] = useState(false);

  const showOnboarding = editing || !profile;
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5">
      {showOnboarding ? (
        <Onboarding
          initial={profile ?? EMPTY_PROFILE}
          onDone={(p) => {
            save(p);
            setProfile(p);
            setEditing(false);
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <Today
          profile={profile}
          onEdit={() => setEditing(true)}
          onSwitch={(p) => {
            save(p);
            setProfile(p);
            window.scrollTo(0, 0);
          }}
        />
      )}
    </main>
  );
}
