// src/views/DistressSignalsView.tsx
import React, { useEffect, useState } from "react";

type ChRow = {
  name: string;
  number: string;
  status: string;
  address: string;
  sic_codes: string[];
  accounts?: { overdue?: boolean; next_due?: string | null; last_made_up_to?: string | null };
  created_at?: string | null;
};

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "https://acquire-intel-api.onrender.com";

const GOOGLE_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";

/* premium button class already defined globally */
const btnClass = "brand-btn";

/* Google Geocoding -> lat/lng */
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !GOOGLE_KEY) return null;
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?address=" +
    encodeURIComponent(address) +
    "&key=" +
    encodeURIComponent(GOOGLE_KEY);
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  const loc = j?.results?.[0]?.geometry?.location;
  return loc && typeof loc.lat === "number" && typeof loc.lng === "number"
    ? { lat: loc.lat, lng: loc.lng }
    : null;
}

export default function DistressSignalsView(): JSX.Element {
  const [rows, setRows] = useState<ChRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("retail");
  const [limit, setLimit] = useState(20);

  async function fetchData() {
    try {
      setErr("");
      setLoading(true);
      const url = `${API_BASE}/api/companieshouse/late-filings?query=${encodeURIComponent(
        q.trim() || "retail"
      )}&limit=${Math.max(1, Math.min(50, Number(limit || 20)))}`;
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Request failed");
      setRows(Array.isArray(j.data) ? j.data : []);
    } catch (e: any) {
      setErr(e?.message || String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addToMap(row: ChRow) {
    try {
      let ll = await geocode(row.address);
      if (!ll) ll = { lat: 51.5074, lng: -0.1278 }; // fallback London

      const body = {
        title: `${row.name} (${row.number})`,
        lat: ll.lat,
        lng: ll.lng,
        category: "lateFilings",
      };
      const r = await fetch(`${API_BASE}/api/mapPins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error("Save failed");
      alert("Added to map ✓");
    } catch (e: any) {
      alert(e?.message || "Failed to add to map");
    }
  }

  return (
    <section
      style={{
        borderRadius: 16,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <h2 className="brand-title">Distress Signals</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (e.g. retail, cafe, coffee, shop, gym)…"
          style={{
            flex: 1,
            height: 40,
            borderRadius: 16,
            padding: "0 14px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "#E7FEF9",
          }}
        />
        <input
          type="number"
          min={1}
          max={50}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          title="Limit (1-50)"
          style={{
            width: 90,
            height: 40,
            borderRadius: 16,
            padding: "0 12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "#E7FEF9",
          }}
        />
        <button onClick={fetchData} className={btnClass}>Refresh</button>
      </div>

      {err && <div style={{ color: "#ff6b6b", marginBottom: 10 }}>{err}</div>}
      {loading && <div style={{ opacity: 0.8, marginBottom: 10 }}>Loading…</div>}

      <div
        style={{
          overflow: "auto",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Number</th>
              <th style={th}>Status</th>
              <th style={th}>SIC</th>
              <th style={th}>Next Due</th>
              <th style={th}>Address</th>
              <th style={thRight}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.number + "_" + idx} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={td}>{r.name}</td>
                <td style={tdMono}>{r.number}</td>
                <td style={td}>{r.status || "-"}</td>
                <td style={td}>{(r.sic_codes || []).join(", ")}</td>
                <td style={td}>{r.accounts?.next_due || "-"}</td>
                <td style={td}>{r.address || "-"}</td>
                <td style={{ ...td, textAlign: "right" }}>
                  <button onClick={() => addToMap(r)} className={btnClass}>Add to Map</button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...td, opacity: 0.8, textAlign: "center" }}>
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const th: React.CSSProperties = {
  padding: "12px 12px",
  textAlign: "left",
  fontWeight: 700,
  position: "sticky",
  top: 0,
  background: "rgba(8,14,20,0.66)",
  backdropFilter: "blur(4px)",
};

const thRight: React.CSSProperties = { ...th, textAlign: "right" };

const td: React.CSSProperties = {
  padding: "12px",
  ve
