// src/App.tsx
import React from "react";
import { createBrowserRouter, RouterProvider, Link } from "react-router-dom";

// --- Small, safe views (no network calls yet) ---
function Home() {
  console.log("HOME mounted");
  return (
    <div style={{ padding: 24 }}>
      <h1>Acquire Intel — Sanity Check</h1>
      <p>This is the minimal shell. If you can see this, the router is OK.</p>
      <ul>
        <li><Link to="/deal-flow">Go to Deal Flow</Link></li>
        <li><Link to="/google-maps-engine">Go to Maps</Link></li>
        <li><Link to="/operator-matching">Go to Operator Matching</Link></li>
      </ul>
    </div>
  );
}

function DealFlowBare() {
  console.log("DEAL FLOW bare view mounted");
  return (
    <div style={{ padding: 24 }}>
      <h2>Deal Flow (bare)</h2>
      <p>No API calls yet. If this renders, routing works.</p>
      <p><Link to="/">Back home</Link></p>
    </div>
  );
}

function MapsBare() {
  console.log("MAPS bare view mounted");
  return (
    <div style={{ padding: 24 }}>
      <h2>Google Maps Engine (bare)</h2>
      <p>No map code yet. If this renders, the page is healthy.</p>
      <p><Link to="/">Back home</Link></p>
    </div>
  );
}

function OperatorMatchingBare() {
  console.log("OP MATCH bare view mounted");
  return (
    <div style={{ padding: 24 }}>
      <h2>Operator Matching (bare)</h2>
      <p>No API calls yet. If this renders, the page is healthy.</p>
      <p><Link to="/">Back home</Link></p>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h2>404</h2>
      <p>Route not found. <Link to="/">Go home</Link></p>
    </div>
  );
}

// --- Router ---
const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/deal-flow", element: <DealFlowBare /> },
  { path: "/google-maps-engine", element: <MapsBare /> },
  { path: "/operator-matching", element: <OperatorMatchingBare /> },
  { path: "*", element: <NotFound /> },
]);

export default function App() {
  console.log("MAIN TSX IS RUNNING (sanity shell)");
  return <RouterProvider router={router} />;
}
