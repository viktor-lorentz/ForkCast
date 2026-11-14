/** A friendly food icon for a dish name, used on the swipe cards and in emails. */
const EMOJI: [RegExp, string][] = [
  [/pizza/i, "🍕"],
  [/burger|slider/i, "🍔"],
  [/taco|burrito|enchilada|quesadilla/i, "🌮"],
  [/pasta|spaghetti|penne|mac/i, "🍝"],
  [/curry|masala|tikka|dal|vindaloo/i, "🍛"],
  [/sushi|poke/i, "🍣"],
  [/noodle|ramen|pho|lo mein|pad thai/i, "🍜"],
  [/rice|bowl/i, "🍚"],
  [/salad/i, "🥗"],
  [/soup|stew|chili/i, "🍲"],
  [/sandwich|hoagie|wrap|panini/i, "🥪"],
  [/egg|omelet/i, "🍳"],
  [/pancake|waffle|french toast/i, "🧇"],
  [/salmon|fish|tuna|cod|tilapia/i, "🐟"],
  [/shrimp/i, "🍤"],
  [/chicken|turkey/i, "🍗"],
  [/beef|steak|brisket|rib/i, "🥩"],
  [/pork|bacon|sausage|ham/i, "🥓"],
  [/tofu|bean|lentil|chickpea|falafel|vegetable|veggie/i, "🥦"],
];
export const dishEmoji = (name: string) => EMOJI.find(([re]) => re.test(name))?.[1] ?? "🍽️";

export const MEAL_EMOJI: Record<string, string> = { Breakfast: "🍳", Brunch: "🥞", Lunch: "🥪", Dinner: "🍽️" };
