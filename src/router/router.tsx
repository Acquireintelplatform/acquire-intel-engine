// src/router.tsx
import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// If your view filenames differ, adjust these imports to match your actual files.
import HealthView from "./views/HealthView";
import RequirementsView from "./views/RequirementsView";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/health" replace /> },
  { path: "/health", element: <HealthView /> },
  { path: "/requirements", element: <RequirementsView /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
