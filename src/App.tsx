// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

/** Minimal error boundary so we see real crash messages on screen */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string; stack?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: any) {
    return { hasError: true, message: String(err?.message ?? err), stack: String(err?.stack ?? "") };
  }
  componentDidCatch(err: any) {
    console.error("App ErrorBoundary caught:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2 style={{ color: "#ff6b6b" }}>Something broke in the UI</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.message}</pre>
          <details>
            <summary>Stack</summary>
            <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.stack}</pre>
          </details>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/** Small debug banner: pings your API health and shows status */
function ApiBanner() {
  const [msg, setMsg] = React.useState("Checking API…");
  const API =
    (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") ||
    "https://acquire-intel-api.onrender.com";

  React.useEffect(() => {
    fetch(`${API}/api/health`)
      .then((r) => r.json())
      .then((j) => setMsg(`API: ok • base: ${API}`))
      .catch((e) => setMsg(`API: ERROR • base: ${API} • ${String(e)}`));
  }, [API]);

  return (
    <div style={{ padding: 8, fontSize: 12, opacity: 0.8 }}>
      {msg}
    </div>
  );
}

/** ---- Import ONLY the Deal Flow view for now ----
 * The file name is PascalCase: src/views/DealFlowView.tsx
 */
import DealFlowView from "./views/DealFlowView";

/** Tiny placeholders so routes exist but don’t import heavy code yet */
function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>{title}</h2>
      <p>Placeholder route (kept minimal while we debug).</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div style={{ padding: 16 }}>
          <h1 style={{ marginBottom: 8 }}>ACQUIRE INTEL</h1>
          <ApiBanner />
          <nav style={{ display: "flex", gap: 12, margin: "12px 0" }}>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/deal-flow">Deal Flow</Link>
            <Link to="/google-maps-engine">Google Maps</Link>
            <Link to="/operator-matching">Operator Matching</Link>
          </nav>

          <Routes>
            {/* Keep only Deal Flow as the real page */}
            <Route path="/deal-flow" element={<DealFlowView />} />

            {/* Lightweight placeholders for the rest while we debug */}
            <Route path="/dashboard" element={<Placeholder title="Dashboard" />} />
            <Route path="/google-maps-engine" element={<Placeholder title="Google Maps" />} />
            <Route path="/operator-matching" element={<Placeholder title="Operator Matching" />} />

            {/* Default -> Deal Flow */}
            <Route path="/" element={<Navigate to="/deal-flow" replace />} />
            <Route path="*" element={<Placeholder title="Not found" />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
