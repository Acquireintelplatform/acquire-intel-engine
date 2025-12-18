// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Your views (keep whatever imports you already had)
import DashboardView from "@views/DashboardView";
import DealFlowView from "@views/DealFlowView";
import GoogleMapsView from "@views/GoogleMapsView";
import OperatorMatchingView from "@views/OperatorMatchingView";

// TEMPORARY SCRUBBER: removes " (placeholder)" from sidebar labels
function useRemovePlaceholderLabels() {
  useEffect(() => {
    const scrub = () => {
      const links = document.querySelectorAll("aside a, nav a, .sidebar a");
      links.forEach((el) => {
        const txt = el.textContent || "";
        const cleaned = txt.replace(/\s*\(placeholder\)\s*$/i, "");
        if (cleaned !== txt) el.textContent = cleaned;
      });
    };
    // run once now + again after small delay (in case of async layout)
    scrub();
    const t = setTimeout(scrub, 250);
    const t2 = setTimeout(scrub, 1000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, []);
}

export default function App() {
  // Run scrubber so the UI is clean regardless of which sidebar file is live
  useRemovePlaceholderLabels();

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
