// src/router/index.tsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/layout/Layout";
import PageWrapper from "@/components/PageWrapper";

// lazy views
const DashboardView        = lazy(() => import("@/views/DashboardView"));
const LiveAlertsView       = lazy(() => import("@/views/LiveAlertsView"));
const DealFlowView         = lazy(() => import("@/views/DealFlowView"));
const IndustryNewsView     = lazy(() => import("@/views/IndustryNewsView"));
const DistressSignalsView  = lazy(() => import("@/views/DistressSignalsView"));
const PropertySearchView   = lazy(() => import("@/views/PropertySearchView"));
const PropertyFeedsView    = lazy(() => import("@/views/PropertyFeedsView"));
const MapInsightsView      = lazy(() => import("@/views/MapInsightsView"));
const GoogleMapsView       = lazy(() => import("@/views/GoogleMapsView"));
const OperatorMatchingView = lazy(() => import("@/views/OperatorMatchingView"));
const RequirementsView     = lazy(() => import("@/views/RequirementsView"));
const AgentsView           = lazy(() => import("@/views/AgentsView"));
const ScraperStatusView    = lazy(() => import("@/views/ScraperStatusView"));
const HealthView           = lazy(() => import("@/views/HealthView"));

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="ai-main"><div className="ai-card">Loading…</div></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard"         element={<PageWrapper title="Dashboard"><DashboardView /></PageWrapper>} />
          <Route path="/live-alerts"       element={<PageWrapper title="Live Alerts"><LiveAlertsView /></PageWrapper>} />
          <Route path="/deal-flow"         element={<PageWrapper title="Deal Flow"><DealFlowView /></PageWrapper>} />
          <Route path="/industry-news"     element={<PageWrapper title="Industry News"><IndustryNewsView /></PageWrapper>} />
          <Route path="/distress-signals"  element={<PageWrapper title="Distress Signals"><DistressSignalsView /></PageWrapper>} />
          <Route path="/property-search"   element={<PageWrapper title="Property Search"><PropertySearchView /></PageWrapper>} />
          <Route path="/property-feeds"    element={<PageWrapper title="Property Feeds"><PropertyFeedsView /></PageWrapper>} />
          <Route path="/map-insights"      element={<PageWrapper title="Map Insights"><MapInsightsView /></PageWrapper>} />
          <Route path="/google-maps-engine"element={<PageWrapper title="Google Maps Engine"><GoogleMapsView /></PageWrapper>} />
          <Route path="/operator-matching" element={<PageWrapper title="Operator Matching"><OperatorMatchingView /></PageWrapper>} />
          <Route path="/requirements"      element={<PageWrapper title="Operator Requirements"><RequirementsView /></PageWrapper>} />
          <Route path="/agents"            element={<PageWrapper title="Agents & Landlords"><AgentsView /></PageWrapper>} />
          <Route path="/scraper-status"    element={<PageWrapper title="Scraper Status"><ScraperStatusView /></PageWrapper>} />

          {/* Health page (no extra wrapper needed, but allowed) */}
          <Route path="/health" element={<HealthView />} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
