// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";

/**
 * Safe lazy imports. If any view crashes, the ErrorBoundary shows it
 * without blanking the whole UI.
 * If your views are in src/views and default-export a component, this works.
 */
const DashboardView = lazy(() => import("./views/DashboardView"));
const DealFlowView = lazy(() => import("./views/DealFlowView"));
const GoogleMapsView = lazy(() => import("./views/GoogleMapsView"));
const OperatorMatchingView = lazy(() => import("./views/OperatorMatchingView"));
const OperatorRequirementsView = lazy(() => import("./views/RequirementsView"));
const DistressSignalsView = lazy(() => import("./views/DistressSignalsView"));

/* ——— Minimal error boundary (shows message instead of blank) ——— */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 16, color: "#ffb3b3" }}>
          <h2>Component failed to render</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ——— Sidebar layout (premium teal glow, fixed left) ——— */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={wrap}>
      <aside style={sidebar} className="teal-glow">
        <div style={brand}>Acquire Intel</div>
        <nav style={nav}>
          <Group>Dashboard</Group>
          <Item to="/dashboard" label="Dashboard" />
          <Group>AI Intelligence</Group>
          <Item to="/live-alerts" label="Live Alerts (placeholder)" />
          <Item to="/industry-news" label="Industry News (placeholder)" />
          <Group>Deal Flow</Group>
          <Item to="/deal-flow" label="Deal Flow" />
          <Group>Distress & Risk</Group>
          <Item to="/distress-signals" label="Distress Signals" />
          <Group>Acquisition Pipeline</Group>
          <Item to="/property-search" label="Property Search (placeholder)" />
          <Item to="/property-feeds" label="Property Feeds (placeholder)" />
          <Item to="/google-maps-engine" label="Google Maps Engine" />
          <Group>Operators</Group>
          <Item to="/operator-matching" label="Operator Matching" />
          <Item to="/operator-requirements" label="Requirements" />
          <Group>Admin</Group>
          <Item to="/agents" label="Agents & Landlords (placeholder)" />
          <Item to="/scraper-status" label="Scraper Status (placeholder)" />
          <Item to="/system-health" label="System Health (placeholder)" />
        </nav>
      </aside>
      <main style={content}>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Suspense>
      </main>
    </div>
  );
}

/* ——— Small helpers for the sidebar ——— */
function Group({ children }: { children: React.ReactNode }) {
  return <div style={group}>{children}</div>;
}
function Item({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...item,
        background: isActive ? "rgba(0,255,255,0.12)" : "transparent",
        borderColor: isActive ? "rgba(0,255,255,0.25)" : "rgba(255,255,255,0.08)",
        color: isActive ? "#e6ffff" : "#cfeeee",
        fontWeight: isActive ? 800 : 600,
      })}
    >
      {label}
    </NavLink>
  );
}

/* ——— Routes ——— */
export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/deal-flow" element={<DealFlowView />} />
          <Route path="/google-maps-engine" element={<GoogleMapsView />} />
          <Route path="/operator-matching" element={<OperatorMatchingView />} />
          <Route path="/operator-requirements" element={<OperatorRequirementsView />} />
          <Route path="/distress-signals" element={<DistressSignalsView />} />

          {/* Lightweight placeholders for pages not wired yet */}
          <Route path="/live-alerts" element={<Placeholder title="Live Alerts" />} />
          <Route path="/industry-news" element={<Placeholder title="Industry News" />} />
          <Route path="/property-search" element={<Placeholder title="Property Search" />} />
          <Route path="/property-feeds" element={<Placeholder title="Property Feeds" />} />
          <Route path="/agents" element={<Placeholder title="Agents & Landlords" />} />
          <Route path="/scraper-status" element={<Placeholder title="Scraper Status" />} />
          <Route path="/system-health" element={<Placeholder title="System Health" />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

/* ——— Lightweight placeholder page ——— */
function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p>Placeholder route while we finish wiring this page.</p>
    </div>
  );
}

/* ——— Inline styles (premium teal/glow, consistent spacing) ——— */
const wrap: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  height: "100vh",
  background: "linear-gradient(180deg, #081317 0%, #0a1013 100%)",
  color: "#e6ffff",
};
const sidebar: React.CSSProperties = {
  padding: 16,
  borderRight: "1px solid rgba(255,255,255,0.06)",
  overflowY: "auto",
};
const brand: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 12,
  color: "#cfffff",
  letterSpacing: 0.4,
};
const nav: React.CSSProperties = {
  display: "grid",
  gap: 6,
};
const group: React.CSSProperties = {
  marginTop: 14,
  marginBottom: 4,
  fontSize: 12,
  opacity: 0.8,
  textTransform: "uppercase",
  letterSpacing: 0.7,
};
const item: React.CSSProperties = {
  display: "block",
  padding: "9px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.08)",
  textDecoration: "none",
  transition: "all 120ms ease",
};

/* Content area */
const content: React.CSSProperties = {
  overflowY: "auto",
  padding: 16,
};
