# Localization

Year Planner for React renders English by default and accepts a complete
translation catalogue through the `messages` prop. The optional
`@blendsdk/year-planner-languages` package ships 45 locale catalogues covering
41 left-to-right languages.

## What is translated

Every planner-owned string is translated:

- Region, grid and skip-link names.
- Keyboard instructions and focus announcements.
- Date-cell and item accessible names, including plural forms.
- Command status, rejection prefixes and the delete confirmation.
- Inspector headings, details, actions and notes.
- Item-list and overflow controls.
- Visibility and editability reasons.
- Pattern, item-kind and selection messages.

Host content stays in the host's language: item titles, layer and group names,
status values, metadata and diagnostics supplied by the host. A host can
translate its own diagnostics before returning them.

Right-to-left layout and keyboard mirroring are not part of this release. All
bundled catalogues are left-to-right.

## Install

```bash
pnpm add @blendsdk/react-year-planner @blendsdk/year-planner-languages
```

## Use one language

Import the exact locale so the bundle carries one catalogue:

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import { hy } from "@blendsdk/year-planner-languages/hy";

<YearPlanner
  year={2027}
  display={{ locale: "hy-AM" }}
  messages={hy}
/>;
```

Use the same locale for `display.locale` and the catalogue. Dates, numbers and
plural forms use `Intl` with that locale; the catalogue supplies the UI words.

### Browser date-locale support

Some browsers include fewer date locales than Node.js. From `0.3.2`, the component
includes a small Gregorian date fallback for Armenian, Georgian and Icelandic.
When the browser lacks one of these locales, month and weekday headers, date
labels, inspector periods and print output still use the selected language.
Native `Intl` continues to handle timezone conversion and numeric formatting.
Browsers with native support keep their normal locale formatting.

No polyfill or extra setup is needed. Invalid or other unsupported locales still
fall back to English and report `INVALID_LOCALE`.

## Resolve a locale

`getPlannerMessages` tries the exact locale, then the language id, then the base
language, and finally English:

```tsx
import { getPlannerMessages, getPlannerLanguage } from "@blendsdk/year-planner-languages";

const language = getPlannerLanguage("de-AT");
const messages = getPlannerMessages("de-AT");

<YearPlanner
  year={2027}
  display={{ locale: language?.locale ?? "en-US" }}
  messages={messages}
/>;
```

The main entry exports every catalogue, which is convenient for a runtime
language picker. For a fixed language, prefer the subpath import; it keeps the
other catalogues out of the bundle. One catalogue is about 2.2 kB gzip; the full
set of 45 is about 87 kB gzip.

## Plural forms

Counted messages use `Intl.PluralRules`. Slavic catalogues supply `one`, `few`
and `many`; Latvian supplies `zero`; languages with a single form supply only
`other`. A runtime with incomplete plural data falls back to `other` instead of
throwing.

## Override a message

A host can replace one message while keeping the rest of the catalogue:

```tsx
<YearPlanner
  year={2027}
  display={{ locale: "de-DE" }}
  messages={{ ...de, actionDelete: "Endgültig löschen" }}
/>;
```

Plural messages are replaced as a whole object, so forms from two languages
never mix.

## Available languages

The full table, including locale tags and native names, lives in the
[package README](https://github.com/blendsdk/year-planner/blob/main/packages/languages/README.md)
and in `plannerLanguages` at runtime.

| Group | Languages |
|---|---|
| Western Europe | English (US/UK), Dutch, German, French, Spanish, Italian, Portuguese (Portugal/Brazil) |
| Nordic | Danish, Swedish, Norwegian Bokmål, Finnish, Icelandic |
| Central Europe | Polish, Czech, Slovak, Hungarian, Romanian, Croatian, Slovenian |
| Balkans and East | Bulgarian, Serbian (Latin/Cyrillic), Russian, Ukrainian, Greek, Turkish |
| Baltic and Caucasus | Estonian, Latvian, Lithuanian, Eastern Armenian, Georgian |
| Asia | Japanese, Korean, Chinese (Simplified/Traditional), Vietnamese, Indonesian, Malay, Thai, Hindi, Bengali, Tamil, Marathi |

## Demo and Storybook

The demo header has a language selector and accepts `?lang=de` in the URL. The
Storybook **Classic Year/Grid** section has a live selector plus dedicated
German and Eastern Armenian stories.

## Adding a language

1. Copy the reference catalogue in `packages/languages/src/locales/en.ts`.
2. Translate every key and keep the placeholders exactly.
3. Run `Intl.PluralRules` for the locale and supply every required category.
4. Export the catalogue from `packages/languages/src/locales/index.ts`.
5. Add the locale to `plannerLanguages`, its subpath export and the package
   checks.
6. Run the languages package tests. The completeness test fails until every key
   is present.

## Related

- [Accessibility](./accessibility.md) — live regions and accessible names.
- [Getting started](./getting-started.md) — SSR and explicit locales.
- [Limitations](./limitations.md) — RTL and other deferred capabilities.
