// src/layout/sidebar.tsx
//-------------------------------------------------------------
// Acquire Intel — Sidebar Navigation
//-------------------------------------------------------------
import React from "react";

const Sidebar: React.FC = () => {
  const linkStyle: React.CSSProperties = {
    display: "block",
    padding: "10px 14px",
    marginBottom: "4px",
    color: "#aefeff",
    textDecoration: "none",
    borderRadius: "6px",
    transition: "background 0.2s",
  };

  const sectionTitle: React.CSSProperties = {
    color: "#1fe6b0",
    fontSize: "0.8rem",
    margin: "16px 0 6px 12px",
    letterSpacing: "0.05em",
  };

  const sidebarStyle: React.CSSProperties = {
    width: "240px",
    background: "#011820",
    padding: "1rem 0",
    overflowY: "auto",
  };

  return (
    <aside style={sidebarStyle}>
      <div style={{ paddingLeft: "1rem", fontWeight: "bold", color: "#aefeff", fontSize: "1.2rem" }}>
        Acquire Intel
      </div>

      {/* Dashboard */}
      <div>
        <div style={sectionTitle}>DASHBOARD</div>
        <a href="/dashboard" style={linkStyle}>
          Dashboard
        </a>
      </div>

      {/* AI INTELLIGENCE */}
      <div>
        <div style={sectionTitle}>AI INTELLIGENCE</div>
        <a href="/live-alerts" style={linkStyle}>
          Live Alerts
        </a>
        <a href="/industry-news" style={linkStyle}>
          Industry News
        </a>
      </div>

      {/* DEAL FLOW */}
      <div>
        <div style={sectionTitle}>DEAL FLOW</div>
        <a href="/deal-flow" style={linkStyle}>
          Deal Flow
        </a>
      </div>

      {/* DISTRESS & RISK */}
      <div>
        <div style={sectionTitle}>DISTRESS & RISK</div>
        <a href="/distress-signals" style={linkStyle}>
          Distress Signals
        </a>
      </div>

      {/* ACQUISITION PIPELINE */}
      <div>
        <div style={sectionTitle}>ACQUISITION PIPELINE</div>
        <a href="/property-search" style={linkStyle}>
          Property Search
        </a>
        <a href="/property-feeds" style={linkStyle}>
          Property Feeds
        </a>
        <a href="/google-maps-engine" style={linkStyle}>
          Google Maps Engine
        </a>
      </div>

      {/* OPERATORS */}
      <div>
        <div style={sectionTitle}>OPERATORS</div>
        <a href="/operator-matching" style={linkStyle}>
          Operator Matching
        </a>
        <a href="/operator-requirements" style={linkStyle}>
          Requirements
        </a>
      </div>

      {/* ADMIN */}
      <div>
        <div style={sectionTitle}>ADMIN</div>
        <a href="/settings" style={linkStyle}>
          Settings
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
