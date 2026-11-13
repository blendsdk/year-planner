import { defineConfig } from "vitepress";

/**
 * Public base path for the GitHub Pages project site.
 *
 * The repository is `blendsdk/year-planner`, so the site is served from
 * `https://blendsdk.github.io/year-planner/`. `DOCS_BASE_PATH` lets a future
 * custom domain switch to `/` without touching the content.
 */
const base = process.env.DOCS_BASE_PATH ?? "/year-planner/";
const site = "https://blendsdk.github.io";
const storybook = `${site}${base}storybook/`;
const api = `${site}${base}api/`;
const sitemapPrefix = base === "/" ? "" : base.replace(/\/$/, "");

export default defineConfig({
  title: "Year Planner for React",
  description:
    "A 12–36 month, 37-column year planning grid for React. Fit it to a host, theme it with CSS variables and print an A3 annual plan.",
  base,
  srcExclude: ["api/**"],
  lang: "en-GB",
  lastUpdated: true,
  sitemap: {
    hostname: site,
    // VitePress writes paths relative to the domain; prepend the project base.
    transformItems: (items) =>
      items.map((item) => ({
        ...item,
        url: `${sitemapPrefix}/${item.url.replace(/^\//, "")}`,
      })),
  },
  head: [
    ["link", { rel: "icon", href: `${base}logo.svg` }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Year Planner for React" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "A 12–36 month, 37-column year planning grid for React, with fit-to-host geometry, CSS-variable theming and A3 print output.",
      },
    ],
    ["meta", { property: "og:image", content: `${site}${base}screenshots/full-demo.png` }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],
  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Year Planner",
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Tutorials", link: "/tutorials/first-planner" },
      { text: "How-to", link: "/how-to/fit-to-host" },
      { text: "Examples", link: "/examples/" },
      { text: "Storybook", link: storybook },
      { text: "API", link: api },
    ],
    sidebar: {
      "/": [
        {
          text: "Start",
          items: [
            { text: "Overview", link: "/getting-started" },
            { text: "Sizing and fit", link: "/getting-started#sizing-and-fit" },
            { text: "Story index", link: "/stories" },
          ],
        },
        {
          text: "Tutorials",
          items: [
            { text: "Your first planner", link: "/tutorials/first-planner" },
            { text: "Controlled commands", link: "/tutorials/controlled-commands" },
            { text: "Theming and adapters", link: "/tutorials/theming-and-adapters" },
            { text: "Print an A3 plan", link: "/tutorials/print-a3-plan" },
          ],
        },
        {
          text: "How-to",
          items: [
            { text: "Fit the grid to a host", link: "/how-to/fit-to-host" },
            { text: "Host-owned context menu", link: "/how-to/context-menu" },
            { text: "Custom inspector", link: "/how-to/custom-inspector" },
          ],
        },
        {
          text: "Examples",
          items: [
            { text: "All examples", link: "/examples/" },
            { text: "Full construction demo", link: "/examples/full-demo" },
            { text: "Interactive demo", link: "/examples/interactive" },
            { text: "Themes", link: "/examples/themes" },
            { text: "Print", link: "/examples/print" },
            { text: "Design systems", link: "/examples/adapters" },
          ],
        },
        {
          text: "Guide",
          items: [
            { text: "Classic year layout", link: "/classic-year-layout" },
            { text: "Dynamic months", link: "/dynamic-months" },
            { text: "Localization", link: "/localization" },
            { text: "Theming", link: "/theming" },
            { text: "Interaction", link: "/interaction" },
            { text: "Controlled commands", link: "/commands" },
            { text: "Print", link: "/print" },
            { text: "Accessibility", link: "/accessibility" },
            { text: "Security", link: "/security" },
            { text: "Performance", link: "/performance" },
            { text: "Limitations", link: "/limitations" },
            { text: "Migration", link: "/migration" },
          ],
        },
        {
          text: "Project",
          items: [
            { text: "License", link: "/licensing" },
            { text: "Architecture", link: "/architecture" },
            { text: "Benchmarks", link: "/benchmarks/rd13-baseline" },
            { text: "Test report", link: "/test-report" },
            { text: "ADRs", link: "/adr/0001-renderer-strategy" },
            { text: "Documentation map", link: "/README" },
          ],
        },
      ],
    },
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/blendsdk/year-planner" }],
    editLink: {
      pattern: "https://github.com/blendsdk/year-planner/edit/main/docs/:path",
      text: "Edit this page",
    },
    footer: {
      message: "Free for internal use. Built with VitePress, Storybook and TypeDoc.",
      copyright: "Copyright © 2026 blendsdk",
    },
    outline: { level: [2, 3] },
  },
  vite: {
    server: {
      proxy: {
        // VitePress dev: proxy the production Storybook path to the local
        // Storybook server. The built site serves the real /storybook folder.
        "/year-planner/storybook": {
          target: "http://127.0.0.1:6006",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/year-planner\/storybook/, ""),
        },
      },
    },
  },
});
