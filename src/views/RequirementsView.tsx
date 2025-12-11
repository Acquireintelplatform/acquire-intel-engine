// src/views/RequirementsView.tsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

type Row = {
  id?: number;
  operatorId?: number | null;
  title?: string;
  notes?: string;
  preferredLocations?: string[] | string | null;
  createdAt?: string;
};

function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  if (typeof v === "string") return v.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  return [String(v)];
}

async function get<T>(p: string): Promise<T> {
  const r = await fetch(`${API_BASE}${p}`);
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
}
async function send<T>(p: string, m: "POST" | "PUT", b: any): Promise<T> {
  const r = await fetch(`${API_BASE}${p}`, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
}

export default function RequirementsView(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [csvOk, setCsvOk] = useState(false);

  const empty: Row = { operatorId: 1, title: "", notes: "", preferredLocations: [] };
  const [form, setForm] = useState<Row>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  function inform(s: string) { setMsg(s); setTimeout(() => setMsg(""), 2000); }
  function warn(s: string) { setErr(s); setTimeout(() => setErr(""), 3000); }

  async function refresh() {
    try {
      const data = await get<Row[]>("/api/operatorRequirements/manual");
      setRows((Array.isArray(data) ? data : []).map(r => ({ ...r, preferredLocations: toArray(r.preferredLocations) })));
    } catch (e: any) { warn(e.message || "Load failed"); }
  }
  useEffect(() => { refresh(); }, []);

  const total = useMemo(() => rows.length, [rows]);

  function onEdit(r: Row) {
    setEditingId(r.id!);
    setForm({
      operatorId: r.operatorId ?? 1,
      title: r.title ?? "",
      notes: r.notes ?? "",
      preferredLocations: toArray(r.preferredLocations),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      operatorId: form.operatorId ?? 1,
      title: (form.title || "").trim(),
      notes: (form.notes || "").trim(),
      preferredLocations: toArray(form.preferredLocations),
    };
    if (!payload.title) return warn("Operator Name is required");
    try {
      if (editingId) {
        const updated = await send<Row>(`/api/operatorRequirements/manual/${editingId}`, "PUT", payload);
        setRows(prev => prev.map(x => x.id === editingId ? { ...updated, preferredLocations: toArray(updated.preferredLocations) } : x));
        setEditingId(null); setForm(empty); inform("Updated");
      } else {
        const saved = await send<Row>("/api/operatorRequirements/manual", "POST", payload);
        setRows(prev => [...prev, { ...saved, preferredLocations: toArray(saved.preferredLocations) }]);
        setForm(empty); inform("Saved");
      }
    } catch (e: any) { warn(e.message || "Save failed"); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    async function tryDel(url: string) {
      const r = await fetch(url, { method: "DELETE" });
      return r.ok || r.status === 404;
    }
    try {
      let ok = await tryDel(`${API_BASE}/api/operatorRequirements/manual/${id}`);
      if (!ok) ok = await tryDel(`${API_BASE}/api/operatorRequirements/${id}`);
      if (!ok) throw new Error("delete failed");
      setRows(prev => prev.filter(x => x.id !== id));
      inform("Deleted");
    } catch { warn("Delete failed"); }
  }

  async function onCsv(file: File) {
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/operatorCsvUpload`, { method: "POST", body: fd });
      setCsvOk(r.ok); inform("CSV uploaded"); await refresh();
    } catch (e: any) { setCsvOk(false); warn(e.message || "CSV upload failed"); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-2xl font-semibold">Upload Requirements (PDF or CSV)</h2>
        <div className="flex gap-3 items-center">
          <input type="file" onChange={e => { const f = e.target.files?.[0]; if (f) onCsv(f); }} />
          <button type="button" className="px-4 py-2 rounded-xl font-semibold" style={{ background: "#2fffd1", color: "#0b1220" }}>Upload &amp; Process</button>
          {csvOk && <span className="text-green-600 font-medium">✅ CSV uploaded successfully.</span>}
        </div>
      </section>

      <section className="rounded-2xl border p-5 space-y-4">
        <h2 className="text-2xl font-semibold">{editingId ? "Edit Requirement" : "Add Requirement Manually"}</h2>
        {msg && <div className="text-green-600">{msg}</div>}
        {err && <div className="text-red-600">{err}</div>}

        <form className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end" onSubmit={onSave}>
          <div>
            <label className="block text-sm mb-1">Operator</label>
            <input type="number" className="w-full border rounded-md px-2 py-1"
              value={form.operatorId ?? ""} onChange={e => setForm(f => ({ ...f, operatorId: e.target.value ? Number(e.target.value) : null }))} />
          </div>
          <div>
            <label className="block text-sm mb-1">Operator Name *</label>
            <input className="w-full border rounded-md px-2 py-1" placeholder="e.g., Nando's"
              value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Preferred Locations (comma separated)</label>
            <input className="w-full border rounded-md px-2 py-1" placeholder="e.g., London, Birmingham, Manchester"
              value={toArray(form.preferredLocations).join(", ")} onChange={e => setForm(f => ({ ...f, preferredLocations: toArray(e.target.value) }))} />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm mb-1">Notes</label>
            <input className="w-full border rounded-md px-2 py-1"
              value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-4 flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-xl font-semibold" style={{ background: "#2fffd1", color: "#0b1220" }}>
              {editingId ? "Update Requirement" : "Save Requirement"}
            </button>
            {editingId && (
              <button type="button" className="px-4 py-2 rounded-xl font-semibold border"
                onClick={() => { setEditingId(null); setForm(empty); }}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Manual Entries</h2>
          <button type="button" className="px-4 py-2 rounded-xl font-semibold" style={{ background: "#2fffd1", color: "#0b1220" }} onClick={refresh}>Refresh</button>
        </div>
        <div className="text-sm opacity-70">Total: {total}</div>

        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-3 border-b">Created</th>
                <th className="p-3 border-b">Name</th>
                <th className="p-3 border-b">Preferred Locations</th>
                <th className="p-3 border-b">Notes</th>
                <th className="p-3 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td className="p-3 border-b">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                  <td className="p-3 border-b">{r.title ?? "—"}</td>
                  <td className="p-3 border-b">{toArray(r.preferredLocations).join("; ") || "—"}</td>
                  <td className="p-3 border-b">{r.notes ?? "—"}</td>
                  <td className="p-3 border-b">
                    <div className="flex gap-2">
                      <button type="button" className="px-3 py-1 rounded-xl font-semibold" style={{ background: "#2fffd1", color: "#0b1220" }} onClick={() => onEdit(r)}>Edit</button>
                      <button type="button" className="px-3 py-1 rounded-xl font-semibold" style={{ background: "#2fffd1", color: "#0b1220" }} onClick={() => onDelete(r.id!)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-6 text-center" colSpan={5}>No requirements yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
