// src/App.tsx
//-------------------------------------------------------------
// Acquire Intel — Application Shell + Router
//-------------------------------------------------------------
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "@layout/sidebar";
import DashboardView from "@views/DashboardView";
import DealFlowView from "@views/DealFlowView";
import GoogleMapsView from "@views/GoogleMapsView";
import OperatorMatchingView from "@views/OperatorMatchingView";
import OperatorRequirementsView from "@views/OperatorRequirementsView";
import "./index.css"; // ✅ FIXED path

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh", background: "#001018" }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />

            {/* Core routes */}
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/deal-flow" element={<DealFlowView />} />
            <Route path="/google-maps-engine" element={<GoogleMapsView />} />

            {/* Operators */}
            <Route path="/operator-matching" element={<OperatorMatchingView />} />
            <Route path="/operator-requirements" element={<OperatorRequirementsView />} />

            {/* Fallback */}
            <Route path="*" element={<div style={{ padding: "2rem" }}>404 — Page not found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
