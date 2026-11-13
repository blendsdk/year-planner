import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|tsx)", "../stories/**/*.mdx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-themes"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  /**
   * The production catalogue lives under the VitePress site's `/storybook/`
   * path. Development keeps the root base so `pnpm storybook` can run at
   * `http://localhost:6006`; the docs dev server proxies the production path.
   */
  viteFinal: async (viteConfig, { configType }) => {
    if (configType === "PRODUCTION") {
      viteConfig.base = process.env.STORYBOOK_BASE ?? "/year-planner/storybook/";
    }
    return viteConfig;
  },
};

export default config;
