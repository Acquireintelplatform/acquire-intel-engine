// src/views/DealFlowView.tsx
import React, { useEffect, useMemo, useState } from "react";

/** API base picked up from Render env (frontend) */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_URL ||
  "https://acquire-intel-api.onrender.com";

/** Types */
type Deal = {
  id?: number;
  title: string;
  stage: string;
  sector: string;
  location: string;
  notes?: string;
  value?: number | null; // GBP
  updatedAt?: string;
};

const STAGES = [
  "All",
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

/** Helpers */
const fmtGBP = (n?: number | null) =>
  typeof n === "number" ? n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }) : "—";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}
async function send<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: any): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

function toCsv(rows: Deal[]): string {
  const headers = ["id", "title", "stage", "sector", "location", "value", "updatedAt", "notes"];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = rows.map((d) =>
    [
      d.id ?? "",
      d.title ?? "",
      d.stage ?? "",
      d.sector ?? "",
      d.location ?? "",
      d.value ?? "",
      d.updatedAt ?? "",
      d.notes ?? "",
    ]
      .map((v) => esc(String(v ?? "")))
      .join(",")
  );
  return [headers.join(","), ...lines].join("\r\n");
}

function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Small UI atoms (match your current style) */
const Panel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      padding: 16,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    }}
  >
    {children}
  </div>
);

const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="brand-title" style={{ marginBottom: 8 }}>
    {children}
  </h2>
);

const PillBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }> = ({
  primary,
  ...props
}) => (
  <button
    {...props}
    className="brand-btn"
    data-variant={primary ? "primary" : undefined}
    style={{ marginRight: 10 }}
  />
);

/** Modal */
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  open,
  onClose,
  title,
  children,
}) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="teal-glow"
        style={{
          width: "100%",
          maxWidth: 640,
          background: "#0e1114",
          borderRadius: 16,
          padding: 20,
          border: "1px solid rgba(0,255,255,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>{title}</h3>
          <button onClick={onClose} className="brand-btn">Close</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function DealFlowView(): JSX.Element {
  const [rows, setRows] = useState<Deal[]>([]);
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Modal form state (create/edit)
  const empty: Deal = { title: "", stage: "New", sector: "", location: "", value: null, notes: "" };
  const [editing, setEditing] = useState<Deal | null>(null);
  const [form, setForm] = useState<Deal>(empty);

  const inform = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(""), 1500);
  };

  async function refresh() {
    try {
      setBusy(true);
      const data = await get<{ ok: boolean; items: Deal[] }>("/api/deals");
      setRows((data?.items ?? []).sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || "")));
    } catch (e: any) {
      inform(`Load failed: ${e?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => void 0);
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okStage = stageFilter === "All" || r.stage === stageFilter;
      const okQ =
        !ql ||
        [r.title, r.sector, r.location, r.stage, r.notes]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(ql));
      return okStage && okQ;
    });
  }, [rows, q, stageFilter]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
  }

  function openEdit(d: Deal) {
    setEditing(d);
    setForm({
      id: d.id,
      title: d.title,
      stage: d.stage,
      sector: d.sector,
      location: d.location,
      notes: d.notes ?? "",
      value: typeof d.value === "number" ? d.value : null,
    });
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      inform("Title is required");
      return;
    }
    try {
      setBusy(true);
      if (editing?.id != null) {
        const payload = { ...form };
        const updated = await send<{ ok: boolean; item: Deal }>(`/api/deals/${editing.id}`, "PUT", payload);
        setRows((prev) => prev.map((x) => (x.id === editing.id ? updated.item : x)));
        inform("Updated");
      } else {
        const payload = { ...form };
        const created = await send<{ ok: boolean; item: Deal }>(`/api/deals`, "POST", payload);
        setRows((prev) => [created.item, ...prev]);
        inform("Created");
      }
      setEditing(null);
      setForm(empty);
    } catch (e: any) {
      inform(`Save failed: ${e?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id?: number) {
    if (!id) return;
    if (!confirm("Delete this deal?")) return;
    try {
      setBusy(true);
      await send(`/api/deals/${id}`, "DELETE");
      setRows((prev) => prev.filter((x) => x.id !== id));
      inform("Deleted");
    } catch (e: any) {
      inform(`Delete failed: ${e?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    const csv = toCsv(filtered);
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadFile(`deal-flow-${ts}.csv`, csv);
  }

  async function seedDemo() {
    try {
      setBusy(true);
      await get("/api/deals/seed");
      await refresh();
      inform("Seeded demo deals");
    } catch (e: any) {
      inform(`Seed failed: ${e?.message || "error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Title>Deal Flow</Title>
          <div>
            <PillBtn onClick={refresh}>Refresh</PillBtn>
            <PillBtn onClick={seedDemo}>Seed demo deals</PillBtn>
            <PillBtn onClick={exportCsv}>Export CSV</PillBtn>
            <PillBtn primary onClick={openCreate}>Add deal</PillBtn>
          </div>
        </div>

        {msg && <div className="text-green-500 text-sm" style={{ marginTop: 8 }}>{msg}</div>}
        {busy && <div className="text-xs opacity-70" style={{ marginTop: 6 }}>Working…</div>}

        {/* Search + Filter */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 12, marginTop: 12 }}>
          <input
            placeholder="Search title, sector, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs opacity-70" style={{ marginTop: 10 }}>
          Showing {filtered.length} / {rows.length} • API base: {API_BASE}
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-white/10 rounded-xl" style={{ marginTop: 12 }}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs opacity-80">
              <tr>
                <th className="p-3 border-b border-white/10">Title</th>
                <th className="p-3 border-b border-white/10">Stage</th>
                <th className="p-3 border-b border-white/10">Value</th>
                <th className="p-3 border-b border-white/10">Sector</th>
                <th className="p-3 border-b border-white/10">Location</th>
                <th className="p-3 border-b border-white/10">Updated</th>
                <th className="p-3 border-b border-white/10">Notes</th>
                <th className="p-3 border-b border-white/10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id ?? d.title}>
                  <td className="p-3 border-b border-white/10">{d.title}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.stage}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{fmtGBP(d.value)}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.sector}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.location}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <div className="whitespace-pre-wrap break-words max-w-xs md:max-w-sm">{d.notes || "—"}</div>
                  </td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">
                    <div style={{ display: "grid", gridAutoFlow: "column", columnGap: 10 }}>
                      <PillBtn onClick={() => openEdit(d)}>Edit</PillBtn>
                      <PillBtn primary onClick={() => onDelete(d.id)}>Delete</PillBtn>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center" colSpan={8}>
                    No deals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Create/Edit modal */}
      <Modal
        open={editing !== null || form !== empty}
        onClose={() => {
          setEditing(null);
          setForm(empty);
        }}
        title={editing?.id ? "Edit Deal" : "Add Deal"}
      >
        <form onSubmit={saveForm} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs mb-1 opacity-80">Title *</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Stage</label>
            <select
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
            >
              {STAGES.filter((s) => s !== "All").map((s) => (
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
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.value ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Sector</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.sector}
              onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 opacity-80">Location</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs mb-1 opacity-80">Notes</label>
            <textarea
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="md:col-span-2" style={{ display: "flex", gap: 10 }}>
            <PillBtn primary type="submit">{editing?.id ? "Update deal" : "Create deal"}</PillBtn>
            <PillBtn
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
            >
              Cancel
            </PillBtn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
