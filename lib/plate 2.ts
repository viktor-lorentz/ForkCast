/**
 * Estimated macros and plate building. The numbers are AI estimates from the dish name
 * (USC's menu feed has no nutrition data), so everything here is labeled as an estimate in the UI.
 * All the arithmetic is plain code: the model never adds up or states a number.
 */
export interface Macros {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const FOOD_TAGS = ["High protein", "Lighter", "Hearty", "Low carb"] as const;
export type FoodTag = (typeof FOOD_TAGS)[number];

/**
 * Plain-words tags from the estimate. The numbers themselves are too rough to show
 * (no portion sizes or recipes), but they rank dishes reliably, so only these labels reach the screen.
 */
export function foodTags(d: { kind: string; macros?: Macros | null }): FoodTag[] {
  const m = d.macros;
  if (!m || m.cal <= 0 || (d.kind !== "main" && d.kind !== "side")) return [];
  const tags: FoodTag[] = [];
  const proteinShare = (m.protein * 4) / m.cal;
  if (m.protein >= (d.kind === "main" ? 25 : 12) && proteinShare >= 0.25) tags.push("High protein");
  if (d.kind === "main" ? m.cal <= 350 : m.cal <= 120) tags.push("Lighter");
  else if (d.kind === "main" ? m.cal >= 600 : m.cal >= 350) tags.push("Hearty");
  if (m.carbs <= 10 && d.kind === "main") tags.push("Low carb");
  return tags;
}

export const GOAL_IDS = ["muscle", "cut", "bulk"] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface Goal {
  id: GoalId;
  name: string;
  blurb: string;
  plateName: string;
  /** Internal targets for one meal; used for ranking only, never shown. */
  cal: number;
  protein: number;
}

export const GOALS: Goal[] = [
  { id: "muscle", name: "Build muscle", blurb: "Puts high-protein dishes first", plateName: "Protein-forward plate", cal: 750, protein: 45 },
  { id: "cut", name: "Lean out", blurb: "Prefers high-protein, lighter dishes", plateName: "Lean, protein-forward plate", cal: 550, protein: 40 },
  { id: "bulk", name: "Bulk up", blurb: "Prefers hearty, high-protein dishes", plateName: "Hearty plate", cal: 1000, protein: 50 },
];

export const findGoal = (id: string | undefined) => GOALS.find((g) => g.id === id);

interface HasMacros {
  macros?: Macros | null;
}

export function sumMacros(dishes: HasMacros[]): Macros & { known: number } {
  const t = { cal: 0, protein: 0, carbs: 0, fat: 0, known: 0 };
  for (const d of dishes) {
    if (!d.macros) continue;
    t.cal += d.macros.cal;
    t.protein += d.macros.protein;
    t.carbs += d.macros.carbs;
    t.fat += d.macros.fat;
    t.known++;
  }
  return t;
}

/** 0 is a perfect fit for the goal; around 1 or more is a poor one. */
export function plateCost(total: Macros, goal: Goal): number {
  const off = (total.cal - goal.cal) / goal.cal;
  // Going over hurts more on a cut; coming in under hurts more on a bulk.
  const calTerm = Math.abs(off) * ((goal.id === "cut" && off > 0) || (goal.id === "bulk" && off < 0) ? 2 : 1);
  const proteinGap = Math.max(0, goal.protein - total.protein) / goal.protein;
  return calTerm + 1.5 * proteinGap;
}

/** 0-100: how close a plate comes to the goal. */
export const plateFit = (total: Macros, goal: Goal) => Math.round(100 * Math.max(0, 1 - plateCost(total, goal)));

/**
 * Best plate for a goal from dishes that already passed the allergen and diet filters:
 * 1-2 mains plus up to 2 sides, tried exhaustively over each list's top entries (lists arrive best-liked first).
 */
export function bestPlate<T extends HasMacros>(mains: T[], sides: T[], goal: Goal): T[] {
  const m = mains.filter((d) => d.macros && d.macros.cal > 0).slice(0, 10);
  const s = sides.filter((d) => d.macros && d.macros.cal > 0).slice(0, 10);
  const groups = (xs: T[], min: number): T[][] => {
    const out: T[][] = min === 0 ? [[]] : [];
    xs.forEach((a, i) => {
      out.push([a]);
      for (let j = i + 1; j < xs.length; j++) out.push([a, xs[j]]);
    });
    return out;
  };
  let best: T[] = [];
  let bestCost = Infinity;
  for (const ms of groups(m, 1)) {
    for (const ss of groups(s, 0)) {
      const plate = [...ms, ...ss];
      // Earlier in the list means better liked; a small nudge so ties go to food the student prefers.
      const rank = ms.reduce((n, d) => n + m.indexOf(d), 0) + ss.reduce((n, d) => n + s.indexOf(d), 0) * 0.5;
      const cost = plateCost(sumMacros(plate), goal) + rank * 0.01;
      if (cost < bestCost) {
        bestCost = cost;
        best = plate;
      }
    }
  }
  return best;
}
