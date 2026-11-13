import { defaultPlannerMessages, type PlannerMessages } from "@blendsdk/react-year-planner";
import { describe, expect, it } from "vitest";
import { getPlannerLanguage, getPlannerMessages, plannerLanguages } from "./index.js";
import * as catalogues from "./locales/index.js";

/**
 * Locale catalogue contract.
 *
 * Every catalogue must be complete, use the same placeholders as English, and
 * supply exactly the plural categories the locale can select.
 */

const PLACEHOLDER = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

function placeholders(template: string): string[] {
  return [...template.matchAll(PLACEHOLDER)].map((match) => match[1] ?? "").sort();
}

function keysOf(messages: PlannerMessages): string[] {
  return Object.keys(messages).sort();
}

function isPlural(value: unknown): value is Record<string, string> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const EXPECTED_KEYS = keysOf(defaultPlannerMessages);

describe("languages registry", () => {
  it("publishes 45 unique locale catalogues across 41 languages", () => {
    expect(plannerLanguages).toHaveLength(45);
    expect(new Set(plannerLanguages.map((language) => language.id)).size).toBe(45);
    expect(new Set(plannerLanguages.map((language) => language.locale)).size).toBe(45);
    expect(plannerLanguages.every((language) => language.direction === "ltr")).toBe(true);
    expect(plannerLanguages.some((language) => language.id === "hy")).toBe(true);
    expect(plannerLanguages.some((language) => language.id === "sr-Cyrl")).toBe(true);
    expect(plannerLanguages.some((language) => language.id === "zh-TW")).toBe(true);
    expect(plannerLanguages.some((language) => language.id === "mr")).toBe(true);
  });

  it("resolves exact locales, language ids, base languages and English", () => {
    expect(getPlannerLanguage("de-AT")?.id).toBe("de");
    expect(getPlannerLanguage("de_DE")?.id).toBe("de");
    expect(getPlannerLanguage("sr-Cyrl")?.id).toBe("sr-Cyrl");
    expect(getPlannerLanguage("pt-BR")?.id).toBe("pt-BR");
    expect(getPlannerLanguage("pt-PT")?.id).toBe("pt");
    expect(getPlannerLanguage("xx-YY")).toBeUndefined();
    expect(getPlannerLanguage("")).toBeUndefined();
    expect(getPlannerMessages("de")).toEqual(catalogues.de);
    expect(getPlannerMessages("de-AT")).toEqual(catalogues.de);
    expect(getPlannerMessages("pt-BR")).toEqual(catalogues.ptBR);
    expect(getPlannerMessages("xx-YY")).toEqual(catalogues.en);
    expect(getPlannerMessages("hy-AM")).toEqual(catalogues.hy);
  });
});

describe("catalogue completeness", () => {
  it("matches the English key set in every locale", () => {
    for (const [name, catalogue] of Object.entries(catalogues)) {
      expect(keysOf(catalogue), name).toEqual(EXPECTED_KEYS);
      for (const key of EXPECTED_KEYS) {
        const value = catalogue[key as keyof PlannerMessages];
        if (typeof value === "string") {
          expect(value.trim().length, `${name}.${key} is empty`).toBeGreaterThan(0);
        } else {
          expect(isPlural(value), `${name}.${key} is not a plural object`).toBe(true);
          expect(value.other.trim().length, `${name}.${key}.other is empty`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("preserves the English placeholder set in every message", () => {
    for (const [name, catalogue] of Object.entries(catalogues)) {
      for (const key of EXPECTED_KEYS) {
        const english = defaultPlannerMessages[key as keyof PlannerMessages];
        const translated = catalogue[key as keyof PlannerMessages];
        if (typeof english === "string") {
          expect(typeof translated, `${name}.${key} is not a string`).toBe("string");
          expect(placeholders(translated as string), `${name}.${key}`).toEqual(
            placeholders(english),
          );
          continue;
        }
        if (!isPlural(translated)) {
          expect.fail(`${name}.${key} is not a plural object`);
        }
        for (const [category, template] of Object.entries(translated)) {
          expect(placeholders(template), `${name}.${key}.${category}`).toEqual(
            placeholders(english.other),
          );
        }
      }
    }
  });

  it("supplies the plural categories the locale can select", () => {
    for (const language of plannerLanguages) {
      const catalogue = getPlannerMessages(language.locale);
      const categories = new Set(
        new Intl.PluralRules(language.locale).resolvedOptions().pluralCategories,
      );
      categories.add("other");
      for (const key of [
        "itemCount",
        "dayCount",
        "visibilityChanged",
        "itemListShowAll",
        "overflowShow",
      ] as const) {
        const forms = catalogue[key];
        for (const category of categories) {
          expect(
            forms[category as keyof typeof forms],
            `${language.id}.${key}.${category}`,
          ).toBeTruthy();
        }
      }
    }
  });

  it("keeps the English catalogue identical to the React default", () => {
    expect(catalogues.en).toEqual(defaultPlannerMessages);
    expect(catalogues.enGB).toEqual(defaultPlannerMessages);
  });
});

describe("locale-specific plural behaviour", () => {
  it("uses Slavic few and many forms", () => {
    const ru = getPlannerMessages("ru-RU").itemCount;
    expect(ru.one).toContain("{count}");
    expect(ru.few).toContain("{count}");
    expect(ru.many).toContain("{count}");
    const pl = getPlannerMessages("pl-PL").itemCount;
    expect(pl.few).toContain("{count}");
    expect(pl.many).toContain("{count}");
  });

  it("uses the dual form for Slovenian", () => {
    const sl = getPlannerMessages("sl-SI").itemCount;
    expect(sl.two).toContain("{count}");
  });

  it("uses only the other form for Japanese and Thai", () => {
    for (const locale of ["ja-JP", "th-TH"]) {
      const forms = getPlannerMessages(locale).itemCount;
      expect(Object.keys(forms)).toEqual(["other"]);
    }
  });

  it("formats Armenian dates through Intl", () => {
    const month = new Intl.DateTimeFormat("hy-AM", {
      month: "long",
      calendar: "gregory",
      timeZone: "UTC",
    }).format(new Date("2026-01-01T00:00:00Z"));
    expect(month).not.toBe("January");
    expect(month.length).toBeGreaterThan(2);
  });
});
