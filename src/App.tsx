// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Use your Vite aliases (vite.config.ts) so the paths always resolve on Render
import Sidebar from "@layout/Sidebar";
import DashboardView from "@views/DashboardView";
import DealFlowView from "@views/DealFlowView";
import GoogleMapsView from "@views/GoogleMapsView";
import OperatorMatchingView from "@views/OperatorMatchingView";

export default function App() {
  console.log("MAIN TSX IS RUNNING (sanity shell)");
  return (
    <BrowserRouter>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ padding: "16px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/deal-flow" element={<DealFlowView />} />
            <Route path="/google-maps-engine" element={<GoogleMapsView />} />
            <Route path="/operator-matching" element={<OperatorMatchingView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
