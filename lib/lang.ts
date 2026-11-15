/**
 * Languages for the main card. Sonnet writes the summary and dish reasons in the chosen language;
 * dish names, hall names and label claims stay exactly as USC writes them. Other UI stays English.
 */
export const LANG_IDS = ["en", "es", "zh", "ko", "hi", "vi"] as const;
export type LangId = (typeof LANG_IDS)[number];

export const LANGS: { id: LangId; name: string; english: string }[] = [
  { id: "en", name: "English", english: "English" },
  { id: "es", name: "Español", english: "Spanish" },
  { id: "zh", name: "中文", english: "Simplified Chinese" },
  { id: "ko", name: "한국어", english: "Korean" },
  { id: "hi", name: "हिन्दी", english: "Hindi" },
  { id: "vi", name: "Tiếng Việt", english: "Vietnamese" },
];

export const findLang = (id?: string | null) => LANGS.find((l) => l.id === id) ?? LANGS[0];
export const isLang = (x: unknown): x is LangId => (LANG_IDS as readonly unknown[]).includes(x);

/** Words that overstate safety, in every language we write in. Checked by code on every answer. */
const BANNED_LATIN =
  /(?<![\p{L}])(safe|safely|guaranteed|allergen[- ]free|segur[oa]s?|garantizad[oa]s?|libre de alérgenos|sin alérgenos|an toàn|đảm bảo|không (có )?chất gây dị ứng|không gây dị ứng)(?![\p{L}])/iu;
const BANNED_OTHER = /(安全|无过敏原|不含过敏原|保证|안전|알레르기 ?(유발 ?물질 ?)?없는|알레르겐 ?없는|보장|सुरक्षित|एलर्जी[- ]?मुक्त|एलर्जन[- ]?मुक्त|गारंटी)/u;

export function overstatesSafety(text: string): boolean {
  return BANNED_LATIN.test(text) || BANNED_OTHER.test(text);
}

/** Every "N min" / "N 分钟" / "N분" / "N मिनट" / "N phút" written in an answer. */
export function statedMinutes(text: string): number[] {
  return [...text.matchAll(/(\d+)\s*-?\s*(min|分钟|分鐘|분|मिनट|phút)/giu)].map((m) => Number(m[1]));
}

/** A calorie or gram number in any of our languages. */
export function statesMacroNumber(text: string): boolean {
  return (
    /\b\d+\s*(g|grams?|gramos?|k?cal|calories?|calorías?|calo|gam)\b/iu.test(text) ||
    /\d+\s*(克|千卡|大卡|卡路里|그램|칼로리|ग्राम|कैलोरी)/u.test(text)
  );
}

type Card = {
  goTo: string;
  headsUp: string;
  comparing: string;
  checked: string;
  noMatch: string;
  walk: (min: number, from: string) => string;
  meal: Record<string, string>;
  /** Text for the code-only fallback, so the card stays in one language. */
  rulesSummary: (hall: string, walk: number | null, mains: number, sides: number) => string;
  perLabels: (labels: string) => string;
  fits: string;
};

export const CARD: Record<LangId, Card> = {
  en: {
    goTo: "go to",
    headsUp: "heads up",
    comparing: "Comparing halls...",
    checked: "Checked against USC labels",
    noMatch: "No hall has a match",
    walk: (n, from) => `${n} min walk from ${from}`,
    meal: {},
    rulesSummary: (h, w, m, s) => `${h} is your best match${w === null ? "" : `, a ${w} min walk`}: ${m} mains and ${s} sides fit your profile.`,
    perLabels: (t) => `${t} per USC labels.`,
    fits: "Fits your profile.",
  },
  es: {
    goTo: "ve a",
    headsUp: "aviso",
    comparing: "Comparando comedores...",
    checked: "Revisado con las etiquetas de USC",
    noMatch: "Ningún comedor coincide",
    walk: (n, from) => `${n} min a pie desde ${from}`,
    meal: { Breakfast: "Desayuno", Brunch: "Brunch", Lunch: "Almuerzo", Dinner: "Cena" },
    rulesSummary: (h, w, m, s) =>
      `${h} es tu mejor opción${w === null ? "" : `, a ${w} min a pie`}: ${m} platos principales y ${s} acompañamientos van con tu perfil.`,
    perLabels: (t) => `${t}, según las etiquetas de USC.`,
    fits: "Va con tu perfil.",
  },
  zh: {
    goTo: "去",
    headsUp: "注意",
    comparing: "正在比较餐厅...",
    checked: "已对照 USC 标签核查",
    noMatch: "没有餐厅符合",
    walk: (n, from) => `从 ${from} 步行 ${n} 分钟`,
    meal: { Breakfast: "早餐", Brunch: "早午餐", Lunch: "午餐", Dinner: "晚餐" },
    rulesSummary: (h, w, m, s) => `${h} 最适合你${w === null ? "" : `，步行 ${w} 分钟`}：有 ${m} 道主菜和 ${s} 道配菜符合你的要求。`,
    perLabels: (t) => `根据 USC 标签：${t}。`,
    fits: "符合你的要求。",
  },
  ko: {
    goTo: "추천 식당",
    headsUp: "알림",
    comparing: "식당 비교 중...",
    checked: "USC 라벨로 확인함",
    noMatch: "맞는 식당이 없어요",
    walk: (n, from) => `${from}에서 걸어서 ${n}분`,
    meal: { Breakfast: "아침", Brunch: "브런치", Lunch: "점심", Dinner: "저녁" },
    rulesSummary: (h, w, m, s) => `${h}이(가) 가장 잘 맞아요${w === null ? "" : ` (걸어서 ${w}분)`}: 메인 ${m}개, 사이드 ${s}개가 프로필에 맞아요.`,
    perLabels: (t) => `USC 라벨 기준: ${t}.`,
    fits: "프로필에 맞아요.",
  },
  hi: {
    goTo: "जाएँ",
    headsUp: "ध्यान दें",
    comparing: "डाइनिंग हॉल की तुलना हो रही है...",
    checked: "USC लेबल से जाँचा गया",
    noMatch: "कोई हॉल मेल नहीं खाता",
    walk: (n, from) => `${from} से ${n} मिनट पैदल`,
    meal: { Breakfast: "नाश्ता", Brunch: "ब्रंच", Lunch: "दोपहर का खाना", Dinner: "रात का खाना" },
    rulesSummary: (h, w, m, s) =>
      `${h} आपके लिए सबसे अच्छा है${w === null ? "" : ` (${w} मिनट पैदल)`}: ${m} मुख्य व्यंजन और ${s} साइड आपकी प्रोफ़ाइल से मेल खाते हैं।`,
    perLabels: (t) => `USC लेबल के अनुसार: ${t}।`,
    fits: "आपकी प्रोफ़ाइल से मेल खाता है।",
  },
  vi: {
    goTo: "đến",
    headsUp: "lưu ý",
    comparing: "Đang so sánh nhà ăn...",
    checked: "Đã đối chiếu với nhãn của USC",
    noMatch: "Không có nhà ăn nào phù hợp",
    walk: (n, from) => `${n} phút đi bộ từ ${from}`,
    meal: { Breakfast: "Bữa sáng", Brunch: "Bữa nửa buổi", Lunch: "Bữa trưa", Dinner: "Bữa tối" },
    rulesSummary: (h, w, m, s) => `${h} hợp với bạn nhất${w === null ? "" : ` (${w} phút đi bộ)`}: ${m} món chính và ${s} món phụ phù hợp với bạn.`,
    perLabels: (t) => `Theo nhãn của USC: ${t}.`,
    fits: "Phù hợp với bạn.",
  },
};

export const card = (lang?: string | null) => CARD[findLang(lang).id];
export const mealName = (meal: string, lang?: string | null) => card(lang).meal[meal] ?? meal;
