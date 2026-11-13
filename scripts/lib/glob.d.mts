/** Directories that never contribute to browser planning or fingerprints. */
export const IGNORED_DIRECTORIES: Set<string>;

/** Converts a glob pattern into an anchored regular expression. */
export declare function globToRegExp(pattern: string): RegExp;

/** Reports whether a path matches any pattern. */
export declare function matchesAny(patterns: Iterable<string>, path: string): boolean;

/** Expands repository-relative globs into existing files. */
export declare function expandPatterns(root: string, patterns: Iterable<string>): string[];
