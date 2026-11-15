"use client";

import { useState } from "react";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import { cleanProfile, EMPTY_PROFILE, type Profile } from "@/lib/profile";
import { unpackProfile } from "@/lib/share";
import { Banner } from "./Banner";
import { Onboarding } from "./Onboarding";
import { Today } from "./Today";

const KEY = "dining-profile-v1";

function loadSaved(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY);
    // cleanProfile validates, so a profile saved by an older version can't break the app.
    return raw ? cleanProfile(JSON.parse(raw)) : null;
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
  // A "Take it with you" link (#p=...) carries a whole profile: save it here and tidy the address bar.
  const shared = unpackProfile(window.location.hash);
  if (shared) {
    save(shared);
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return shared;
  }
  // ?demo=<id> loads a sample student (for judges); otherwise use the saved profile.
  const demoId = new URLSearchParams(window.location.search).get("demo");
  const demo = DEMO_PROFILES.find((d) => d.id === demoId);
  return demo ? cleanProfile(demo.profile) : loadSaved();
}

/** Browser-only (see app/page.tsx), so it can read localStorage and the URL on first render. */
export default function App() {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [editing, setEditing] = useState(false);

  const showOnboarding = editing || !profile;
  return (
    <main className="mx-auto w-full max-w-md px-4 pt-5">
      <Banner />
      {showOnboarding ? (
        <Onboarding
          initial={profile ?? EMPTY_PROFILE}
          onCancel={profile ? () => setEditing(false) : undefined}
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
          onEdit={() => {
            setEditing(true);
            window.scrollTo(0, 0);
          }}
          onSwitch={(p) => {
            save(p);
            setProfile(p);
            window.scrollTo(0, 0);
          }}
          onChange={(p) => {
            save(p);
            setProfile(p);
          }}
        />
      )}
    </main>
  );
}
