// src/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";

const item =
  "block w-full text-left rounded-xl px-4 py-3 mb-3 bg-[#0e2326] hover:bg-[#123136] border border-[#18454b] transition";
const active =
  "ring-2 ring-[#3de0b8]";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="uppercase text-xs tracking-wider text-[#7dddc8] mb-2">
        {title}
      </div>
      {children}
    </div>
  );
}

function Nav({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${item} ${isActive ? active : ""}`}
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-full md:w-72 p-4 text-[#ccf8ee]">
      <h1 className="text-2xl font-bold mb-6">Acquire Intel</h1>

      <Section title="Dashboard">
        <Nav to="/dashboard" label="Dashboard" />
      </Section>

      <Section title="AI Intelligence">
        <Nav to="/live-alerts" label="Live Alerts" />
        <Nav to="/industry-news" label="Industry News" />
      </Section>

      <Section title="Deal Flow">
        <Nav to="/deal-flow" label="Deal Flow" />
      </Section>

      <Section title="Distress & Risk">
        <Nav to="/distress-signals" label="Distress Signals" />
      </Section>

      <Section title="Acquisition Pipeline">
        <Nav to="/property-search" label="Property Search" />
        <Nav to="/property-feeds" label="Property Feeds" />
        <Nav to="/google-maps-engine" label="Google Maps Engine" />
      </Section>

      <Section title="Operators">
        <Nav to="/operator-matching" label="Operator Matching" />
        <Nav to="/operator-requirements" label="Requirements" />
      </Section>
    </aside>
  );
}
