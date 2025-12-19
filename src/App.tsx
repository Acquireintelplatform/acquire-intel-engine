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
import "./styles/index.css";

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/deal-flow" element={<DealFlowView />} />
            <Route path="/google-maps-engine" element={<GoogleMapsView />} />
            <Route path="/operator-matching" element={<OperatorMatchingView />} />
            <Route path="/operator-requirements" element={<OperatorRequirementsView />} />
            <Route path="*" element={<div style={{ padding: 40 }}>404 — Page not found</div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
