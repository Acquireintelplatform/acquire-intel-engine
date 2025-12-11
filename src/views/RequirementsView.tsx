// frontend/src/views/RequirementsView.tsx
import React, { useEffect, useMemo, useState } from "react";

/* why: one API base var that matches Render */
const API_BASE: string =
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
  updatedAt?: string;
  category?: string | null;
  minSqft?: number | null;
  maxSqft?: number | null;
  useClass?: string | null;
};

function toArray(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val == null || val === "") return [];
  if (typeof val === "string") {
    return val.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  }
  return [String(val)].filter(Boolean);
}

async function apiGet<T = any>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { method: "GET" });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

async function apiJson<T = any>(path: string, method: "POST" | "PUT", body: any): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

export default function RequirementsView() {
  const [rows, setRows] = useState<Row[]>([]);
  const [csvOk, setCsvOk] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [err, setErr] = useState<string>("");

  const empty: Row = { operatorId: 1, title: "", notes: "", preferredLocations: [] };
  const [form, setForm] = useState<Row>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);

  function inform(s: string) { setMsg(s); setTimeout(() => setMsg(""), 2200); }
  function warn(s: string) { setErr(s); setTimeout(() => setErr(""), 3500); }

  async function refresh() {
    try {
      const data = await apiGet<Row[]>("/api/operatorRequirements/manual");
      setRows((Array.isArray(data) ? data : []).map((r) => ({
        ...r, preferredLocations: toArray(r.preferredLocations),
      })));
    } catch (e: any) { warn(e.message || "Load failed"); }
  }

  useEffect(() => { refresh(); }, []);
  const createdCount = useMemo(() => rows.length, [rows]);

  function onEdit(row: Row) {
    setEditingId(row.id!);
    setForm({
      operatorId: row.operatorId ?? 1,
      title: row.title ?? "",
      notes: row.notes ?? "",
      preferredLocations: toArray(row.preferredLocations),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      operatorId: form.operatorId ?? 1,
      title: (form.title ?? "").trim(),
      notes: (form.notes ?? "").trim(),
      preferredLocations: toArray(form.preferredLocations),
    };
    if (!payload.title) return warn("Operator Name is required");

    try {
      if (editingId) {
        const updated = await apiJson<Row>(`/api/operatorRequirements/manual/${editingId}`, "PUT", payload);
        setRows((prev) =>
          prev.map((x) =>
            x.id === editingId
              ? { ...updated, preferredLocations: toArray(updated.preferredLocations) }
              : x
          )
        );
        setEditingId(null);
        setForm(empty);
        inform("Updated");
      } else {
        const saved = await apiJson<Row>("/api/operatorRequirements/manual", "POST", payload);
        setRows((prev) => [...prev, { ...saved, preferredLocations: toArray(saved.preferredLocations) }]);
        setForm(empty);
        inform("Saved");
      }
    } catch (e: any) { warn(e.message || "Save failed"); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this item?")) return;

    const tryDelete = async (url: string) => {
      const r = await fetch(url, { method: "DELETE" });
      return { ok: r.ok || r.status === 404, code: r.status };
    };

    try {
      let { ok, code } = await tryDelete(`${API_BASE}/api/operatorRequirements/manual/${id}`);
      if (!ok) {
        const res2 = await tryDelete(`${API_BASE}/api/operatorRequirements/${id}`); // fallback
        ok = res2.ok; code = res2.code;
      }
      if (!ok) throw new Error(`delete-failed-${code}`);
      setRows((prev) => prev.filter((x) => x.id !== id));
      inform("Deleted");
    } catch { warn("Delete failed"); }
  }

  async function onUploadCsv(file: File) {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${API_BASE}/api/operatorCsvUpload`, { method: "POST", body: fd });
      setCsvOk(r.ok);
      inform("CSV uploaded");
      await refresh();
    } catch (e: any) { setCsvOk(false); warn(e.message || "CSV upload failed"); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Upload Requirements (PDF or CSV)</h2>
        </div>
        <div className="flex gap-3 items-center">
          <input
            type="file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUploadCsv(f); }}
          />
          <button className="px-4 py-2 rounded-xl font-semibold"
                  style={{ background: "#2fffd1", color: "#0b1220" }}>
            Upload &amp; Process
          </button>
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
            <input
              type="number" className="w-full border rounded-md px-2 py-1"
              value={form.operatorId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, operatorId: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Operator Name *</label>
            <input
              className="w-full border rounded-md px-2 py-1" placeholder="e.g., Nando's"
              value={form.title ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Preferred Locations (comma separated)</label>
            <input
              className="w-full border rounded-md px-2 py-1" placeholder="e.g., London, Birmingham, Manchester"
              value={toArray(form.preferredLocations).join(", ")}
              onChange={(e) => setForm((f) => ({ ...f, preferredLocations: toArray(e.target.value) }))}
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-sm mb-1">Notes</label>
            <input
              className="w-full border rounded-md px-2 py-1"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="md:col-span-4 flex gap-3">
            <button type="submit" className="px-4 py-2 rounded-xl font-semibold"
                    style={{ background: "#2fffd1", color: "#0b1220" }}>
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
          <button clas
