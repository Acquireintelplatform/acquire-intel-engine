// src/views/OperatorMatchingView.tsx

import React, { useState } from "react";
import SectionTitle from "../components/SectionTitle";
import SectionCard from "../components/SectionCard";

export default function OperatorMatchingView() {
  const [results, setResults] = useState<any[]>([]);

  return (
    <div style={{ padding: "8px" }}>
      {/* PAGE TITLE */}
      <SectionTitle title="Operator Matching" />

      {/* MATCHING ENGINE */}
      <SectionCard>
        <SectionTitle title="Find Matching Operators" />

        <p style={{ opacity: 0.8, marginBottom: "16px" }}>
          Match operator requirements to property opportunities.
        </p>

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <input
            placeholder="Enter postcode, town, or sqft…"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              background: "#041A2F",
              border: "1px solid rgba(46,242,208,0.25)",
              color: "white",
            }}
          />

          <button
            style={{
              background: "#2EF2D0",
              color: "#031321",
              padding: "14px 28px",
              borderRadius: "10px",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
            }}
            onClick={() => setResults([])}
          >
            Match Operators
          </button>
        </div>

        {/* RESULTS */}
        {results.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No matches found.</p>
        ) : (
          results.map((r, i) => (
            <div
              key={i}
              style={{
                padding: "12px",
                marginTop: "10px",
                borderRadius: "10px",
                background: "#041A2F",
                border: "1px solid rgba(46,242,208,0.25)",
              }}
            >
              {r.name}
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}
