import type { Meta, StoryObj } from "@storybook/react-vite";
import { FullDemo as FullDemoApp } from "./full-demo/FullDemo";

const meta = {
  title: "Full Demo",
  component: FullDemoApp,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story:
          "Northwind Construction's 2027 plan. Double-click a date to allocate a project, right-click a project to edit or delete it, and reload the page to see localStorage persistence.",
      },
    },
  },
} satisfies Meta<typeof FullDemoApp>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The construction planning demo that opens first in Storybook.
 *
 * It has no `play` function on purpose: Storybook runs play functions on load,
 * and it must not write demo data to localStorage before the user acts.
 */
export const FullDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "The full Northwind Construction plan. Double-click a date to allocate, right-click a project to edit or delete, and reload to verify localStorage persistence.",
      },
    },
  },
};
