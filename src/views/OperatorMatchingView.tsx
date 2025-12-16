// frontend/src/pages/OperatorMatchingView.tsx
import React, { useEffect, useMemo, useState } from "react";

type Requirement = {
  id: number;
  operatorId: number | null;
  name: string; // operator name
  preferredLocations: string[]; // array of city/area names
  notes: string | null;
  createdAt?: string;
  packUrl?: string | null; // optional link to a PDF pack if you store it
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.replace(/\/$/, "") ||
  "https://acquire-intel-api.onrender.com";

async function api<T>(
  path: string,
  opts?: RequestInit
): Promise<{ ok: boolean } & T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { ok: false, error: text || "Bad JSON" };
  }
  if (!res.ok) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
}

export default function OperatorMatchingView() {
  const [items, setItems] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [locationsInput, setLocationsInput] = useState("");
  const [notes, setNotes] = useState("");
  const [packUrl, setPackUrl] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api<{ count: number; items: Requirement[] }>(
        "/api/operatorRequirements"
      );
      if ((data as any).ok !== false) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
      alert(`Load failed: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((r) => {
      const hay =
        [
          r.name,
          ...(r.preferredLocations || []),
          r.notes || "",
          r.packUrl || "",
        ]
          .join(" ")
          .toLowerCase() || "";
      return hay.includes(needle);
    });
  }, [q, items]);

  const clearForm = () => {
    setName("");
    setLocationsInput("");
    setNotes("");
    setPackUrl("");
  };

  const onCreate = async () => {
    if (!name.trim()) {
      alert("Operator name is required");
      return;
    }
    const preferredLocations = locationsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const body: any = {
        name: name.trim(),
        preferredLocations,
        notes: notes.trim() || null,
      };
      if (packUrl.trim()) body.packUrl = packUrl.trim();

      const data = await api<{ item: Requirement }>("/api/operatorRequirements", {
        method: "POST",
        body: JSON.stringify(body),
      });

      if ((data as any).ok === false) {
        throw new Error((data as any).error || "Failed");
      }

      setItems((prev) => [data.item, ...prev]);
      clearForm();
      setShowAdd(false);
    } catch (err) {
      console.error(err);
      alert(`Create failed: ${(err as Error).message}`);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this requirement?")) return;
    try {
      const data = await api<{ ok: boolean }>(`/api/operatorRequirements/${id}`, {
        method: "DELETE",
      });
      if ((data as any).ok === false) {
        throw new Error((data as any).error || "Delete failed");
      }
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert(`Delete failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Operator Matching</h1>
        <button
          className="rounded-xl px-4 py-2 border"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
        <button
          className="rounded-xl px-4 py-2 border"
          onClick={() => setShowAdd(true)}
        >
          + Add requirement
        </button>
      </div>

      <div className="mb-4">
        <input
          className="w-full rounded-xl px-4 py-3 border bg-transparent"
          placeholder="Search operator, locations, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="text-sm opacity-70 mb-2">
        Showing {filtered.length} / {items.length}
      </div>

      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Operator</th>
              <th className="text-left p-3">Preferred locations</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Pack</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3 whitespace-pre-wrap">{r.name}</td>
                <td className="p-3">
                  {(r.preferredLocations || []).length ? (
                    <div className="flex flex-wrap gap-2">
                      {r.preferredLocations.map((loc, i) => (
                        <span key={i} className="rounded-xl border px-2 py-1">
                          {loc}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="opacity-60">—</span>
                  )}
                </td>
                <td className="p-3 whitespace-pre-wrap">
                  {r.notes || <span className="opacity-60">—</span>}
                </td>
                <td className="p-3">
                  {r.packUrl ? (
                    <a
                      className="underline"
                      href={r.packUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="opacity-60">—</span>
                  )}
                </td>
                <td className="p-3">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleString()
                    : "—"}
                </td>
                <td className="p-3">
                  <button
                    className="rounded-xl px-3 py-1 border"
                    onClick={() => onDelete(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td className="p-6 opacity-60" colSpan={6}>
                  No requirements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl rounded-2xl border p-6 bg-[#07171b]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add Requirement</h2>
              <button
                className="rounded-xl border px-3 py-1"
                onClick={() => setShowAdd(false)}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2">
                <span>Operator name *</span>
                <input
                  className="rounded-xl px-4 py-3 border bg-transparent"
                  placeholder="e.g. Nando’s"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span>Preferred locations (comma-separated)</span>
                <input
                  className="rounded-xl px-4 py-3 border bg-transparent"
                  placeholder="e.g. London, Birmingham, Manchester"
                  value={locationsInput}
                  onChange={(e) => setLocationsInput(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span>Notes</span>
                <textarea
                  rows={4}
                  className="rounded-xl px-4 py-3 border bg-transparent"
                  placeholder="Any constraints or special asks…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span>Pack URL (optional)</span>
                <input
                  className="rounded-xl px-4 py-3 border bg-transparent"
                  placeholder="https://…/your-pack.pdf"
                  value={packUrl}
                  onChange={(e) => setPackUrl(e.target.value)}
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="rounded-xl px-4 py-2 border" onClick={onCreate}>
                Create
              </button>
              <button
                className="rounded-xl px-4 py-2 border"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
