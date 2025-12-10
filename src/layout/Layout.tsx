// src/layout/Layout.tsx
import { Outlet } from "react-router-dom";
import "./sidebar.css";

export default function Layout() {
  return (
    <div className="ai-shell">
      <aside className="ai-sidebar">
        <Sidebar />
      </aside>
      <main className="ai-main">
        <Outlet />
      </main>
    </div>
  );
}

import Sidebar from "./Sidebar";
