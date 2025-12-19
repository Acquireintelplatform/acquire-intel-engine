// src/views/DealFlowView.tsx
//-------------------------------------------------------------
// Deal Flow View — Acquire Intel
// Fully wired CRUD + CSV export
//-------------------------------------------------------------
import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://acquire-intel-api.onrender.com";

type Deal = {
  id: number;
  title: string;
  stage: string;
  value_gbp: number | null;
  sector: string | null;
  location: string | null;
  notes: string | null;
  updated_at: string;
};

const DealFlowView: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState({
    title: "",
    stage: "New",
    value_gbp: "",
    sector: "",
    location: "",
    notes: "",
  });

  //-------------------------------------------------------------
  // Fetch deals
  //-------------------------------------------------------------
  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/deals`);
      const data = await res.json();
      if (data.ok) setDeals(data.items);
      else setError(data.error || "Failed to load deals");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  //-------------------------------------------------------------
  // Save or update deal
  //-------------------------------------------------------------
  const saveDeal = async () => {
    try {
      const method = editingDeal ? "PUT" : "POST";
      const url = editingDeal
        ? `${API_BASE}/api/deals/${editingDeal.id}`
        : `${API_BASE}/api/deals`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value_gbp: form.value_gbp ? Number(form.value_gbp) : null,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setShowModal(false);
        setEditingDeal(null);
        setForm({
          title: "",
          stage: "New",
          value_gbp: "",
          sector: "",
          location: "",
          notes: "",
        });
        fetchDeals();
      } else {
        alert("Error saving deal: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  //-------------------------------------------------------------
  // Delete deal
  //-------------------------------------------------------------
  const deleteDeal = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this deal?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/deals/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setDeals(deals.filter((d) => d.id !== id));
      } else {
        alert("Error deleting deal: " + data.error);
      }
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  //-------------------------------------------------------------
  // Export CSV
  //-------------------------------------------------------------
  const exportCSV = () => {
    const headers = ["ID", "Title", "Stage", "Value (GBP)", "Sector", "Location", "Notes"];
    const rows = deals.map((d) => [
      d.id,
      d.title,
      d.stage,
      d.value_gbp || "",
      d.sector || "",
      d.location || "",
      d.notes || "",
    ]);

    const csv =
      [headers.join(","), ...rows.map((r) => r.map((x) => `"${x}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "deal-flow.csv";
    a.click();
  };

  //-------------------------------------------------------------
  // Edit a deal
  //-------------------------------------------------------------
  const editDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setForm({
      title: deal.title,
      stage: deal.stage,
      value_gbp: deal.value_gbp?.toString() || "",
      sector: deal.sector || "",
      location: deal.location || "",
      notes: deal.notes || "",
    });
    setShowModal(true);
  };

  //-------------------------------------------------------------
  // JSX
  //-------------------------------------------------------------
  return (
    <div style={{ padding: "2rem", color: "#fff" }}>
      <h1>Deal Flow</h1>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setShowModal(true)}>+ Add Deal</button>{" "}
        <button onClick={fetchDeals}>Refresh</button>{" "}
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border={1} cellPadding={6} style={{ width: "100%", background: "#111" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Stage</th>
            <th>Value (GBP)</th>
            <th>Sector</th>
            <th>Location</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td>{deal.id}</td>
              <td>{deal.title}</td>
              <td>{deal.stage}</td>
              <td>{deal.value_gbp?.toLocaleString() || ""}</td>
              <td>{deal.sector}</td>
              <td>{deal.location}</td>
              <td>{deal.notes}</td>
              <td>
                <button onClick={() => editDeal(deal)}>Edit</button>{" "}
                <button onClick={() => deleteDeal(deal.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for add/edit */}
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
            <h2>{editingDeal ? "Edit Deal" : "Add Deal"}</h2>

            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <br />
            <input
              placeholder="Stage"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            />
            <br />
            <input
              placeholder="Value (GBP)"
              value={form.value_gbp}
              onChange={(e) => setForm({ ...form, value_gbp: e.target.value })}
            />
            <br />
            <input
              placeholder="Sector"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
            <br />
            <input
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <br />
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <br />
            <button onClick={saveDeal}>{editingDeal ? "Save Changes" : "Add Deal"}</button>{" "}
            <button
              onClick={() => {
                setShowModal(false);
                setEditingDeal(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealFlowView;
