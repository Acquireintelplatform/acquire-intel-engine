// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// IMPORTANT: these paths use the aliases we set in vite.config.ts
import DashboardView from "@views/DashboardView";
import DealFlowView from "@views/DealFlowView";
import GoogleMapsView from "@views/GoogleMapsView";
import OperatorMatchingView from "@views/OperatorMatchingView";

export default function App() {
  console.log("MAIN TSX IS RUNNING (sanity shell)");
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardView />} />
        <Route path="/deal-flow" element={<DealFlowView />} />
        <Route path="/google-maps-engine" element={<GoogleMapsView />} />
        <Route path="/operator-matching" element={<OperatorMatchingView />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
