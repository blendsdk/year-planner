import { type PlannerMessages, resolvePlannerMessages } from "@blendsdk/react-year-planner";
import {
  bg,
  bn,
  cs,
  da,
  de,
  el,
  en,
  enGB,
  es,
  et,
  fi,
  fr,
  hi,
  hr,
  hu,
  hy,
  id,
  is,
  it,
  ja,
  ka,
  ko,
  lt,
  lv,
  mr,
  ms,
  nb,
  nl,
  pl,
  pt,
  ptBR,
  ro,
  ru,
  sk,
  sl,
  sr,
  srCyrl,
  sv,
  ta,
  th,
  tr,
  uk,
  vi,
  zh,
  zhTW,
} from "./locales/index.js";

/**
 * One supported planner language.
 *
 * `id` is the stable package key. `locale` is the BCP 47 tag passed to Intl.
 * Every catalogue is left-to-right; RTL support is outside this release.
 *
 * @public
 */
export interface PlannerLanguage {
  /** Stable short identifier, for example `de` or `pt-BR`. */
  id: string;
  /** BCP 47 locale used for dates, numbers and plural rules. */
  locale: string;
  /** English name. */
  name: string;
  /** Name in the language itself. */
  nativeName: string;
  /** Text direction; this release supports only `ltr`. */
  direction: "ltr";
}

/**
 * Every language shipped by this package, in display order.
 *
 * @public
 */
export const plannerLanguages: readonly PlannerLanguage[] = [
  { id: "en", locale: "en-US", name: "English", nativeName: "English", direction: "ltr" },
  {
    id: "en-GB",
    locale: "en-GB",
    name: "English (United Kingdom)",
    nativeName: "English (United Kingdom)",
    direction: "ltr",
  },
  { id: "nl", locale: "nl-NL", name: "Dutch", nativeName: "Nederlands", direction: "ltr" },
  { id: "de", locale: "de-DE", name: "German", nativeName: "Deutsch", direction: "ltr" },
  { id: "fr", locale: "fr-FR", name: "French", nativeName: "Français", direction: "ltr" },
  { id: "es", locale: "es-ES", name: "Spanish", nativeName: "Español", direction: "ltr" },
  { id: "it", locale: "it-IT", name: "Italian", nativeName: "Italiano", direction: "ltr" },
  {
    id: "pt",
    locale: "pt-PT",
    name: "Portuguese (Portugal)",
    nativeName: "Português (Portugal)",
    direction: "ltr",
  },
  {
    id: "pt-BR",
    locale: "pt-BR",
    name: "Portuguese (Brazil)",
    nativeName: "Português (Brasil)",
    direction: "ltr",
  },
  { id: "da", locale: "da-DK", name: "Danish", nativeName: "Dansk", direction: "ltr" },
  { id: "sv", locale: "sv-SE", name: "Swedish", nativeName: "Svenska", direction: "ltr" },
  {
    id: "nb",
    locale: "nb-NO",
    name: "Norwegian Bokmål",
    nativeName: "Norsk bokmål",
    direction: "ltr",
  },
  { id: "fi", locale: "fi-FI", name: "Finnish", nativeName: "Suomi", direction: "ltr" },
  { id: "is", locale: "is-IS", name: "Icelandic", nativeName: "Íslenska", direction: "ltr" },
  { id: "pl", locale: "pl-PL", name: "Polish", nativeName: "Polski", direction: "ltr" },
  { id: "cs", locale: "cs-CZ", name: "Czech", nativeName: "Čeština", direction: "ltr" },
  { id: "sk", locale: "sk-SK", name: "Slovak", nativeName: "Slovenčina", direction: "ltr" },
  { id: "hu", locale: "hu-HU", name: "Hungarian", nativeName: "Magyar", direction: "ltr" },
  { id: "ro", locale: "ro-RO", name: "Romanian", nativeName: "Română", direction: "ltr" },
  { id: "bg", locale: "bg-BG", name: "Bulgarian", nativeName: "Български", direction: "ltr" },
  { id: "hr", locale: "hr-HR", name: "Croatian", nativeName: "Hrvatski", direction: "ltr" },
  {
    id: "sl",
    locale: "sl-SI",
    name: "Slovenian",
    nativeName: "Slovenščina",
    direction: "ltr",
  },
  {
    id: "sr",
    locale: "sr-Latn-RS",
    name: "Serbian (Latin)",
    nativeName: "Srpski (latinica)",
    direction: "ltr",
  },
  {
    id: "sr-Cyrl",
    locale: "sr-Cyrl-RS",
    name: "Serbian (Cyrillic)",
    nativeName: "Српски (ћирилица)",
    direction: "ltr",
  },
  { id: "ru", locale: "ru-RU", name: "Russian", nativeName: "Русский", direction: "ltr" },
  { id: "uk", locale: "uk-UA", name: "Ukrainian", nativeName: "Українська", direction: "ltr" },
  { id: "et", locale: "et-EE", name: "Estonian", nativeName: "Eesti", direction: "ltr" },
  { id: "lv", locale: "lv-LV", name: "Latvian", nativeName: "Latviešu", direction: "ltr" },
  { id: "lt", locale: "lt-LT", name: "Lithuanian", nativeName: "Lietuvių", direction: "ltr" },
  { id: "el", locale: "el-GR", name: "Greek", nativeName: "Ελληνικά", direction: "ltr" },
  { id: "tr", locale: "tr-TR", name: "Turkish", nativeName: "Türkçe", direction: "ltr" },
  { id: "hy", locale: "hy-AM", name: "Armenian", nativeName: "Հայերեն", direction: "ltr" },
  { id: "ka", locale: "ka-GE", name: "Georgian", nativeName: "ქართული", direction: "ltr" },
  { id: "ja", locale: "ja-JP", name: "Japanese", nativeName: "日本語", direction: "ltr" },
  { id: "ko", locale: "ko-KR", name: "Korean", nativeName: "한국어", direction: "ltr" },
  {
    id: "zh",
    locale: "zh-CN",
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    direction: "ltr",
  },
  {
    id: "zh-TW",
    locale: "zh-TW",
    name: "Chinese (Traditional)",
    nativeName: "繁體中文",
    direction: "ltr",
  },
  { id: "vi", locale: "vi-VN", name: "Vietnamese", nativeName: "Tiếng Việt", direction: "ltr" },
  {
    id: "id",
    locale: "id-ID",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    direction: "ltr",
  },
  { id: "ms", locale: "ms-MY", name: "Malay", nativeName: "Bahasa Melayu", direction: "ltr" },
  { id: "th", locale: "th-TH", name: "Thai", nativeName: "ไทย", direction: "ltr" },
  { id: "hi", locale: "hi-IN", name: "Hindi", nativeName: "हिन्दी", direction: "ltr" },
  { id: "bn", locale: "bn-BD", name: "Bengali", nativeName: "বাংলা", direction: "ltr" },
  { id: "ta", locale: "ta-IN", name: "Tamil", nativeName: "தமிழ்", direction: "ltr" },
  { id: "mr", locale: "mr-IN", name: "Marathi", nativeName: "मराठी", direction: "ltr" },
];

const catalogues: Record<string, PlannerMessages> = {
  en,
  "en-GB": enGB,
  nl,
  de,
  fr,
  es,
  it,
  pt,
  "pt-BR": ptBR,
  da,
  sv,
  nb,
  fi,
  is,
  pl,
  cs,
  sk,
  hu,
  ro,
  bg,
  hr,
  sl,
  sr,
  "sr-Cyrl": srCyrl,
  ru,
  uk,
  et,
  lv,
  lt,
  el,
  tr,
  hy,
  ka,
  ja,
  ko,
  zh,
  "zh-TW": zhTW,
  vi,
  id,
  ms,
  th,
  hi,
  bn,
  ta,
  mr,
};

const byId = new Map(plannerLanguages.map((language) => [language.id.toLowerCase(), language]));
const byLocale = new Map(
  plannerLanguages.map((language) => [language.locale.toLowerCase(), language]),
);

/**
 * Resolves one language from its id or BCP 47 locale.
 *
 * @param idOrLocale - Language id such as `de`, or a locale such as `de-AT`.
 * @returns The matching language, or `undefined`.
 * @public
 */
export function getPlannerLanguage(idOrLocale: string): PlannerLanguage | undefined {
  const normalized = idOrLocale.trim().replace(/_/g, "-").toLowerCase();
  const direct = byId.get(normalized) ?? byLocale.get(normalized);
  if (direct) return direct;
  const base = normalized.split("-")[0];
  return base ? byId.get(base) : undefined;
}

/**
 * Returns the UI messages for a locale.
 *
 * Resolution tries the exact locale, then the language id, then the base
 * language (`de-AT` falls back to `de`), and finally English. Every result is
 * complete, even when a future runtime is missing plural data.
 *
 * @param locale - BCP 47 locale or language id.
 * @returns A complete message catalogue.
 * @example
 * ```ts
 * const messages = getPlannerMessages("de-AT");
 * ```
 * @public
 */
export function getPlannerMessages(locale: string): PlannerMessages {
  const language = getPlannerLanguage(locale);
  const catalogue = language ? catalogues[language.id] : undefined;
  return resolvePlannerMessages(catalogue);
}

export * from "./locales/index.js";
