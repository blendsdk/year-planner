import type { PlannerMessages } from "@blendsdk/react-year-planner";

/**
 * Types one translation catalogue against the planner contract.
 *
 * Using this helper instead of a plain object keeps every locale complete at
 * compile time: adding a message to the planner breaks the build until every
 * language supplies it.
 *
 * @param messages - Complete translation catalogue.
 * @returns The same catalogue, typed.
 */
export function defineMessages(messages: PlannerMessages): PlannerMessages {
  return messages;
}
