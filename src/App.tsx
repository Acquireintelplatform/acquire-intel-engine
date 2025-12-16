// src/App.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

// Lazy-load views using the vite alias you already set in vite.config.ts
const DashboardView = lazy(() => import("@views/DashboardView"));
const DealFlowView = lazy(() => import("@views/DealFlowView"));
const GoogleMapsView = lazy(() => import("@views/GoogleMapsView"));
const OperatorMatchingView = lazy(() => import("@views/OperatorMatchingView"));

// Simple loading state while chunks load
function Loading() {
  return (
    <div style={{ padding: 24 }}>Loading…</div>
  );
}

// Hard error boundary so a crashing page doesn't blank the app
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: "#ffb3b3" }}>
          <h2>Component failed to render</h2>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div style={{ marginTop: 12 }}>
            <Link to="/dashboard">Go to dashboard</Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  console.log("MAIN TSX IS RUNNING (sanity shell)");
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/deal-flow" element={<DealFlowView />} />
            <Route path="/google-maps-engine" element={<GoogleMapsView />} />
            <Route path="/operator-matching" element={<OperatorMatchingView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
