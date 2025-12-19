// src/views/RequirementsView.tsx
//-------------------------------------------------------------
// Clean, simple Requirements Manager
//-------------------------------------------------------------
import React, { useState, useEffect } from "react";

interface Requirement {
  id: number;
  name: string;
  sector: string;
  preferred_locations: string[];
  size_sqm: string;
  notes: string;
}

const API_URL = "https://acquire-intel-api.onrender.com/api/operatorRequirements";

export default function RequirementsView() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    sector: "",
    preferred_locations: "",
    size_sqm: "",
    notes: "",
  });
  const [showForm, setShowForm] = useState(false);

  // Load requirements from API
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setRequirements(data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading requirements:", err);
        setLoading(false);
      });
  }, []);

  // Add new requirement
  const handleAdd = async () => {
    try {
      const body = {
        ...form,
        preferred_locations: form.preferred_locations
          ? form.preferred_locations.split(",").map(x => x.trim())
          : [],
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.ok) {
        setRequirements([data.item, ...requirements]);
        setForm({ name: "", sector: "", preferred_locations: "", size_sqm: "", notes: "" });
        setShowForm(false);
      } else {
        alert("Failed: " + data.error);
      }
    } catch (err) {
      console.error("Error saving requirement:", err);
      alert("Error saving requirement.");
    }
  };

  if (loading) return <p className="p-4 text-gray-400">Loading requirements...</p>;

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Operator Requirements</h2>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg mb-4"
      >
        {showForm ? "Cancel" : "Add Requirement"}
      </button>

      {showForm && (
        <div className="bg-gray-900 p-4 rounded-xl mb-6">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="block w-full mb-2 p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Sector"
            value={form.sector}
            onChange={e => setForm({ ...form, sector: e.target.value })}
            className="block w-full mb-2 p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Preferred Locations (comma-separated)"
            value={form.preferred_locations}
            onChange={e => setForm({ ...form, preferred_locations: e.target.value })}
            className="block w-full mb-2 p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Size (sqm)"
            value={form.size_sqm}
            onChange={e => setForm({ ...form, size_sqm: e.target.value })}
            className="block w-full mb-2 p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="block w-full mb-3 p-2 bg-gray-800 border border-gray-700 rounded"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Save Requirement
          </button>
        </div>
      )}

      <ul>
        {requirements.map(req => (
          <li
            key={req.id}
            className="bg-gray-900 p-4 rounded-xl mb-2 border border-gray-700"
          >
            <h3 className="font-semibold text-lg">{req.name}</h3>
            <p>Sector: {req.sector || "—"}</p>
            <p>Preferred: {req.preferred_locations?.join(", ") || "—"}</p>
            <p>Size: {req.size_sqm || "—"} sqm</p>
            <p className="text-sm text-gray-400">{req.notes || ""}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
