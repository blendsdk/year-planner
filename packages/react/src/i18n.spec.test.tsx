import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { dateCellAccessibleName, selectionSummary } from "./a11y.js";
import { commandStatusView } from "./announcements.js";
import {
  defaultPlannerMessages,
  formatPlannerMessage,
  formatPluralMessage,
  type PlannerMessages,
  resolvePlannerMessages,
} from "./messages.js";
import { YearPlanner } from "./YearPlanner.js";

const layer = {
  id: "bookings",
  name: "Bookings",
  channel: "ribbon" as const,
  color: "#1d4e89",
};

const item = {
  id: "booking",
  layerId: "bookings",
  kind: "activity" as const,
  title: "Winter booking",
  period: { kind: "all-day" as const, startDate: "2016-01-04", endDateExclusive: "2016-01-07" },
  version: 1,
};

const german: PlannerMessages = {
  ...defaultPlannerMessages,
  regionLabel: "Jahresplaner {year}",
  gridLabel: "{region} Raster",
  skipToItemList: "Zur Artikelliste springen",
  keyboardHelp: "Pfeiltasten bewegen den Fokus.",
  isoWeek: "ISO-Woche {week}",
  itemCount: { one: "{count} Eintrag", other: "{count} Einträge" },
  dayCount: { one: "{count} Tag", other: "{count} Tage" },
  holiday: "Feiertag",
  selected: "ausgewählt",
  unavailable: "nicht verfügbar",
  selectionCleared: "Auswahl aufgehoben",
  selectionSummary: "Auswahl: {items}, {days}",
  commandPending: "Änderung ausstehend",
  commandAccepted: "Änderung angenommen",
  inspectorLabel: "Planer-Inspektor",
  inspectorTitle: "Inspektor",
  inspectorClose: "Inspektor schließen",
  inspectorEmpty: "Wählen Sie einen Eintrag oder Zeitraum.",
  detailKind: "Art",
  actionDelete: "Löschen",
  actionCreate: "Eintrag erstellen",
  itemListHeading: "Alle sichtbaren Einträge ({count})",
  itemListEmpty: "Keine sichtbaren Einträge",
  overflowLabel: "Verborgene Einträge",
};

describe("planner message formatting", () => {
  it("replaces placeholders and leaves unknown ones visible", () => {
    expect(formatPlannerMessage("Jahresplaner {year}", { year: 2027 })).toBe("Jahresplaner 2027");
    expect(formatPlannerMessage("{missing} {year}", { year: 2027 })).toBe("{missing} 2027");
  });

  it("selects plural forms with Intl.PluralRules", () => {
    const days = { one: "{count} Tag", other: "{count} Tage" };
    expect(formatPluralMessage(days, 1, "de-DE")).toBe("1 Tag");
    expect(formatPluralMessage(days, 3, "de-DE")).toBe("3 Tage");

    const russianDays = {
      one: "{count} день",
      few: "{count} дня",
      many: "{count} дней",
      other: "{count} дня",
    };
    expect(formatPluralMessage(russianDays, 1, "ru-RU")).toBe("1 день");
    expect(formatPluralMessage(russianDays, 3, "ru-RU")).toBe("3 дня");
    expect(formatPluralMessage(russianDays, 5, "ru-RU")).toBe("5 дней");
  });

  it("keeps the English fallback for keys a host does not override", () => {
    const messages = resolvePlannerMessages({ commandPending: "Warten" });
    expect(messages.commandPending).toBe("Warten");
    expect(messages.commandAccepted).toBe(defaultPlannerMessages.commandAccepted);
    expect(resolvePlannerMessages(undefined)).toBe(defaultPlannerMessages);
  });

  it("formats a date cell name and a selection summary in the target language", () => {
    expect(
      dateCellAccessibleName(
        {
          date: "2016-01-04",
          formattedDate: "4. Jan. 2016",
          itemCount: 2,
          weekNumber: 1,
          selected: true,
          locale: "de-DE",
        },
        german,
      ),
    ).toBe("4. Jan. 2016, ISO-Woche 1, 2 Einträge, ausgewählt");

    expect(
      selectionSummary(
        {
          dates: [{ startDate: "2016-01-04", endDateExclusive: "2016-01-06" }],
          items: ["booking"],
        },
        german,
        "de-DE",
      ),
    ).toBe("Auswahl: 1 Eintrag, 2 Tage");
  });

  it("uses translated command status messages", () => {
    expect(commandStatusView({ pending: true, settled: undefined }, german)).toEqual({
      text: "Änderung ausstehend",
      level: "info",
      announcement: "polite",
    });
    expect(
      commandStatusView(
        {
          pending: false,
          settled: {
            result: "accepted",
            command: { type: "delete", itemId: "x", expectedVersion: 1 },
            diagnostics: [],
          },
        },
        german,
      ),
    ).toMatchObject({ text: "Änderung angenommen" });
  });
});

describe("planner message integration", () => {
  it("renders translated UI and accessible names", () => {
    const { container } = render(
      <YearPlanner
        year={2016}
        layers={[layer]}
        defaultItems={[item]}
        defaultSelection={{ dates: [], items: ["booking"] }}
        messages={german}
      />,
    );

    expect(screen.getByRole("complementary", { name: "Planer-Inspektor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Inspektor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inspektor schließen" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Löschen" })).toBeInTheDocument();
    expect(container.textContent).toContain("Alle sichtbaren Einträge (1)");

    const cell = container.querySelector('[data-date="2016-01-04"]');
    expect(cell?.textContent).toContain("ISO-Woche 1");
    expect(cell?.textContent).toContain("1 Eintrag");
    expect(container.querySelector(".yp-sr-only")?.textContent).toContain(
      "Pfeiltasten bewegen den Fokus.",
    );
    expect(container.querySelector(".yp-root")?.getAttribute("aria-label")).toBe(
      "Jahresplaner 2016",
    );
  });

  it("renders the translated empty state and keyboard help on the server", () => {
    const html = renderToString(
      <YearPlanner year={2016} messages={{ regionLabel: "Jahresplaner {year}" }} />,
    );
    expect(html).toContain('aria-label="Jahresplaner 2016"');
    expect(html).toContain('aria-label="Jahresplaner 2016 grid"');
  });
});
