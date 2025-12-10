// src/views/OperatorMatchingView.tsx

import React, { useState } from "react";
import PageWrapper from "../components/PageWrapper";
import SectionTitle from "../components/SectionTitle";
import Card from "../components/Card";
import AIButton from "../components/AIButton";
import { fetchOperatorMatches } from "../services/OperatorMatchingService";

// STRICT MATCHING COLOR MODEL (Model 3)
// GREEN ≥ 80%
// AMBER 50–79%
// RED < 50%
const scoreColor = (score: number) => {
  if (score >= 80) return "#2EF2D0";
  if (score >= 50) return "#FFC107";
  return "#FF4A4A";
};

const OperatorMatchingView: React.FC = () => {
  const [postcode, setPostcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [extractedTown, setExtractedTown] = useState<string | null>(null);

  const handleMatch = async () => {
    setError(null);
    setLoading(true);

    try {
      const data = await fetchOperatorMatches(postcode);

      if (!data.success) {
        setError("Failed to load operator matches.");
        setMatches([]);
        setExtractedTown(null);
      } else {
        setMatches(data.matches || []);
        setExtractedTown(data.extractedTown || null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load operator matches.");
      setMatches([]);
      setExtractedTown(null);
    }

    setLoading(false);
  };

  return (
    <PageWrapper>
      <SectionTitle>Operator Matching</SectionTitle>

      {/* SEARCH CARD WITH CORRECT PADDING */}
      <Card style={{ padding: "32px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            marginBottom: "18px",
          }}
        >
          <input
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="Enter postcode e.g. MK9 3BB"
            style={{
              padding: "12px",
              flex: 1,
              borderRadius: "8px",
              border: "1px solid #2EF2D0",
              backgroundColor: "#07141c",
              color: "white",
              fontSize: "15px",
            }}
          />

          <AIButton onClick={handleMatch} disabled={loading}>
            {loading ? "Matching..." : "Match Operators"}
          </AIButton>
        </div>

        {error && <p style={{ color: "#FF4A4A" }}>{error}</p>}

        {extractedTown && (
          <p style={{ color: "#2EF2D0", marginTop: "4px" }}>
            Location detected: <strong>{extractedTown}</strong>
          </p>
        )}

        {!error && matches.length === 0 && !loading && (
          <p style={{ color: "#2EF2D0", marginTop: "8px" }}>
            No matches found.
          </p>
        )}
      </Card>

      {/* RESULTS CARD */}
      {matches.length > 0 && (
        <Card style={{ padding: "32px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
              color: "white",
              fontSize: "15px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #2EF2D0" }}>
                <th style={{ padding: "10px", textAlign: "left" }}>Operator</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Sqft</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Locations</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Format</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Score</th>
                <th style={{ padding: "10px", textAlign: "left" }}>Reasons</th>
              </tr>
            </thead>

            <tbody>
              {matches.map((m, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: "1px solid #113344",
                  }}
                >
                  <td style={{ padding: "10px", color: "#2EF2D0" }}>
                    {m.operator_name}
                  </td>

                  <td style={{ padding: "10px" }}>{m.sqft_range || "N/A"}</td>

                  <td style={{ padding: "10px" }}>
                    {m.location_match || "—"}
                  </td>

                  <td style={{ padding: "10px" }}>
                    {m.format_type || "—"}
                  </td>

                  <td
                    style={{
                      padding: "10px",
                      fontWeight: "bold",
                      color: scoreColor(parseInt(m.score)),
                    }}
                  >
                    {m.score_percent}
                  </td>

                  <td style={{ padding: "10px" }}>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {m.reasons.map((r: string, i: number) => (
                        <li key={i} style={{ marginBottom: "5px" }}>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </PageWrapper>
  );
};

export default OperatorMatchingView;
