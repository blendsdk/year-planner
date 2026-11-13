import type { LaneCandidate } from "./types.js";

function durationCompare(left: LaneCandidate, right: LaneCandidate): number {
  if (left.sourceDays !== right.sourceDays) return right.sourceDays - left.sourceDays;
  if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
  if (left.displayPriority !== right.displayPriority) {
    return right.displayPriority - left.displayPriority;
  }
  if (left.item.id === right.item.id) return 0;
  return left.item.id < right.item.id ? -1 : 1;
}

function compareCandidates(left: LaneCandidate, right: LaneCandidate): number {
  if (left.fragment.clippedStart !== right.fragment.clippedStart) {
    return left.fragment.clippedStart < right.fragment.clippedStart ? -1 : 1;
  }
  return durationCompare(left, right);
}

/**
 * Assigns deterministic lanes to one row's ribbon candidates.
 *
 * Candidates are sorted by clipped start, source duration, layer order,
 * display priority and item ID. A candidate reuses the previous row's lane when
 * free, otherwise it takes the lowest free lane.
 *
 * @param candidates - Ribbon fragments for one row with their item metadata.
 * @param previousLanes - Lanes used by the same items in the previous row.
 * @returns A map from fragment ID to zero-based lane.
 */
export function assignLanes(
  candidates: LaneCandidate[],
  previousLanes: ReadonlyMap<string, number>,
): ReadonlyMap<string, number> {
  const sorted = [...candidates].sort(compareCandidates);
  // Intervals in one lane never overlap, so the maximum end in the lane is the
  // only value needed to decide whether the lane is free at a new start.
  const laneMaxEnd: number[] = [];
  const assignment = new Map<string, number>();
  for (const candidate of sorted) {
    const start = candidate.fragment.startColumn;
    const end = candidate.fragment.endColumnExclusive;
    const preferred = previousLanes.get(candidate.fragment.itemId);
    let lane: number | undefined;
    if (preferred !== undefined && (laneMaxEnd[preferred] ?? Number.NEGATIVE_INFINITY) <= start) {
      lane = preferred;
    } else {
      lane = 0;
      while ((laneMaxEnd[lane] ?? Number.NEGATIVE_INFINITY) > start) lane += 1;
    }
    laneMaxEnd[lane] = Math.max(laneMaxEnd[lane] ?? Number.NEGATIVE_INFINITY, end);
    assignment.set(candidate.fragment.fragmentId, lane);
  }
  return assignment;
}
