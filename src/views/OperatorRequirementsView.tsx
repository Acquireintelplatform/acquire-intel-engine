// src/views/OperatorRequirementsView.tsx
//-------------------------------------------------------------
// Acquire Intel — Operator Requirements View (CRUD + CSV Export)
//-------------------------------------------------------------
import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "https://acquire-intel-api.onrender.com";

type Requirement = {
  id: number;
  operator_name: string;
  sector: string;
  locations: string;
  size_sqft: string;
  notes: string;
  created_at: string;
};

const OperatorRequirementsView: React.FC = () => {
  const [items, setItems] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Requirement | null>(null);
  const [form, setForm] = useState({
    operator_name: "",
    sector: "",
    locations: "",
    size_sqft: "",
    notes: "",
  });

  //-------------------------------------------------------------
  // Fetch all items
  //-------------------------------------------------------------
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/operatorRequirements`);
      const data = await res.json();
      if (data.ok) setItems(data.items);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  //-------------------------------------------------------------
  // Save (create or update)
  //-------------------------------------------------------------
  const saveItem = async () => {
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem
      ? `${API_BASE}/api/operatorRequirements/${editingItem.id}`
      : `${API_BASE}/api/operatorRequirements`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setEditingItem(null);
        fetchItems();
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  //-------------------------------------------------------------
  // Delete
  //-------------------------------------------------------------
  const deleteItem = async (id: number) => {
    if (!window.confirm("Delete this requirement?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/operatorRequirements/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) setItems(items.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  //-------------------------------------------------------------
  // Export CSV
  //-------------------------------------------------------------
  const exportCSV = () => {
    const headers = ["ID", "Operator Name", "Sector", "Locations", "Size (sqft)", "Notes"];
    const rows = items.map((i) => [
      i.id,
      i.operator_name,
      i.sector,
      i.locations,
      i.size_sqft,
      i.notes,
    ]);
    const csv =
      [headers.join(","), ...rows.map((r) => r.map((x) => `"${x || ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "operator_requirements.csv";
    a.click();
  };

  //-------------------------------------------------------------
  // JSX
  //-------------------------------------------------------------
  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h1>Operator Requirements</h1>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setShowModal(true)}>+ Add Requirement</button>{" "}
        <button onClick={fetchItems}>Refresh</button>{" "}
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {loading && <p>Loading...</p>}

      <table border={1} cellPadding={6} style={{ width: "100%", background: "#111" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Operator</th>
            <th>Sector</th>
            <th>Locations</th>
            <th>Size (sqft)</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.id}</td>
              <td>{i.operator_name}</td>
              <td>{i.sector}</td>
              <td>{i.locations}</td>
              <td>{i.size_sqft}</td>
              <td>{i.notes}</td>
              <td>
                <button
                  onClick={() => {
                    setEditingItem(i);
                    setForm({
                      operator_name: i.operator_name,
                      sector: i.sector,
                      locations: i.locations,
                      size_sqft: i.size_sqft,
                      notes: i.notes,
                    });
                    setShowModal(true);
                  }}
                >
                  Edit
                </button>{" "}
                <button onClick={() => deleteItem(i.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#222",
              padding: "2rem",
              borderRadius: "8px",
              width: "400px",
            }}
          >
            <h2>{editingItem ? "Edit Requirement" : "Add Requirement"}</h2>

            <input
              placeholder="Operator Name"
              value={form.operator_name}
              onChange={(e) => setForm({ ...form, operator_name: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              placeholder="Sector"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              placeholder="Locations"
              value={form.locations}
              onChange={(e) => setForm({ ...form, locations: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <input
              placeholder="Size (sqft)"
              value={form.size_sqft}
              onChange={(e) => setForm({ ...form, size_sqft: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ width: "100%", marginBottom: "0.5rem" }}
            />
            <div>
              <button onClick={saveItem}>
                {editingItem ? "Save Changes" : "Add Requirement"}
              </button>{" "}
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorRequirementsView;
