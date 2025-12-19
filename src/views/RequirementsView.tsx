// src/views/RequirementsView.tsx
import React, { useCallback, useEffect, useState } from "react";
import CONFIG from "../config"; // ✅ Connects to backend API

type Requirement = {
  id: string;
  ts: number;
  operatorId?: string;
  name: string;
  preferredLocations?: string;
  notes?: string;
};

const API_BASE = CONFIG.API_BASE_URL; // ✅ Clean base URL

const panel: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(7,20,24,0.98), rgba(7,20,24,0.92))",
  border: "1px solid rgba(0,255,255,0.18)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};
const h2s: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: "#e6ffff", margin: 0 };
const label: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  letterSpacing: 0.4,
  marginBottom: 6,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
};
const input: React.CSSProperties = {
  width: "100%",
  background: "#0f1418",
  color: "#e6f6f5",
  border: "1px solid rgba(0,255,255,0.25)",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
};
const row: React.CSSProperties = { display: "grid", gap: 12 };
const actions: React.CSSProperties = { display: "flex", gap: 12, justifyContent: "flex-end" };
const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,255,255,0.25)",
  background: "rgba(0,255,255,0.10)",
  color: "#e6ffff",
  fontWeight: 700,
  cursor: "pointer",
};

export default function RequirementsView(): JSX.Element {
  const [operatorId, setOperatorId] = useState("");
  const [name, setName] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Requirement[]>([]);
  const [status, setStatus] = useState("—");

  const fetchList = useCallback(async () => {
    try {
      setStatus("loading…");
      const res = await fetch(`${API_BASE}/operatorRequirements/manual`);
      if (!res.ok) {
        setStatus(`HTTP ${res.status}`);
        return;
      }
      const j = await res.json();
      if (j?.ok && Array.isArray(j.items)) {
        setItems(j.items as Requirement[]);
        setStatus("ok");
      } else {
        setItems([]);
        setStatus("empty");
      }
    } catch {
      setStatus("network error");
    }
  }, []);

  useEffect(() => {
    fetchList().catch(() => void 0);
  }, [fetchList]);

  const onSave = useCallback(async () => {
    if (!name.trim()) {
      alert("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/operatorRequirements/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          operatorId: operatorId.trim(),
          preferredLocations: preferredLocations.trim(),
          notes: notes.trim(),
        }),
      });
      if (!res.ok) {
        let msg = "";
        try {
          const j = await res.json();
          msg = j?.error || j?.message || "";
        } catch {}
        alert(`Save failed (HTTP ${res.status})${msg ? ` — ${msg}` : ""}`);
        return;
      }
      const j = await res.json();
      if (j?.ok) {
        setOperatorId("");
        setName("");
        setPreferredLocations("");
        setNotes("");
        await fetchList();
        alert("Requirement saved.");
      }
    } catch (e: any) {
      alert(`Network error saving requirement. ${e?.message || ""}`);
    } finally {
      setSaving(false);
    }
  }, [operatorId, name, preferredLocations, notes, fetchList]);

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <div className="teal-glow" style={panel}>
        <h2 style={h2s}>Requirements</h2>

        <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
          <div style={row}>
            <label style={label}>Operator ID</label>
            <input style={input} value={operatorId} onChange={(e) => setOperatorId(e.target.value)} placeholder="Optional operator ref" />
          </div>

          <div style={row}>
            <label style={label}>Name *</label>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Operator / Requirement name" />
          </div>

          <div style={row}>
            <label style={label}>Preferred Locations</label>
            <input
              style={input}
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
              placeholder="e.g., London, Manchester, Birmingham"
            />
          </div>

          <div style={row}>
            <label style={label}>Notes</label>
            <textarea style={{ ...input, minHeight: 96 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra notes" />
          </div>

          <div style={actions}>
            <button type="button" className="teal-glow" style={btn} disabled={saving} onClick={onSave}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid rgba(0,255,255,0.12)", paddingTop: 12 }}>
          <div style={{ color: "#cfffff", fontSize: 13, marginBottom: 8 }}>
            Status: {status} • Total: {items.length}
          </div>

          {items.length === 0 ? (
            <div style={{ color: "#9cd7d7" }}>No requirements yet.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
              {items
                .slice()
                .reverse()
                .map((it) => (
                  <li
                    key={it.id}
                    className="teal-glow"
                    style={{
                      border: "1px solid rgba(0,255,255,0.18)",
                      borderRadius: 12,
                      padding: 10,
                      background: "rgba(0,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "#e6ffff" }}>{it.name}</div>
                    <div style={{ fontSize: 12, color: "#a8f1ef" }}>
                      ID {it.id} • {new Date(it.ts).toLocaleString()}
                      {it.operatorId ? ` • Operator: ${it.operatorId}` : ""}
                    </div>
                    {it.preferredLocations && <div style={{ marginTop: 4, color: "#cfffff" }}>Locations: {it.preferredLocations}</div>}
                    {it.notes && <div style={{ marginTop: 4, color: "#cfffff" }}>Notes: {it.notes}</div>}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
