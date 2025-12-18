// src/layout/SideNav.tsx
import { NavLink } from "react-router-dom";

function Item({
  to,
  label,
}: {
  to: string;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block w-full rounded-xl px-4 py-4 transition",
          "border border-teal-900/30 bg-slate-900/40",
          isActive
            ? "ring-1 ring-teal-400/60 text-teal-200"
            : "hover:bg-slate-900/70 text-slate-200",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function SideNav() {
  return (
    <aside className="h-full w-[300px] shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-6 text-2xl font-bold tracking-wide text-teal-300">
        Acquire Intel
      </div>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Dashboard
        </div>
        <div className="space-y-3">
          <Item to="/dashboard" label="Dashboard" />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          AI Intelligence
        </div>
        <div className="space-y-3">
          <Item to="/live-alerts" label="Live Alerts" />
          <Item to="/industry-news" label="Industry News" />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Deal Flow
        </div>
        <div className="space-y-3">
          <Item to="/deal-flow" label="Deal Flow" />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Distress & Risk
        </div>
        <div className="space-y-3">
          <Item to="/distress-signals" label="Distress Signals" />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Acquisition Pipeline
        </div>
        <div className="space-y-3">
          <Item to="/property-search" label="Property Search" />
          <Item to="/property-feeds" label="Property Feeds" />
          <Item to="/google-maps-engine" label="Google Maps Engine" />
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Operators
        </div>
        <div className="space-y-3">
          <Item to="/operator-matching" label="Operator Matching" />
          <Item to="/operator-requirements" label="Requirements" />
        </div>
      </section>

      <section className="mb-2">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Admin
        </div>
        <div className="space-y-3">
          <Item to="/settings" label="Settings" />
          <Item to="/system-health" label="System Health" />
          <Item to="/scraper-status" label="Scraper Status" />
        </div>
      </section>
    </aside>
  );
}
