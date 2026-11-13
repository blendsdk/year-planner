import { createTheme, YearPlanner, YearPlannerProvider } from "@blendsdk/react-year-planner";
import { fluentThemeToCssVars } from "@blendsdk/react-year-planner/adapters/fluent";
import { muiThemeToCssVars } from "@blendsdk/react-year-planner/adapters/mui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { describeStories } from "./describe";
import { baseItems, groups, layers, resources } from "./fixtures";

const meta = {
  title: "Year Planner/08 Design-System Token Adapters",
  component: YearPlanner,
  args: {
    year: 2027,
    groups,
    layers,
    resources,
    items: baseItems,
    display: { theme: "classic-blue", showISOWeekNumbers: true },
  },
} satisfies Meta<typeof YearPlanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FluentTokens: Story = {
  args: {
    cssVars: fluentThemeToCssVars({
      colorNeutralBackground1: "#ffffff",
      colorNeutralBackground2: "#f3f2f1",
      colorNeutralForeground1: "#242424",
      colorNeutralForeground2: "#616161",
      colorNeutralStroke1: "#d1d1d1",
      colorBrandBackground: "#0f6cbd",
      colorPaletteYellowBackground2: "#fff4ce",
      fontFamilyBase: "Segoe UI, sans-serif",
      fontSizeBase300: "14px",
      fontWeightRegular: 400,
    }),
  },
};

export const MuiTokens: Story = {
  args: {
    cssVars: muiThemeToCssVars({
      palette: {
        primary: { main: "#1976d2" },
        background: { default: "#fafafa", paper: "#ffffff" },
        text: { primary: "#212121", secondary: "#757575" },
        divider: "#bdbdbd",
      },
      typography: { fontFamily: "Roboto, sans-serif", fontSize: 14 },
    }),
  },
};

export const FluentWrapper: Story = {
  render: (args) => (
    <YearPlannerProvider theme={createTheme({ ribbon: "#0f6cbd" })}>
      <YearPlanner {...args} cssVars={fluentThemeToCssVars({ colorBrandBackground: "#0f6cbd" })} />
    </YearPlannerProvider>
  ),
};

export const MuiWrapper: Story = {
  render: (args) => (
    <YearPlannerProvider theme={createTheme({ ribbon: "#1976d2" })}>
      <YearPlanner
        {...args}
        cssVars={muiThemeToCssVars({ palette: { primary: { main: "#1976d2" } } })}
      />
    </YearPlannerProvider>
  ),
};

export const FluentAndMuiMerged: Story = {
  args: {
    cssVars: {
      ...fluentThemeToCssVars({ colorBrandBackground: "#0f6cbd" }),
      ...muiThemeToCssVars({ palette: { primary: { main: "#7b1fa2" } } }),
    },
  },
};

export const ProviderWithCustomTheme: Story = {
  render: (args) => (
    <YearPlannerProvider
      theme={createTheme({
        ribbon: "#6b4fa1",
        weekend: "#fff3e0",
        selectionOutline: "#d13438",
        fontFamily: "Georgia, serif",
        fontSize: 15,
      })}
    >
      <YearPlanner {...args} />
    </YearPlannerProvider>
  ),
};

export const CustomCssVariableSet: Story = {
  args: {
    cssVars: {
      "--yp-surface": "#fffef7",
      "--yp-surface-muted": "#fbf7ea",
      "--yp-border": "#8b7d5b",
      "--yp-text-primary": "#2f2a20",
      "--yp-ribbon": "#b08968",
      "--yp-highlight": "#ffe8a3",
    },
  },
};

export const DarkSurfaces: Story = {
  args: {
    cssVars: {
      "--yp-surface": "#1f2937",
      "--yp-surface-muted": "#111827",
      "--yp-weekend": "#263447",
      "--yp-context": "#1b2534",
      "--yp-border": "#64748b",
      "--yp-text-primary": "#f8fafc",
      "--yp-text-muted": "#cbd5e1",
      "--yp-ribbon": "#2563eb",
      "--yp-highlight": "#eab308",
    },
  },
};

describeStories({
  FluentTokens,
  MuiTokens,
  FluentWrapper,
  MuiWrapper,
  FluentAndMuiMerged,
  ProviderWithCustomTheme,
  CustomCssVariableSet,
  DarkSurfaces,
});
