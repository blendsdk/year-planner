# @blendsdk/year-planner-languages

Complete left-to-right UI translations for
[Year Planner for React](https://github.com/blendsdk/year-planner).

The package contains 45 locale catalogues covering 41 languages. Every
planner-owned label, button, error prefix, keyboard instruction and
screen-reader announcement is translated. Host content — item titles, layer
names, statuses and custom diagnostics — remains the host's responsibility.

## Install

```bash
pnpm add @blendsdk/react-year-planner @blendsdk/year-planner-languages
```

## Use one language

Import the exact locale so your bundle carries one catalogue, not all of them:

```tsx
import { YearPlanner } from "@blendsdk/react-year-planner";
import { de } from "@blendsdk/year-planner-languages/de";

<YearPlanner year={2027} display={{ locale: "de-DE" }} messages={de} />;
```

## Resolve a locale

`getPlannerMessages` maps a BCP 47 locale to a complete catalogue. It tries the
exact locale, then the language id, then the base language, and finally English:

```tsx
import { getPlannerMessages, getPlannerLanguage } from "@blendsdk/year-planner-languages";

const language = getPlannerLanguage("de-AT");
const messages = getPlannerMessages("de-AT");

<YearPlanner year={2027} display={{ locale: language?.locale ?? "en-US" }} messages={messages} />;
```

The main entry exports every catalogue. Prefer a subpath import when you ship
one language; the main entry is only for a runtime language picker that can
load any catalogue.

## Supported languages

| Id        | Locale       | Language                 |
| --------- | ------------ | ------------------------ |
| `en`      | `en-US`      | English                  |
| `en-GB`   | `en-GB`      | English (United Kingdom) |
| `nl`      | `nl-NL`      | Dutch                    |
| `de`      | `de-DE`      | German                   |
| `fr`      | `fr-FR`      | French                   |
| `es`      | `es-ES`      | Spanish                  |
| `it`      | `it-IT`      | Italian                  |
| `pt`      | `pt-PT`      | Portuguese (Portugal)    |
| `pt-BR`   | `pt-BR`      | Portuguese (Brazil)      |
| `da`      | `da-DK`      | Danish                   |
| `sv`      | `sv-SE`      | Swedish                  |
| `nb`      | `nb-NO`      | Norwegian Bokmål         |
| `fi`      | `fi-FI`      | Finnish                  |
| `is`      | `is-IS`      | Icelandic                |
| `pl`      | `pl-PL`      | Polish                   |
| `cs`      | `cs-CZ`      | Czech                    |
| `sk`      | `sk-SK`      | Slovak                   |
| `hu`      | `hu-HU`      | Hungarian                |
| `ro`      | `ro-RO`      | Romanian                 |
| `bg`      | `bg-BG`      | Bulgarian                |
| `hr`      | `hr-HR`      | Croatian                 |
| `sl`      | `sl-SI`      | Slovenian                |
| `sr`      | `sr-Latn-RS` | Serbian (Latin)          |
| `sr-Cyrl` | `sr-Cyrl-RS` | Serbian (Cyrillic)       |
| `ru`      | `ru-RU`      | Russian                  |
| `uk`      | `uk-UA`      | Ukrainian                |
| `et`      | `et-EE`      | Estonian                 |
| `lv`      | `lv-LV`      | Latvian                  |
| `lt`      | `lt-LT`      | Lithuanian               |
| `el`      | `el-GR`      | Greek                    |
| `tr`      | `tr-TR`      | Turkish                  |
| `hy`      | `hy-AM`      | Eastern Armenian         |
| `ka`      | `ka-GE`      | Georgian                 |
| `ja`      | `ja-JP`      | Japanese                 |
| `ko`      | `ko-KR`      | Korean                   |
| `zh`      | `zh-CN`      | Chinese (Simplified)     |
| `zh-TW`   | `zh-TW`      | Chinese (Traditional)    |
| `vi`      | `vi-VN`      | Vietnamese               |
| `id`      | `id-ID`      | Indonesian               |
| `ms`      | `ms-MY`      | Malay                    |
| `th`      | `th-TH`      | Thai                     |
| `hi`      | `hi-IN`      | Hindi                    |
| `bn`      | `bn-BD`      | Bengali                  |
| `ta`      | `ta-IN`      | Tamil                    |
| `mr`      | `mr-IN`      | Marathi                  |

Every catalogue is left-to-right. Right-to-left layout and keyboard mirroring
are outside this release.

## Override one message

A host can merge its own wording without replacing the whole catalogue:

```tsx
<YearPlanner year={2027} messages={{ ...de, actionDelete: "Endgültig löschen" }} />;
```

Plural messages are replaced as a whole object so forms from two languages
never mix.

## Licence

The package is offered under the
[Year Planner Internal Use License 1.0](https://github.com/blendsdk/year-planner/blob/main/LICENSE).
Earlier MIT grants remain valid for the material they cover.
