/** Options for the branch-protection command. */
export interface ProtectionOptions {
  mode: "check" | "apply";
  repo?: string;
  record: boolean;
}

/** Runs the protection check or apply and returns the exit code. */
export declare function run(options: ProtectionOptions): number;
