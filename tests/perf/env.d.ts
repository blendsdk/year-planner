interface Window {
  __YP_BENCH__?: {
    ready: boolean;
    readyMs: number;
    itemCount: number;
    months: number;
    domNodes: number;
  };
  __YP_FRAMES__?: {
    deltas: number[];
    longTasks: { start: number; duration: number }[];
    inputDelays: number[];
  };
  __YP_RUNNING__?: boolean;
}
