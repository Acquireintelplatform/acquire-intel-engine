// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, NavLink } from "react-router-dom";

/** Try multiple import paths so we don't explode on filename casing differences */
function lazyEither(paths: Array<() => Promise<{ default: React.ComponentType<any> }>>) {
  return lazy(async () => {
    const errors: unknown[] = [];
    for (const fn of paths) {
      try {
        return await fn();
      } catch (e) {
        errors.push(e);
        // try next
      }
    }
    // Last resort: throw the first error so Vite reports something meaningful
    throw errors[0] ?? new Error("View not found for any attempted import paths.");
  });
}

/** Known views (with case-safe fallbacks) */
const DashboardView = lazyEither([
  () => import("./views/DashboardView"),
  () => import("./views/dashboardview"),
]);

const DealFlowView = lazyEither([
  () => import("./views/DealFlowView"),
  () => import("./views/dealflowview"),
]);

const RequirementsView = lazyEither([
  () => import("./views/RequirementsView"),
  () => import("./views/requirementsview"),
]);

const DistressSignalsView = lazyEither([
  () => import("./views/DistressSignalsView"),
  () => import("./views/distresssignalsview"),
]);

const GoogleMapsView = lazyEither([
  () => import("./views/GoogleMapsView"),
  () => import("./views/GoogleMapsEngineView"),
  () => import("./views/googlemapsview"),
  () => import("./views/googlemapsengineview"),
]);

/** ✅ New page (we created this exact filename earlier) */
const OperatorMatchingView = lazy(() => import("./views/OperatorMatchingView"));

function Loading() {
  return <div className="p-6 text-slate-300">Loading…</div>;
}

/** Simple premium-ish sidebar using existing utility classes */
function Sidebar() {
  const item = "rounded-xl px-3 py-2 border border-white/10 hover:border-teal-400/40 hover:bg-white/5";
  const active = "border-teal-400/70 bg-white/5";
  return (
    <aside className="w-64 p-4 border-r border-white/10 min-h-screen sticky top-0">
      <div className="font-extrabold tracking-wide mb-4">ACQUIRE INTEL</div>
      <nav className="grid gap-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Dashboard</NavLink>
        <NavLink to="/deal-flow" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Deal Flow</NavLink>
        <NavLink to="/distress-signals" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Distress Signals</NavLink>
        <NavLink to="/requirements" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Requirements</NavLink>
        <NavLink to="/google-maps-engine" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Google Maps Engine</NavLink>
        {/* ✅ New link */}
        <NavLink to="/operator-matching" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Operator Matching</NavLink>
      </nav>
      <div className="mt-6 text-xs opacity-60">
        API: <a className="underline" href="https://acquire-intel-api.onrender.com/api/health" target="_blank" rel="noreferrer">/api/health</a>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardView />} />
              <Route path="/deal-flow" element={<DealFlowView />} />
              <Route path="/requirements" element={<RequirementsView />} />
              <Route path="/distress-signals" element={<DistressSignalsView />} />
              <Route path="/google-maps-engine" element={<GoogleMapsView />} />

              {/* ✅ New route */}
              <Route path="/operator-matching" element={<OperatorMatchingView />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}
