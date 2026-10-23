/** Shared by server (static params) and client (hooks in lib/version.ts). V1 = inline nav, V2 = overlay nav. */
export const VERSIONS = ["v1", "v2"] as const;
export type Version = (typeof VERSIONS)[number];

/** "/v2/mixers/x" → "/mixers/x" (for matching the current page and its accent). */
export const stripVersion = (path: string) => path.replace(/^\/v[12](?=\/|$)/, "") || "/";
