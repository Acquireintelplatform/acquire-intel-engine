// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";

/**
 * Auto-import all view files under ./views to avoid hardcoded, case-sensitive imports.
 * Vite will provide functions we can call to dynamically import each file.
 */
const viewModules = import.meta.glob("./views/**/*.{tsx,ts,jsx,js}");

type Mod = { default: React.ComponentType<any> };

/** Find a module whose path ends with one of the candidate basenames (case-insensitive). */
function findModuleByBasenames(candidates: string[]): (() => Promise<Mod>) | null {
  const keys = Object.keys(viewModules);
  for (const base of candidates) {
    const needle = `/${base}`.toLowerCase();
    const match = keys.find((k) => k.toLowerCase().endsWith(`${needle}.tsx`)
      || k.toLowerCase().endsWith(`${needle}.ts`)
      || k.toLowerCase().endsWith(`${needle}.jsx`)
      || k.toLowerCase().endsWith(`${needle}.js`));
    if (match) return viewModules[match] as () => Promise<Mod>;
  }
  return null;
}

/** Safe lazy that returns a placeholder component if nothing is found. */
function safeLazy(candidates: string[], label: string) {
  const loader = findModuleByBasenames(candidates);
  if (loader) {
    return lazy(loader);
  }
  // Fallback: keep build green and show a helpful message at runtime.
  return lazy(async () => ({
    default: function MissingView() {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-2">View not found</h1>
          <div className="opacity-80">
            Could not locate any of: <code>{candidates.join(", ")}</code> in <code>src/views/</code>.
          </div>
        </div>
      );
    },
  }));
}

/** Views (multiple case-safe candidates for each) */
const DashboardView = safeLazy(["DashboardView", "dashboardview", "Dashboard"], "Dashboard");
const DealFlowView = safeLazy(["DealFlowView", "dealflowview", "DealFlow"], "Deal Flow");
const RequirementsView = safeLazy(["RequirementsView", "requirementsview", "Requirements"], "Requirements");
const DistressSignalsView = safeLazy(["DistressSignalsView", "distresssignalsview", "DistressSignals"], "Distress Signals");
const GoogleMapsView = safeLazy(
  ["GoogleMapsView", "GoogleMapsEngineView", "googlemapsview", "googlemapsengineview", "GoogleMapsEngine"],
  "Google Maps Engine"
);
/** ✅ This one we just added earlier */
const OperatorMatchingView = safeLazy(["OperatorMatchingView"], "Operator Matching");

function Loading() {
  return <div className="p-6 text-slate-300">Loading…</div>;
}

/** Simple premium sidebar */
function Sidebar() {
  const item =
    "rounded-xl px-3 py-2 border border-white/10 hover:border-teal-400/40 hover:bg-white/5";
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
        {/* ✅ New */}
        <NavLink to="/operator-matching" className={({ isActive }) => `${item} ${isActive ? active : ""}`}>Operator Matching</NavLink>
      </nav>
      <div className="mt-6 text-xs opacity-60">
        API:{" "}
        <a
          className="underline"
          href="https://acquire-intel-api.onrender.com/api/health"
          target="_blank"
          rel="noreferrer"
        >
          /api/health
        </a>
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
