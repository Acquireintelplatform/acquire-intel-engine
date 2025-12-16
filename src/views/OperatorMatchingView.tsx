// src/views/OperatorMatchingView.tsx
import React, { useEffect, useMemo, useState } from "react";

type SearchItem = {
  id: number;
  operatorName: string | null;
  preferredLocations: string[];
  sizeMin?: number | null;
  sizeMax?: number | null;
  budgetGBP?: number | null;
  category?: string | null;
  notes?: string | null;
  createdAt?: string;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  // fallback: try same-origin if not set
  `${window.location.origin.replace(/\/$/, "")}/api`;

function numOrNull(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export default function OperatorMatchingView() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [q, setQ] = useState("");

  // form fields
  const [operatorName, setOperatorName] = useState("");
  const [locations, setLocations] = useState("");
  const [sizeMin, setSizeMin] = useState("");
  const [sizeMax, setSizeMax] = useState("");
  const [budgetGBP, setBudgetGBP] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");

  // load existing saved searches
  async function fetchSearches() {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/searches`);
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSearches();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((it) => {
      const bucket = [
        it.operatorName ?? "",
        it.preferredLocations?.join(", ") ?? "",
        it.category ?? "",
        it.notes ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return bucket.includes(t);
    });
  }, [items, q]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!operatorName.trim()) {
      alert("Please enter an operator name.");
      return;
    }

    const payload = {
      operatorName: operatorName.trim(),
      preferredLocations: locations
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizeMin: numOrNull(sizeMin),
      sizeMax: numOrNull(sizeMax),
      budgetGBP: numOrNull(budgetGBP),
      category: category.trim() || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j?.ok) {
        // refresh list and clear form
        await fetchSearches();
        setOperatorName("");
        setLocations("");
        setSizeMin("");
        setSizeMax("");
        setBudgetGBP("");
        setCategory("");
        setNotes("");
      } else {
        alert(j?.error || "Failed to create requirement");
      }
    } catch (e: any) {
      console.error(e);
      alert("Network error creating requirement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this saved requirement?")) return;
    try {
      const r = await fetch(`${API_BASE}/searches/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j?.ok) {
        setItems((prev) => prev.filter((x) => x.id !== id));
      } else {
        alert(j?.error || "Delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Operator Matching</h1>
        <button
          onClick={fetchSearches}
          className="rounded-xl px-4 py-2 border border-teal-500 hover:bg-teal-900/30"
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-white/10 p-4 bg-white/5">
        <h2 className="text-xl font-semibold mb-3">Add requirement</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-sm mb-1">Operator *</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="e.g. Nando’s"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm mb-1">Preferred locations (comma-separated)</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              placeholder="London, Birmingham, Manchester"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm mb-1">Size min (sq ft)</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={sizeMin}
              onChange={(e) => setSizeMin(e.target.value)}
              inputMode="numeric"
              placeholder="1500"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm mb-1">Size max (sq ft)</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={sizeMax}
              onChange={(e) => setSizeMax(e.target.value)}
              inputMode="numeric"
              placeholder="3500"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm mb-1">Budget (GBP)</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={budgetGBP}
              onChange={(e) => setBudgetGBP(e.target.value)}
              inputMode="numeric"
              placeholder="750000"
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm mb-1">Category / Sector</label>
            <input
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Food & Beverage"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Notes</label>
            <textarea
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any extra detail…"
            />
          </div>

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 bg-teal-600 hover:bg-teal-500 text-black font-semibold"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save requirement"}
            </button>
            <button
              type="button"
              className="rounded-xl px-4 py-2 border border-white/10"
              onClick={() => {
                setOperatorName("");
                setLocations("");
                setSizeMin("");
                setSizeMax("");
                setBudgetGBP("");
                setCategory("");
                setNotes("");
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Search/filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved requirements</h2>
        <input
          className="rounded-xl bg-black/30 border border-white/10 px-3 py-2 w-64"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-4 py-2">Operator</th>
              <th className="text-left px-4 py-2">Locations</th>
              <th className="text-left px-4 py-2">Size</th>
              <th className="text-left px-4 py-2">Budget</th>
              <th className="text-left px-4 py-2">Category</th>
              <th className="text-left px-4 py-2">Notes</th>
              <th className="text-left px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-white/60" colSpan={7}>
                  {loading ? "Loading…" : "No saved requirements yet."}
                </td>
              </tr>
            )}
            {filtered.map((it) => (
              <tr key={it.id} className="border-t border-white/10">
                <td className="px-4 py-2">{it.operatorName || "—"}</td>
                <td className="px-4 py-2">
                  {it.preferredLocations?.length
                    ? it.preferredLocations.join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {it.sizeMin || it.sizeMax
                    ? `${it.sizeMin ?? "—"} – ${it.sizeMax ?? "—"} sq ft`
                    : "—"}
                </td>
                <td className="px-4 py-2">
                  {it.budgetGBP ? `£${it.budgetGBP.toLocaleString()}` : "—"}
                </td>
                <td className="px-4 py-2">{it.category || "—"}</td>
                <td className="px-4 py-2">{it.notes || "—"}</td>
                <td className="px-4 py-2">
                  <button
                    className="rounded-lg px-3 py-1 border border-red-400/70 hover:bg-red-900/30"
                    onClick={() => handleDelete(it.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
