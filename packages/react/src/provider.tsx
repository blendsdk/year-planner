import { createContext, type FC, type ReactNode, useContext, useMemo } from "react";
import { createTheme, type YearPlannerTheme } from "./theme.js";

const ThemeContext = createContext<YearPlannerTheme | undefined>(undefined);

/**
 * Reads the nearest provider theme, if any.
 * @public
 */
export function useYearPlannerTheme(): YearPlannerTheme | undefined {
  return useContext(ThemeContext);
}

/**
 * Optional theme provider. It supplies defaults to descendant planners; the
 * component works without a provider because themes render as CSS variables.
 *
 * @example
 * ```tsx
 * <YearPlannerProvider theme={createTheme({ ribbon: "#8358c6" })}>
 *   <YearPlanner year={2027} />
 * </YearPlannerProvider>
 * ```
 * @public
 */
export const YearPlannerProvider: FC<{
  /** Partial theme merged over `classic-blue`. */
  theme?: Partial<YearPlannerTheme>;
  /** Descendant planners that receive the theme. */
  children: ReactNode;
}> = ({ theme, children }) => {
  const value = useMemo(() => (theme ? createTheme(theme) : undefined), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
