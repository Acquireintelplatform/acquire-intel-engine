// src/router/index.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * We lazy-load views. For a couple of files we try two casings (e.g. DealFlowView vs dealflowview)
 * so we don't break your build if the file is named with different casing.
 */
function lazyEither<T = any>(paths: Array<() => Promise<{ default: React.ComponentType<any> }>>) {
  return lazy(async () => {
    for (const fn of paths) {
      try {
        return await fn();
      } catch (_e) {
        // try next path
      }
    }
    throw new Error("View not found for any of the attempted import paths.");
  });
}

// Known views (with case-safe fallbacks where useful)
const DashboardView = lazyEither([
  () => import("@/views/DashboardView"),
  () => import("@/views/dashboardview"),
]);

const DealFlowView = lazyEither([
  () => import("@/views/DealFlowView"),
  () => import("@/views/dealflowview"),
]);

const GoogleMapsEngineView = lazyEither([
  () => import("@/views/GoogleMapsEngineView"),
  () => import("@/views/GoogleMapsEngine"),
  () => import("@/views/googlemapsengineview"),
]);

// ✅ New page you added earlier
const OperatorMatchingView = lazy(() => import("@/views/OperatorMatchingView"));

function Loading() {
  return <div className="p-6 text-slate-300">Loading…</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* main sections */}
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/deal-flow" element={<DealFlowView />} />
          <Route path="/google-maps-engine" element={<GoogleMapsEngineView />} />

          {/* new route */}
          <Route path="/operator-matching" element={<OperatorMatchingView />} />

          {/* default / unknown -> dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
