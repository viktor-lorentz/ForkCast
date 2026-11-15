import { cleanProfile, EMPTY_PROFILE, type Profile } from "./profile";

/**
 * One-tap starting profiles for the welcome screen. They only set USC label filters and a goal;
 * code enforces them exactly like the full form. "Adjust" opens the full form afterwards.
 */
export interface Starter {
  id: string;
  label: string;
  icon: string;
  profile: Profile;
}

const make = (p: Partial<Profile>): Profile => cleanProfile({ ...EMPTY_PROFILE, ...p });

export const STARTERS: Starter[] = [
  { id: "halal", label: "Halal", icon: "🌙", profile: make({ diet: ["halal-ingredients"] }) },
  { id: "vegan", label: "Vegan", icon: "🌱", profile: make({ diet: ["vegan"] }) },
  { id: "nut-allergy", label: "Nut allergy", icon: "🥜", profile: make({ avoid: ["peanuts", "tree-nuts"] }) },
  { id: "gluten-free", label: "Gluten-free", icon: "🌾", profile: make({ avoid: ["gluten"] }) },
  { id: "high-protein", label: "Lifting / high protein", icon: "💪", profile: make({ goal: "muscle" }) },
  { id: "none", label: "No restrictions", icon: "🍽️", profile: make({}) },
];

export const findStarter = (id: string | null | undefined) => STARTERS.find((s) => s.id === id);
