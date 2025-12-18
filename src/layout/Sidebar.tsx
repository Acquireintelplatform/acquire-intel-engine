// src/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import React from "react";

type Item = { label: string; to: string; section?: string };

const MENU: Item[] = [
  // DASHBOARD
  { section: "DASHBOARD", label: "Dashboard", to: "/dashboard" },

  // AI INTELLIGENCE
  { section: "AI INTELLIGENCE", label: "Live Alerts", to: "/live-alerts" },
  { label: "Industry News", to: "/industry-news" },

  // DEAL FLOW
  { section: "DEAL FLOW", label: "Deal Flow", to: "/deal-flow" },

  // DISTRESS & RISK
  { section: "DISTRESS & RISK", label: "Distress Signals", to: "/distress-signals" },

  // ACQUISITION PIPELINE
  { section: "ACQUISITION PIPELINE", label: "Property Search", to: "/property-search" },
  { label: "Property Feeds", to: "/property-feeds" },
  { label: "Google Maps Engine", to: "/google-maps-engine" },

  // OPERATORS
  { section: "OPERATORS", label: "Operator Matching", to: "/operator-matching" },
  { label: "Requirements", to: "/requirements" },

  // ADMIN
  { section: "ADMIN", label: "Settings", to: "/settings" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 260,
        background: "rgba(4, 24, 32, 0.9)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: 16,
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 22, color: "#aefcff", marginBottom: 16 }}>
        Acquire Intel
      </div>

      {MENU.map((item, idx) => {
        const showSection =
          idx === 0 || item.section !== MENU[idx - 1]?.section;

        return (
          <React.Fragment key={`${item.section || "x"}-${item.label}`}>
            {showSection && item.section && (
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: 1,
                  color: "#80b7c4",
                  marginTop: idx === 0 ? 0 : 18,
                  marginBottom: 8,
                }}
              >
                {item.section}
              </div>
            )}

            <NavLink
              to={item.to}
              style={({ isActive }) => ({
                display: "block",
                padding: "12px 14px",
                borderRadius: 12,
                marginBottom: 10,
                color: "#cde7ee",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.10)",
                background: isActive ? "rgba(0, 255, 200, 0.10)" : "transparent",
                boxShadow: isActive ? "0 0 10px rgba(0,255,200,0.12) inset" : "none",
              })}
            >
              {item.label}
            </NavLink>
          </React.Fragment>
        );
      })}
    </aside>
  );
}
