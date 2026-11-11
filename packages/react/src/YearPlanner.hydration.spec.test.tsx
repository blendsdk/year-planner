import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("RD-06-AC-10 / RD-10-AC-15: hydration", () => {
  it("hydrates server markup without mismatch errors", async () => {
    const html = renderToString(<YearPlanner year={2016} />);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    await act(async () => {
      hydrateRoot(container, <YearPlanner year={2016} />);
    });
    const messages = errors.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((message) => /hydrat|mismatch/i.test(message))).toEqual([]);
    errors.mockRestore();
    container.remove();
  });
});

it("hydrates when the client locale differs from the server default", async () => {
  const html = renderToString(<YearPlanner year={2016} />);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const serverText = container.textContent;
  Object.defineProperty(window.navigator, "language", { configurable: true, value: "de-DE" });
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => {
      hydrateRoot(container, <YearPlanner year={2016} />);
    });
    const messages = errors.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((message) => /hydrat|mismatch/i.test(message))).toEqual([]);
    // The explicit en-US default wins, so the hydrated text is byte-for-byte
    // the server text even though the client reports de-DE.
    expect(container.textContent).toBe(serverText);
  } finally {
    Reflect.deleteProperty(window.navigator, "language");
    errors.mockRestore();
    container.remove();
  }
});

it("hydrates invalid display options deterministically", async () => {
  const element = (
    <YearPlanner
      year={2016}
      display={{ locale: "not-a-locale", displayTimeZone: "Mars/Olympus" }}
    />
  );
  const html = renderToString(element);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await act(async () => {
      hydrateRoot(container, element);
    });
    const messages = errors.mock.calls.map((call) => String(call[0]));
    expect(messages.filter((message) => /hydrat|mismatch/i.test(message))).toEqual([]);
    expect(container.querySelector('[role="grid"]')).not.toBeNull();
  } finally {
    errors.mockRestore();
    container.remove();
  }
});
