// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from "react-router-dom";

// Views (keep these imports exactly as your project uses them)
import DashboardView from "./views/DashboardView";
import DealFlowView from "./views/DealFlowView";
import GoogleMapsView from "./views/GoogleMapsView";
import OperatorMatchingView from "./views/OperatorMatchingView";

// Sidebar lives in src/layout/Sidebar.tsx (we'll fix it in Step 2 if needed)
import Sidebar from "./layout/Sidebar";

function LayoutShell() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
      <aside
        style={{
          background: "#071922",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          padding: "16px",
          overflowY: "auto",
        }}
      >
        <Sidebar />
      </aside>

      <main style={{ background: "#041219", padding: "24px 28px" }}>
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  // sanity log so we know this file is the one running
  console.log("APP shell mounted");
  return (
    <BrowserRouter>
      <Routes>
        {/* Shell with sidebar */}
        <Route element={<LayoutShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/deal-flow" element={<DealFlowView />} />
          <Route path="/google-maps-engine" element={<GoogleMapsView />} />
          <Route path="/operator-matching" element={<OperatorMatchingView />} />
          {/* 404 -> dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
