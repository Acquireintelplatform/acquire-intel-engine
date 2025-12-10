// src/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import "./sidebar.css";

function Item({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "ai-link" + (isActive ? " is-active" : "")}
    >
      {children}
    </NavLink>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ai-group">
      <div className="ai-group-title">{title}</div>
      <div className="ai-group-items">{children}</div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <div className="ai-sb">
      <div className="ai-brand">ACQUIRE INTEL</div>

      <nav className="ai-nav">
        <Group title="DASHBOARD">
          <Item to="/dashboard">Dashboard</Item>
        </Group>

        <Group title="AI INTELLIGENCE">
          <Item to="/live-alerts">Live Alerts</Item>
          <Item to="/industry-news">Industry News</Item>
        </Group>

        <Group title="DEAL FLOW">
          <Item to="/deal-flow">Deal Flow</Item>
        </Group>

        <Group title="DISTRESS & RISK">
          <Item to="/distress-signals">Distress Signals</Item>
        </Group>

        <Group title="ACQUISITION PIPELINE">
          <Item to="/property-search">Property Search</Item>
          <Item to="/property-feeds">Property Feeds</Item>
          <Item to="/map-insights">Map Insights</Item>
          <Item to="/google-maps-engine">Google Maps Engine</Item>
        </Group>

        <Group title="OPERATORS">
          <Item to="/operator-matching">Operator Matching</Item>
          <Item to="/requirements">Requirements</Item>
        </Group>

        <Group title="ADMIN">
          <Item to="/agents">Agents & Landlords</Item>
          <Item to="/scraper-status">Scraper Status</Item>
          <Item to="/health">System Health</Item>
        </Group>
      </nav>

      <div className="ai-sys">● System Online</div>
    </div>
  );
}
