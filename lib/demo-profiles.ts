import celiac from "@/data/test-profiles/celiac.json";
import eggSoy from "@/data/test-profiles/egg-soy.json";
import halalSesame from "@/data/test-profiles/halal-sesame.json";
import noRestrictions from "@/data/test-profiles/no-restrictions.json";
import nutAllergy from "@/data/test-profiles/nut-allergy.json";
import seafood from "@/data/test-profiles/seafood-allergy.json";
import vegDairyFree from "@/data/test-profiles/vegetarian-dairy-free.json";
import veganGf from "@/data/test-profiles/vegan-gluten-free.json";
import type { Profile } from "./profile";

export interface DemoProfile {
  id: string;
  label: string;
  profile: Profile;
}

/** Sample students for judges: open /?demo=<id>. Same files the test suite runs. */
export const DEMO_PROFILES = [halalSesame, veganGf, nutAllergy, vegDairyFree, celiac, seafood, eggSoy, noRestrictions].map(
  (p) => ({ id: p.id, label: p.label, profile: p.profile as Profile }),
) satisfies DemoProfile[];
