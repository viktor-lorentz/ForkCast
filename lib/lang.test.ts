import { describe, expect, it } from "vitest";
import { CARD, LANG_IDS, mealName, overstatesSafety, statedMinutes, statesMacroNumber } from "./lang";
import { cleanProfile, profileKey } from "./profile";
import { packProfile, unpackProfile } from "./share";

describe("overstatesSafety", () => {
  it.each([
    "This is safe for you",
    "Es un plato seguro",
    "Comida libre de alérgenos",
    "Ce plat est sans danger",
    "Un choix sûr pour toi",
    "Repas sans allergènes",
    "这道菜很安全",
    "无过敏原的选择",
    "이 메뉴는 안전해요",
    "यह आपके लिए सुरक्षित है",
    "Món này an toàn cho bạn",
    "Không có chất gây dị ứng",
  ])("catches %s", (t) => expect(overstatesSafety(t)).toBe(true));

  it.each([
    "No sesame per USC labels.",
    "Sin sésamo, según las etiquetas de USC.",
    "Sans sésame, selon les étiquettes USC.",
    "根据 USC 标签：不含芝麻。",
    "USC 라벨 기준: 참깨 없음.",
    "USC लेबल के अनुसार: तिल नहीं।",
    "Theo nhãn của USC: không có mè.",
  ])("allows %s", (t) => expect(overstatesSafety(t)).toBe(false));
});

describe("statedMinutes", () => {
  it("finds walking minutes in every language", () => {
    expect(statedMinutes("a 7 min walk")).toEqual([7]);
    expect(statedMinutes("a 7 minutos a pie")).toEqual([7]);
    expect(statedMinutes("步行 7 分钟")).toEqual([7]);
    expect(statedMinutes("걸어서 7분")).toEqual([7]);
    expect(statedMinutes("7 मिनट पैदल")).toEqual([7]);
    expect(statedMinutes("7 phút đi bộ")).toEqual([7]);
  });
});

describe("statesMacroNumber", () => {
  it("catches calorie and gram numbers in every language", () => {
    for (const t of ["30g protein", "500 calorías", "30克蛋白质", "500칼로리", "30 ग्राम", "500 calo"]) expect(statesMacroNumber(t), t).toBe(true);
    expect(statesMacroNumber("2 mains and 3 sides")).toBe(false);
  });
});

describe("card text", () => {
  it.each(LANG_IDS)("%s fallback text never overstates safety and keeps minutes checkable", (id) => {
    const c = CARD[id];
    for (const t of [c.rulesSummary("USC Village", 9, 4, 6), c.perLabels("no Sesame"), c.fits, c.checked, c.walk(9, "New North")]) {
      expect(overstatesSafety(t), t).toBe(false);
      expect(statesMacroNumber(t), t).toBe(false);
    }
    expect(statedMinutes(c.rulesSummary("USC Village", 9, 4, 6))).toEqual([9]);
  });

  it("translates meal names and falls back to USC's name", () => {
    expect(mealName("Dinner", "es")).toBe("Cena");
    expect(mealName("Dinner", "en")).toBe("Dinner");
    expect(mealName("Late Night", "zh")).toBe("Late Night");
  });
});

describe("profile language", () => {
  const base = { avoid: [], diet: [], likes: [], dislikes: [] };
  it("is part of the cache key and the share link", () => {
    const es = cleanProfile({ ...base, lang: "es" });
    expect(profileKey(es)).not.toBe(profileKey(cleanProfile(base)));
    expect(unpackProfile(`#p=${packProfile(es)}`)?.lang).toBe("es");
  });
  it("rejects unknown languages", () => {
    expect(() => cleanProfile({ ...base, lang: "xx" })).toThrow();
  });
});
