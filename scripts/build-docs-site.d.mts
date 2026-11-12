/** Returns the relative `src` and `href` URLs in an HTML document. */
export function collectRelativeUrls(html: string): string[];

/** Verifies an existing docs-site artifact and returns its errors. */
export function verifyArtifact(root: string): string[];

/** Builds the artifact, or verifies it when `checkOnly` is true. */
export function buildDocsSite(root: string, checkOnly: boolean): boolean;
