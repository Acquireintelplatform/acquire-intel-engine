// src/views/RequirementsView.tsx
import React, { useEffect, useMemo, useState } from "react";

/* API base */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/* Types */
type Row = {
  id?: number;
  operatorId?: number | null;
  title?: string;
  notes?: string;
  preferredLocations?: string[] | string | null;
  createdAt?: string;
};

/* Helpers */
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
  const r = await fetch(`${API_BASE}${p}`, {
    method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(b),
  });
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
}
async function tryPutBoth(id: number, body: any): Promise<Row> {
  const a = await fetch(`${API_BASE}/api/operatorRequirements/manual/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (a.ok) return a.json();
  const b = await fetch(`${API_BASE}/api/operatorRequirements/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (b.ok) return b.json();
  throw new Error("PUT failed");
}

export default function RequirementsView(): JSX.Element {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [csvOk, setCsvOk] = useState(false);

  const empty: Row = { operatorId: 1, title: "", notes: "", preferredLocations: [] };
  const [form, setForm] = useState<Row>(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState<string>("");

  function inform(s: string) { setMsg(s); setTimeout(() => setMsg(""), 1600); }
  function warn(s: string) { setErr(s); setTimeout(() => setErr(""), 2600); }

  async function refresh() {
    try {
      const data = await get<Row[]>("/api/operatorRequirements/manual");
      setRows((Array.isArray(data) ? data : []).map(r => ({
        ...r, preferredLocations: toArray(r.preferredLocations),
      })));
    } catch (e: any) { warn(e.message || "Load failed"); }
  }
  useEffect(() => { refresh(); }, []);

  const total = useMemo(() => rows.length, [rows]);

  function onEdit(r: Row, idx: number) {
    const id = r.id ?? null;
    setEditingId(id);
    setEditingLabel(r.title || `Row ${idx + 1}`);
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
      if (editingId != null) {
        const updated = await tryPutBoth(editingId, payload);
        setRows(prev =>
          prev.map(x => x.id === editingId ? { ...updated, preferredLocations: toArray(updated.preferredLocations) } : x)
        );
        setEditingId(null); setEditingLabel(""); setForm(empty); inform("Updated");
      } else {
        const saved = await send<Row>("/api/operatorRequirements/manual", "POST", payload);
        setRows(prev => [...prev, { ...saved, preferredLocations: toArray(saved.preferredLocations) }]);
        setForm(empty); inform("Saved");
      }
    } catch (e: any) { warn(e.message || "Save failed"); }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this item?")) return;
    async function tryDel(url: string) { const r = await fetch(url, { method: "DELETE" }); return r.ok || r.status === 404; }
    try {
      let ok = await tryDel(`${API_BASE}/api/operatorRequirements/manual/${id}`);
      if (!ok) ok = await tryDel(`${API_BASE}/api/operatorRequirements/${id}`);
      if (!ok) throw new Error("delete failed");
      setRows(prev => prev.filter(x => x.id !== id)); inform("Deleted");
    } catch { warn("Delete failed"); }
  }

  const Title = ({ children }: { children: React.ReactNode }) =>
    <h2 className="brand-title">{children}</h2>;

  const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <section
      style={{
        borderRadius: 16, padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
      }}
    >{children}</section>
  );

  const ButtonRow = ({ children }: { children: React.ReactNode }) =>
    <div style={{ display: "grid", gridAutoFlow: "column", columnGap: 12, alignItems: "center" }}>{children}</div>;

  const Pill = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) => (
    <button
      {...props}
      className="brand-btn"
      data-variant={props.primary ? "primary" : undefined}
    />
  );

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <div className="flex items-center justify-between">
          <Title>Upload Requirements (PDF or CSV)</Title>
          {csvOk && <span className="text-green-500 text-xs">✅ CSV uploaded</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input type="file" className="text-sm"
                 onChange={e => { const f = e.target.files?.[0]; if (!f) return;
                   (async () => { try {
                     const fd = new FormData(); fd.append("file", f);
                     const r = await fetch(`${API_BASE}/api/operatorCsvUpload`, { method: "POST", body: fd });
                     setCsvOk(r.ok); inform("CSV uploaded"); await refresh();
                   } catch { setCsvOk(false); } })();
                 }} />
          <Pill primary>Upload &amp; Process</Pill>
        </div>
      </Card>

      {/* Form */}
      <Card>
        <div className="flex items-center justify-between">
          <Title>{editingId != null ? "Edit Requirement" : "Add Requirement Manually"}</Title>
          {editingId != null && (
            <span className="text-xs px-2 py-1 rounded-full border border-white/15 opacity-80">
              Editing: {editingLabel} (ID {editingId})
            </span>
          )}
        </div>

        {msg && <div className="text-green-500 text-sm">{msg}</div>}
        {err && <div className="text-red-500 text-sm">{err}</div>}

        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end" onSubmit={onSave}>
          <div>
            <label className="block text-xs mb-1 opacity-80">Operator</label>
            <input type="number" className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent"
                   value={form.operatorId ?? ""} onChange={e => setForm(f => ({ ...f, operatorId: e.target.value ? Number(e.target.value) : null }))} />
          </div>
          <div>
            <label className="block text-xs mb-1 opacity-80">Operator Name *</label>
            <input className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent" placeholder="e.g., Nando's"
                   value={form.title ?? ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs mb-1 opacity-80">Preferred Locations (comma separated)</label>
            <input className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent"
                   value={toArray(form.preferredLocations).join(", ")} onChange={e => setForm(f => ({ ...f, preferredLocations: toArray(e.target.value) }))} />
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs mb-1 opacity-80">Notes</label>
            <input className="w-full border rounded-md px-2 py-1.5 text-sm bg-transparent"
                   value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-4">
            <ButtonRow>
              <Pill primary type="submit">{editingId != null ? "Update Requirement" : "Save Requirement"}</Pill>
              {editingId != null && <Pill onClick={() => { setEditingId(null); setEditingLabel(""); setForm(empty); }}>Cancel Edit</Pill>}
            </ButtonRow>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card>
        <div className="flex items-center justify-between">
          <Title>Recent Manual Entries</Title>
          <Pill onClick={refresh}>Refresh</Pill>
        </div>
        <div className="text-xs opacity-70">Total: {total}</div>

        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs opacity-80">
              <tr>
                <th className="p-3 border-b border-white/10 w-44">Created</th>
                <th className="p-3 border-b border-white/10 w-64">Name</th>
                <th className="p-3 border-b border-white/10">Preferred Locations</th>
                <th className="p-3 border-b border-white/10 w-64">Notes</th>
                <th className="p-3 border-b border-white/10 w-44">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id ?? i} className="align-top">
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{r.title ?? "—"}</td>
                  <td className="p-3 border-b border-white/10">
                    <div className="truncate max-w-xs md:max-w-md" title={toArray(r.preferredLocations).join("; ")}>
                      {toArray(r.preferredLocations).join("; ") || "—"}
                    </div>
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <div className="whitespace-pre-wrap break-words max-w-xs md:max-w-sm">{r.notes ?? "—"}</div>
                  </td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">
                    <div style={{ display: "grid", gridAutoFlow: "column", columnGap: 12, alignItems: "center" }}>
                      <Pill onClick={() => onEdit(r, i)}>Edit</Pill>
                      {r.id != null && <Pill primary onClick={() => onDelete(r.id!)}>Delete</Pill>}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (<tr><td className="p-6 text-center text-sm" colSpan={5}>No requirements yet.</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
