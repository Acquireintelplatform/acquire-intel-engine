import React, { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://acquire-intel-api.onrender.com";

interface Requirement {
  id: number;
  name: string;
  sector: string;
  preferred_locations: string;
  size_sqm: number;
  notes: string;
  created_at: string;
}

export default function RequirementsView(): JSX.Element {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [preferredLocations, setPreferredLocations] = useState("");
  const [sizeSqm, setSizeSqm] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Requirement[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // --------------------------------------------------------------------
  // Fetch all requirements
  // --------------------------------------------------------------------
  const fetchList = useCallback(async () => {
    try {
      setStatus("Loading...");
      const res = await fetch(`${API_BASE}/api/operatorRequirements/manual`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();

      if (j.ok && Array.isArray(j.items)) {
        setItems(j.items);
        setStatus("");
      } else {
        setStatus("No data found");
      }
    } catch (err) {
      console.error("❌ Error fetching:", err);
      setStatus("Network or server error");
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // --------------------------------------------------------------------
  // Add new requirement
  // --------------------------------------------------------------------
  async function handleAdd() {
    if (!name.trim()) {
      alert("Please enter an operator name");
      return;
    }

    const payload = {
      name,
      sector,
      preferredLocations,
      size_sqm: sizeSqm,
      notes,
    };

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/operatorRequirements/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json();
      if (j.ok) {
        alert("✅ Saved successfully!");
        setName("");
        setSector("");
        setPreferredLocations("");
        setSizeSqm("");
        setNotes("");
        fetchList();
      } else {
        alert(`❌ Failed to save: ${j.error || "Unknown error"}`);
      }
    } catch (err) {
      alert("❌ Error saving. Check API or network connection.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------------------------
  // Delete requirement
  // --------------------------------------------------------------------
  async function handleDelete(id: number) {
    if (!window.confirm("Delete this requirement?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/operatorRequirements/${id}`, {
        method: "DELETE",
      });
      const j = await res.json();
      if (j.ok) {
        setItems((prev) => prev.filter((r) => r.id !== id));
      } else {
        alert("❌ Failed to delete item");
      }
    } catch (err) {
      console.error("❌ Error deleting:", err);
    }
  }

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div style={{ padding: "40px", color: "white" }}>
      <h2 style={{ fontSize: "24px", marginBottom: "20px" }}>Operator Requirements</h2>

      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "30px",
          width: "400px",
        }}
      >
        <h3>Add Requirement</h3>
        <input placeholder="Operator Name" value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
        <input placeholder="Sector" value={sector} onChange={(e) => setSector(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
        <input placeholder="Preferred Locations" value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
        <input placeholder="Size (sqm)" value={sizeSqm} onChange={(e) => setSizeSqm(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
        <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
        <button onClick={handleAdd} disabled={saving}>
          {saving ? "Saving..." : "Add Requirement"}
        </button>
        <p style={{ color: "gray", fontSize: "12px", marginTop: 8 }}>{status}</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Operator</th>
            <th>Sector</th>
            <th>Locations</th>
            <th>Size (sqm)</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.name}</td>
              <td>{r.sector}</td>
              <td>{r.preferred_locations}</td>
              <td>{r.size_sqm}</td>
              <td>{r.notes}</td>
              <td>
                <button onClick={() => handleDelete(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
