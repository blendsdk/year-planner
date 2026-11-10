import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { YearPlanner } from "./YearPlanner";

describe("RD-06 hydration", () => {
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
