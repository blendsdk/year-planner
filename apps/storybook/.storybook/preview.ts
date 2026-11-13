import "@blendsdk/react-year-planner/styles.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    a11y: { test: "todo" },
    options: {
      // Demos first: the first-run experience shows what the planner does.
      storySort: {
        order: ["Full Demo", "Demos", "Year Planner", "Classic Year"],
      },
    },
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
        tablet: { name: "Tablet", styles: { width: "834px", height: "1112px" } },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" } },
      },
    },
  },
};

export default preview;
