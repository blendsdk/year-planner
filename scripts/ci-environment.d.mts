/** One browser launcher used by the environment capture. */
export interface BrowserLauncher {
  version(): string;
  close(): Promise<void>;
}

/** Collects the Node, OS, CPU, Playwright and browser versions. */
export function collectEnvironment(
  launchers?: Record<string, () => Promise<BrowserLauncher>>,
): Promise<Record<string, string>>;

/** Renders the key/value evidence file. */
export function renderEnvironment(environment: Record<string, string>): string;
