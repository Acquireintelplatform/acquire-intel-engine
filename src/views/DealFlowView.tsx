// src/views/DealFlowView.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";

/* API base (same pattern you used elsewhere) */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/* Types */
type Stage =
  | "New"
  | "Sourcing"
  | "Underwriting"
  | "Offer Made"
  | "Negotiation"
  | "In Legals"
  | "Completed"
  | "Review"
  | "Screening";

type Deal = {
  id?: number;
  title: string;
  stage: Stage;
  valueGBP?: number | null;
  sector?: string;
  location?: string;
  notes?: string;
  updatedAt?: string;
};

const STAGES: Stage[] = [
  "New",
  "Sourcing",
  "Underwriting",
  "Offer Made",
  "Negotiation",
  "In Legals",
  "Completed",
  "Review",
  "Screening",
];

/* Helpers */
const fmtGBP = (n?: number | null) =>
  typeof n === "number" && !isNaN(n)
    ? n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 })
    : "—";

const csvEsc = (s: any) => {
  const v = s == null ? "" : String(s);
  return `"${v.replace(/"/g, '""')}"`;
};

function download(filename: string, text: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* API */
async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`);
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}
async function apiPost<T>(path: string, body: any): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

/* View */
export default function DealFlowView(): JSX.Element {
  const [items, setItems] = useState<Deal[]>([]);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState<"All" | Stage>("All");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // Add-modal state
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Deal>({
    title: "",
    stage: "New",
    valueGBP: undefined,
    sector: "",
    location: "",
    notes: "",
  });

  const showMsg = (s: string) => {
    setMsg(s);
    setTimeout(() => setMsg(""), 1800);
  };

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = await apiGet<{ ok: boolean; items: Deal[] }>("/api/deals");
      setItems(Array.isArray(data.items) ? data.items : []);
      showMsg("Loaded");
    } catch (e: any) {
      showMsg(e?.message || "Load failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load().catch(() => void 0);
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((d) => {
      if (stageFilter !== "All" && d.stage !== stageFilter) return false;
      if (!needle) return true;
      const hay = [
        d.title,
        d.stage,
        d.sector,
        d.location,
        d.notes,
        typeof d.valueGBP === "number" ? String(d.valueGBP) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, stageFilter]);

  const exportCsv = () => {
    const header = ["id", "title", "stage", "valueGBP", "sector", "location", "updatedAt", "notes"].join(",");
    const lines = filtered.map((d) =>
      [
        d.id ?? "",
        d.title ?? "",
        d.stage ?? "",
        d.valueGBP ?? "",
        d.sector ?? "",
        d.location ?? "",
        d.updatedAt ?? "",
        d.notes ?? "",
      ]
        .map(csvEsc)
        .join(","),
    );
    download(`deal-flow-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`, [header, ...lines].join("\r\n"), "text/csv;charset=utf-8");
    showMsg("CSV exported");
  };

  const seed = async () => {
    setBusy(true);
    try {
      await apiPost("/api/deals/seed", {});
      await load();
      showMsg("Seeded");
    } catch (e: any) {
      showMsg(e?.message || "Seed failed");
    } finally {
      setBusy(false);
    }
  };

  /* ===== Modal controls that actually close ===== */

  const onOpen = () => {
    setForm({ title: "", stage: "New", valueGBP: undefined, sector: "", location: "", notes: "" });
    setOpen(true);
    document.body.style.overflow = "hidden"; // lock scroll
  };

  const onClose = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = ""; // unlock scroll
  }, []);

  // close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // click backdrop to close
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const onBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  const create = async () => {
    const payload: Deal = {
      title: (form.title || "").trim(),
      stage: form.stage || "New",
      valueGBP:
        typeof form.valueGBP === "number"
          ? form.valueGBP
          : Number.isFinite(Number(form.valueGBP))
          ? Number(form.valueGBP)
          : undefined,
      sector: (form.sector || "").trim() || undefined,
      location: (form.location || "").trim() || undefined,
      notes: (form.notes || "").trim() || undefined,
    };
    if (!payload.title) {
      showMsg("Title is required");
      return;
    }

    setBusy(true);
    try {
      await apiPost("/api/deals", payload);
      await load();
      onClose(); // CLOSE after successful save
      showMsg("Created");
    } catch (e: any) {
      showMsg(e?.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / actions */}
      <section
        style={{
          borderRadius: 16,
          padding: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="brand-title">Deal Flow</h2>
          <div className="flex items-center gap-3">
            <button className="brand-btn" onClick={load} disabled={busy}>
              Refresh
            </button>
            <button className="brand-btn" onClick={seed} disabled={busy}>
              Seed demo deals
            </button>
            <button className="brand-btn" onClick={exportCsv} disabled={busy}>
              Export CSV
            </button>
            <button className="brand-btn" data-variant="primary" onClick={onOpen} disabled={busy}>
              + Add deal
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <input
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
            placeholder="Search title, sector, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as any)}
          >
            <option value="All">All</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="text-xs opacity-70">
            Showing {filtered.length} / {items.length} • API base: {API_BASE}
            {msg && <span className="ml-2 text-green-500">{msg}</span>}
          </div>
        </div>
      </section>

      {/* Table */}
      <section
        style={{
          borderRadius: 16,
          padding: 0,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          overflow: "hidden",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs opacity-80">
              <tr>
                <th className="p-3 border-b border-white/10 w-[34%]">Title</th>
                <th className="p-3 border-b border-white/10 w-[10%]">Stage</th>
                <th className="p-3 border-b border-white/10 w-[12%]">Value</th>
                <th className="p-3 border-b border-white/10 w-[14%]">Sector</th>
                <th className="p-3 border-b border-white/10 w-[18%]">Location</th>
                <th className="p-3 border-b border-white/10">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id ?? d.title}>
                  <td className="p-3 border-b border-white/10">{d.title}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.stage}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{fmtGBP(d.valueGBP)}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.sector || "—"}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.location || "—"}</td>
                  <td className="p-3 border-b border-white/10">
                    <div className="whitespace-pre-wrap break-words">{d.notes || "—"}</div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-sm opacity-70" colSpan={6}>
                    No deals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Deal Modal */}
      {open && (
        <div
          ref={backdropRef}
          onMouseDown={onBackdropMouseDown}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add Deal"
            style={{
              width: "100%",
              maxWidth: 720,
              background: "#0e1114",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(0,255,255,0.15)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold">Add Deal</h3>
              <button className="brand-btn" onClick={onClose}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs mb-1 opacity-80">Title *</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Prime retail corner — Oxford Circus"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-80">Stage</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as Stage }))}
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
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  value={form.valueGBP ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, valueGBP: e.target.value === "" ? undefined : Number(e.target.value) }))}
                  placeholder="e.g., 27500000"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-80">Sector</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  value={form.sector ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  placeholder="e.g., Retail / Food & Beverage / Shopping malls"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-80">Location</label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  value={form.location ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g., Oxford Circus, London"
                />
              </div>

              <div>
                <label className="block text-xs mb-1 opacity-80">Notes</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                  rows={4}
                  value={form.notes ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes…"
                />
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button className="brand-btn" data-variant="primary" onClick={create} disabled={busy}>
                  Create deal
                </button>
                <button className="brand-btn" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
