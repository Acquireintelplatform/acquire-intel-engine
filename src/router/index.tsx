// src/router/index.tsx
/**
 * Router shim to avoid build-time import failures.
 * Your app uses App.tsx for real routing; this file is kept minimal on purpose.
 * We removed any imports that referenced non-existent paths (e.g., dashboardview).
 *
 * Why: Vite failed because this file imported views that aren't present with the
 * exact casing. This shim guarantees a clean build until we wire routes in App.tsx.
 */
import React from "react";

export default function AppRouter(): JSX.Element {
  // Intentionally a no-op component so it won't break builds if imported.
  return <></>;
}
