"use client";

import { useParams } from "next/navigation";
import type { Version } from "./versions";

export { VERSIONS, stripVersion, type Version } from "./versions";

/**
 * Two versions of the site share every page; only the navigation, the home and the gate differ.
 * V1 = Mockup V1 (inline nav bar), V2 = Mockup V2 (sticky header, menu as an overlay).
 * Routes: /v1/... and /v2/...; "/" is the chooser.
 */
export function useVersion(): Version {
  const p = useParams<{ version?: string }>();
  return p?.version === "v2" ? "v2" : "v1";
}

/** Prefix an internal path with the current version: "/about" → "/v2/about", "/" → "/v2". */
export function useVHref() {
  const v = useVersion();
  return (path: string) => (/^(https?:|mailto:|tel:)/.test(path) ? path : `/${v}${path === "/" ? "" : path}`);
}
