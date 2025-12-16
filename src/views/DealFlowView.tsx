import React, { useEffect, useMemo, useState } from "react";

type Deal = {
  id: number;
  title: string;
  stage: string;
  valueGBP: number | null;
  sector: string | null;
  location: string | null;
  notes: string | null;
  updatedAt: string; // ISO
};

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE || "https://acquire-intel-api.onrender.com";

const STAGES = [
  "All",
  "Sourcing",
  "Underwriting",
  "Offer Made",
  "Negotiation",
  "In Legals",
  "Completed",
  "Review",
  "Heads",
  "Screening",
  "New",
];

export default function DealFlowView() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStage, setFilterStage] = useState("All");
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    stage: "New",
    valueGBP: "",
    sector: "",
    location: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /** -------- data -------- */
  const loadDeals = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/deals`, { credentials: "omit" });
      const j = await r.json();
      if (j?.ok) setDeals(j.items as Deal[]);
      else console.error("GET /api/deals failed:", j);
    } catch (e) {
      console.error("GET /api/deals error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  /** -------- derived -------- */
  const visibleDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    return deals.filter((d) => {
      if (filterStage !== "All" && d.stage !== filterStage) return false;
      if (!q) return true;
      const blob = [
        d.title,
        d.stage,
        d.sector ?? "",
        d.location ?? "",
        d.notes ?? "",
        d.valueGBP?.toString() ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [deals, filterStage, query]);

  /** -------- actions -------- */
  const onRefresh = () => {
    // single source of truth for fetching
    loadDeals();
  };

  const onSeed = async () => {
    setSeeding(true);
    try {
      const r = await fetch(`${API_BASE}/api/deals/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json();
      if (j?.ok) {
        setDeals(j.items as Deal[]);
      } else {
        console.error("POST /api/deals/seed failed:", j);
      }
    } catch (e) {
      console.error("POST /api/deals/seed error:", e);
    } finally {
      setSeeding(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this deal?")) return;
    setDeletingId(id);
    try {
      const r = await fetch(`${API_BASE}/api/deals/${id}`, {
        method: "DELETE",
      });
      const j = await r.json();
      if (j?.ok) {
        // refresh from server to avoid any local desync
        await loadDeals();
      } else {
        console.error("DELETE /api/deals/:id failed:", j);
      }
    } catch (e) {
      console.error("DELETE /api/deals/:id error:", e);
    } finally {
      setDeletingId(null);
    }
  };

  const onOpenModal = () => {
    setForm({
      title: "",
      stage: "New",
      valueGBP: "",
      sector: "",
      location: "",
      notes: "",
    });
    setShowModal(true);
  };

  const onCreate = async () => {
    if (!form.title.trim()) {
      alert("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        stage: form.stage.trim() || "New",
        valueGBP: form.valueGBP ? Number(form.valueGBP) : null,
        sector: form.sector.trim() || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      };

      const r = await fetch(`${API_BASE}/api/deals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (j?.ok) {
        setShowModal(false);
        // reload to show new row at top
        await loadDeals();
      } else {
        console.error("POST /api/deals failed:", j);
        alert(j?.error || "Failed to create deal");
      }
    } catch (e) {
      console.error("POST /api/deals error:", e);
      alert("Failed to create deal");
    } finally {
      setSaving(false);
    }
  };

  const onExportCSV = () => {
    const header = ["Title", "Stage", "Value (GBP)", "Sector", "Location", "Notes"];
    const rows = deals.map((d) => [
      safeCsv(d.title),
      safeCsv(d.stage),
      d.valueGBP ?? "",
      safeCsv(d.sector || ""),
      safeCsv(d.location || ""),
      safeCsv(d.notes || ""),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** -------- render -------- */
  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold mr-auto">Deal Flow</h1>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>

        <button
          onClick={onSeed}
          disabled={seeding || loading}
          className="rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15 disabled:opacity-50"
        >
          {seeding ? "Seeding…" : "Seed demo deals"}
        </button>

        <button
          onClick={onExportCSV}
          className="rounded-lg px-4 py-2 bg-white/10 hover:bg-white/15"
        >
          Export CSV
        </button>

        <button
          onClick={onOpenModal}
          className="rounded-lg px-4 py-2 bg-emerald-600 hover:bg-emerald-700"
        >
          + Add deal
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, sector, location…"
          className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
        />

        <select
          value={filterStage}
          onChange={(e) => setFilterStage(e.target.value)}
          className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
        >
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="text-sm opacity-70">
          Showing {visibleDeals.length} / {deals.length} • API base: {API_BASE}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[900px]">
          <thead className="bg-white/5">
            <tr className="text-left">
              <Th text="Title" />
              <Th text="Stage" />
              <Th text="Value" />
              <Th text="Sector" />
              <Th text="Location" />
              <Th text="Notes" />
              <Th text="Action" />
            </tr>
          </thead>
          <tbody>
            {visibleDeals.map((d) => (
              <tr key={d.id} className="border-t border-white/10">
                <Td>{d.title}</Td>
                <Td>{d.stage}</Td>
                <Td>{d.valueGBP ? `£${comma(d.valueGBP)}` : "—"}</Td>
                <Td>{d.sector || "—"}</Td>
                <Td>{d.location || "—"}</Td>
                <Td className="max-w-[320px]">{d.notes || "—"}</Td>
                <Td>
                  <button
                    onClick={() => onDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="rounded-lg px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deletingId === d.id ? "Deleting…" : "Delete"}
                  </button>
                </Td>
              </tr>
            ))}
            {visibleDeals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center opacity-70">
                  {loading ? "Loading…" : "No deals match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b1620] p-6">
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-semibold mr-auto">Add Deal</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl px-3 py-1.5 bg-white/10 hover:bg-white/15"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4">
              <Labeled label="Title *">
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  placeholder="e.g. Prime retail corner — Oxford Circus"
                />
              </Labeled>

              <Labeled label="Stage">
                <select
                  value={form.stage}
                  onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                >
                  {STAGES.filter((s) => s !== "All").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="Value (GBP)">
                <input
                  value={form.valueGBP}
                  onChange={(e) => setForm((f) => ({ ...f, valueGBP: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  placeholder="e.g. 27500000"
                  inputMode="numeric"
                />
              </Labeled>

              <Labeled label="Sector">
                <input
                  value={form.sector}
                  onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  placeholder="Retail / Drive-thru / Food & Beverage…"
                />
              </Labeled>

              <Labeled label="Location">
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none"
                  placeholder="e.g. Oxford Circus, London"
                />
              </Labeled>

              <Labeled label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="h-32 w-full resize-y rounded-xl bg-white/5 px-4 py-3 outline-none"
                  placeholder="Anything relevant…"
                />
              </Labeled>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={onCreate}
                disabled={saving}
                className="rounded-xl px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Creating…" : "Create deal"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-xl px-4 py-2 bg-white/10 hover:bg-white/15"
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

/** ---------- small UI helpers ---------- */
function Th({ text }: { text: string }) {
  return <th className="px-4 py-3 text-sm font-semibold">{text}</th>;
}
function Td({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
function Labeled({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <label className="grid gap-2">
      <span className="text-sm opacity-80">{label}</span>
      {children}
    </label>
  );
}
function comma(n: number) {
  try {
    return n.toLocaleString("en-GB");
  } catch {
    return String(n);
  }
}
function safeCsv(s: string) {
  // Wrap if needed
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
