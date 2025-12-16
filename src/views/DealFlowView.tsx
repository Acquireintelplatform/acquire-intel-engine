// src/views/DealFlowView.tsx
import React, { useEffect, useMemo, useState } from "react";

/* ===== API base ===== */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/* ===== Types ===== */
type Deal = {
  id: number;
  title: string;
  stage:
    | "Sourcing"
    | "Underwriting"
    | "Offer Made"
    | "Negotiation"
    | "In Legals"
    | "Completed"
    | "New"
    | "Review"
    | "Heads"
    | "Screening";
  valueGBP?: number | string | null;
  sector?: string;
  location?: string;
  notes?: string;
  updatedAt?: string;
};

type ListResponse = { ok: boolean; items?: Deal[]; count?: number };
type ItemResponse = { ok: boolean; item?: Deal };

/* ===== Helpers ===== */
const STAGES: Deal["stage"][] = [
  "Sourcing",
  "Underwriting",
  "Offer Made",
  "Negotiation",
  "In Legals",
  "Completed",
  "New",
  "Review",
  "Heads",
  "Screening",
];

const money = (n?: number | string | null) => {
  if (n == null || n === "") return "—";
  const x = typeof n === "string" ? Number(n) : n;
  if (!isFinite(x)) return "—";
  return x.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
};

async function getJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, init);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

/* ===== Inline editable cell ===== */
function EditableCell<T extends keyof Deal>(props: {
  row: Deal;
  field: T;
  type?: "text" | "number" | "select" | "textarea";
  options?: string[];
  onSave: (id: number, patch: Partial<Deal>) => Promise<void>;
  title?: string;
}) {
  const { row, field, type = "text", options, onSave, title } = props;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<any>(row[field] ?? "");

  useEffect(() => setValue(row[field] ?? ""), [row, field]);

  async function commit() {
    if (!editing) return;
    setEditing(false);
    const patch: any = {};
    patch[field] = type === "number" ? (value === "" ? null : Number(value)) : value;
    if (patch[field] === row[field]) return;
    await onSave(row.id, patch);
  }

  if (!editing) {
    const display =
      field === "valueGBP" ? money(row.valueGBP as any) : (row[field] as any) || "—";
    return (
      <div
        role="button"
        title={title || "Click to edit"}
        onClick={() => setEditing(true)}
        style={{ cursor: "text" }}
      >
        {display}
      </div>
    );
  }

  if (type === "select" && options) {
    return (
      <select
        autoFocus
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="w-full bg-transparent border rounded-md px-2 py-1"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        autoFocus
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        className="w-full bg-transparent border rounded-md px-2 py-1"
        rows={3}
      />
    );
  }

  return (
    <input
      autoFocus
      type={type}
      value={value ?? ""}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      className="w-full bg-transparent border rounded-md px-2 py-1"
    />
  );
}

/* ===== Add Deal Modal ===== */
function AddDealModal(props: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: Deal) => void;
}) {
  const { open, onClose, onCreated } = props;

  const [form, setForm] = useState<Partial<Deal>>({
    title: "",
    stage: "New",
    valueGBP: "",
    sector: "",
    location: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        stage: "New",
        valueGBP: "",
        sector: "",
        location: "",
        notes: "",
      });
      setErr("");
      setBusy(false);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) {
      setErr("Title is required");
      return;
    }
    setBusy(true);
    try {
      const res = await getJSON<ItemResponse>("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title?.trim(),
          stage: form.stage,
          valueGBP:
            form.valueGBP === "" || form.valueGBP == null ? null : Number(form.valueGBP),
          sector: form.sector?.trim() || "",
          location: form.location?.trim() || "",
          notes: form.notes?.trim() || "",
        }),
      });
      if (res?.ok && res.item) {
        onCreated(res.item);
        onClose();
      } else {
        setErr("Create failed");
      }
    } catch (e: any) {
      setErr(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Deal"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        className="teal-glow"
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#0e1114",
          borderRadius: 16,
          padding: 20,
          border: "1px solid rgba(0,255,255,0.15)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 style={{ color: "#cfffff", fontSize: 18, fontWeight: 800 }}>Add Deal</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border rounded-md"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            Close
          </button>
        </div>

        {err && <div className="text-red-500 text-sm mb-2">{err}</div>}

        <form className="space-y-3" onSubmit={submit}>
          <div>
            <label className="block text-xs mb-1 opacity-80">Title *</label>
            <input
              className="w-full border rounded-md px-2 py-1.5 bg-transparent"
              value={form.title || ""}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 opacity-80">Stage</label>
              <select
                className="w-full border rounded-md px-2 py-1.5 bg-transparent"
                value={form.stage || "New"}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as Deal["stage"] }))}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 opacity-80">Value (GBP)</label>
              <input
                type="number"
                className="w-full border rounded-md px-2 py-1.5 bg-transparent"
                value={form.valueGBP as any}
                onChange={(e) => setForm((f) => ({ ...f, valueGBP: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Sector</label>
            <input
              className="w-full border rounded-md px-2 py-1.5 bg-transparent"
              value={form.sector || ""}
              onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Location</label>
            <input
              className="w-full border rounded-md px-2 py-1.5 bg-transparent"
              value={form.location || ""}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Notes</label>
            <textarea
              className="w-full border rounded-md px-2 py-1.5 bg-transparent"
              rows={3}
              value={form.notes || ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-3 py-1.5 border rounded-md"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 border rounded-md"
              style={{ borderColor: "rgba(0,255,255,0.25)", background: "rgba(0,255,255,0.12)" }}
              disabled={busy}
            >
              Create deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===== Main View ===== */
export default function DealFlowView(): JSX.Element {
  const [items, setItems] = useState<Deal[]>([]);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((d) => {
      const byStage = stage === "All" || d.stage === stage;
      if (!byStage) return false;
      if (!needle) return true;
      const hay =
        `${d.title} ${d.sector} ${d.location} ${d.notes}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, stage]);

  async function load() {
    try {
      setLoading(true);
      const res = await getJSON<ListResponse>("/api/deals");
      setItems(res?.items || []);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("GET /api/deals failed", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function save(id: number, patch: Partial<Deal>) {
    const res = await getJSON<ItemResponse>(`/api/deals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res?.ok && res.item) {
      setItems((prev) => prev.map((d) => (d.id === id ? res.item! : d)));
      setMsg("Saved");
      setTimeout(() => setMsg(""), 1200);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this deal?")) return;
    try {
      await getJSON(`/api/deals/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  }

  function exportCsv() {
    const header = ["id", "title", "stage", "valueGBP", "sector", "location", "notes", "updatedAt"];
    const lines = filtered.map((d) =>
      [
        d.id,
        d.title,
        d.stage,
        d.valueGBP ?? "",
        d.sector ?? "",
        d.location ?? "",
        (d.notes ?? "").replace(/\r?\n/g, " "),
        d.updatedAt ?? "",
      ]
        .map((s) => `"${String(s).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <section
        style={{
          background: "linear-gradient(180deg, rgba(7,20,24,0.98), rgba(7,20,24,0.92))",
          border: "1px solid rgba(0,255,255,0.18)",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="brand-title">Deal Flow</h2>
          {msg && <span className="text-green-500 text-xs">{msg}</span>}
        </div>

        <div className="flex flex-wrap gap-3 mt-2">
          <button className="brand-btn" onClick={load} disabled={loading}>
            Refresh
          </button>
          <button className="brand-btn" onClick={exportCsv}>
            Export CSV
          </button>
          <button className="brand-btn" data-variant="primary" onClick={() => setModalOpen(true)}>
            + Add deal
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <input
            placeholder="Search title, sector, location…"
            className="w-full border rounded-md px-2 py-1.5 bg-transparent"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="w-full border rounded-md px-2 py-1.5 bg-transparent"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option>All</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="text-xs opacity-70">
            Showing {filtered.length} / {items.length} • API base: {API_BASE}
          </div>
        </div>
      </section>

      {/* Table */}
      <section
        style={{
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="overflow-x-auto border border-white/10 rounded-xl">
          <table className="w-full text-sm">
            <thead className="text-left text-xs opacity-80">
              <tr>
                <th className="p-3 border-b border-white/10 w-72">Title</th>
                <th className="p-3 border-b border-white/10 w-40">Stage</th>
                <th className="p-3 border-b border-white/10 w-32">Value</th>
                <th className="p-3 border-b border-white/10 w-40">Sector</th>
                <th className="p-3 border-b border-white/10 w-52">Location</th>
                <th className="p-3 border-b border-white/10">Notes</th>
                <th className="p-3 border-b border-white/10 w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="p-3 border-b border-white/10">
                    <EditableCell row={d} field="title" onSave={save} />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <EditableCell
                      row={d}
                      field="stage"
                      type="select"
                      options={STAGES}
                      onSave={save}
                    />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <EditableCell row={d} field="valueGBP" type="number" onSave={save} />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <EditableCell row={d} field="sector" onSave={save} />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <EditableCell row={d} field="location" onSave={save} />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <EditableCell row={d} field="notes" type="textarea" onSave={save} />
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <button className="brand-btn" onClick={() => remove(d.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-sm" colSpan={7}>
                    {loading ? "Loading…" : "No deals."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddDealModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(created) => setItems((prev) => [created, ...prev])}
      />
    </div>
  );
}
