import React, { useState, useEffect } from "react";

export default function Requirements() {
  const [requirements, setRequirements] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sector: "",
    preferred_locations: "",
    size_sqm: "",
    notes: "",
  });
  const [showModal, setShowModal] = useState(false);

  const API_URL = "https://acquire-intel-api.onrender.com/api/operatorRequirements";

  // Fetch requirements
  const loadRequirements = async () => {
    const res = await fetch(API_URL);
    const data = await res.json();
    if (data.ok) setRequirements(data.items);
  };

  useEffect(() => {
    loadRequirements();
  }, []);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Submit new requirement
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sector: form.sector,
      preferred_locations: form.preferred_locations.split(",").map((l) => l.trim()),
      size_sqm: form.size_sqm,
      notes: form.notes,
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      setShowModal(false);
      setForm({ name: "", sector: "", preferred_locations: "", size_sqm: "", notes: "" });
      loadRequirements();
    } else {
      alert("Error: " + data.error);
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Operator Requirements</h2>

      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg mb-4"
      >
        ➕ Add Requirement
      </button>

      <ul className="space-y-2">
        {requirements.map((r) => (
          <li key={r.id} className="border border-gray-700 rounded-lg p-3">
            <p><strong>{r.name}</strong> ({r.sector})</p>
            <p>📍 {r.preferredlocations?.join(", ") || "N/A"}</p>
            <p>📏 Size: {r.size_sqm || "N/A"}</p>
            <p>📝 {r.notes || "No notes"}</p>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 p-6 rounded-xl shadow-xl w-96 space-y-4"
          >
            <h3 className="text-xl font-semibold mb-2">Add Requirement</h3>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="w-full p-2 rounded bg-gray-800"
              required
            />
            <input
              name="sector"
              value={form.sector}
              onChange={handleChange}
              placeholder="Sector"
              className="w-full p-2 rounded bg-gray-800"
              required
            />
            <input
              name="preferred_locations"
              value={form.preferred_locations}
              onChange={handleChange}
              placeholder="Preferred Locations (comma separated)"
              className="w-full p-2 rounded bg-gray-800"
            />
            <input
              name="size_sqm"
              value={form.size_sqm}
              onChange={handleChange}
              placeholder="Size (sqm)"
              className="w-full p-2 rounded bg-gray-800"
            />
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Notes"
              className="w-full p-2 rounded bg-gray-800"
            />
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
              >
                Add Requirement
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="bg-gray-700 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
