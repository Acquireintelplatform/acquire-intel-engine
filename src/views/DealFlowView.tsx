import React, { useEffect, useMemo, useState } from "react";

/** API base (works with your Render API) */
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/** Types */
type Deal = {
  id?: number | string;
  title: string;
  stage:
    | "Sourcing"
    | "Underwriting"
    | "Offer Made"
    | "Negotiation"
    | "In Legals"
    | "Completed"
    | string;
  valueGBP?: number | null;
  sector?: string | null;
  location?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** Helpers */
const fmtGBP = (v?: number | null) =>
  typeof v === "number"
    ? v.toLocaleString("en-GB", {
        style: "currency",
        currency: "GBP",
        maximumFractionDigits: 0,
      })
    : "—";

const stages = [
  "All",
  "Sourcing",
  "Underwriting",
  "Offer Made",
  "Negotiation",
  "In Legals",
  "Completed",
];

async function get<T>(p: string): Promise<T> {
  const r = await fetch(`${API_BASE}${p}`);
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
}
async function post<T>(p: string, body?: any): Promise<T> {
  const r = await fetch(`${API_BASE}${p}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${r.status} ${p}`);
  return r.json();
}

function toCsv(rows: Deal[]): string {
  const headers = [
    "id",
    "title",
    "stage",
    "valueGBP",
    "sector",
    "location",
    "notes",
    "createdAt",
    "updatedAt",
  ];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [
      r.id ?? "",
      r.title ?? "",
      r.stage ?? "",
      r.valueGBP ?? "",
      r.sector ?? "",
      r.location ?? "",
      r.notes ?? "",
      r.createdAt ?? "",
      r.updatedAt ?? "",
    ]
      .map((v) => esc(String(v)))
      .join(",")
  );
  return [headers.join(","), ...lines].join("\r\n");
}

function download(name: string, data: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/** View */
export default function DealFlowView(): JSX.Element {
  const [items, setItems] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<string>("All");

  async function refresh() {
    try {
      setLoading(true);
      setErr("");
      // expected shape: { ok: true, items: Deal[] }
      const res: any = await get("/api/deals");
      const list: Deal[] = Array.isArray(res?.items) ? res.items : [];
      setItems(list);
    } catch (e: any) {
      setErr(e?.message || "Load failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function seed() {
    if (!confirm("Seed demo deals? This will add sample items.")) return;
    try {
      setLoading(true);
      setErr("");
      await post("/api/deals/seed");
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Seed failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => void 0);
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((d) => {
      const stageOK = stage === "All" || d.stage === stage;
      if (!term) return stageOK;
      const hay = `${d.title ?? ""} ${d.stage ?? ""} ${d.sector ?? ""} ${
        d.location ?? ""
      } ${d.notes ?? ""}`.toLowerCase();
      return stageOK && hay.includes(term);
    });
  }, [items, q, stage]);

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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="brand-title">Deal Flow</h2>

          <div className="flex items-center gap-2">
            <button className="brand-btn" onClick={refresh} disabled={loading}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button className="brand-btn" onClick={seed} disabled={loading}>
              Seed demo deals
            </button>
            <button
              className="brand-btn"
              onClick={() => {
                const csv = toCsv(filtered);
                const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
                download(`deals-${ts}.csv`, csv);
              }}
              title="Export the visible rows to CSV"
            >
              Export CSV
            </button>
          </div>
        </div>

        {err && <div className="text-red-500 text-sm mt-2">{err}</div>}

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <input
            className="w-64 border rounded-md px-3 py-2 text-sm bg-transparent"
            placeholder="Search title, sector, location…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border rounded-md px-3 py-2 text-sm bg-transparent"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="text-xs opacity-70 ml-auto">
            Showing {filtered.length} / {items.length} • API base: {API_BASE}
          </div>
        </div>
      </section>

      {/* Table */}
      <section
        style={{
          borderRadius: 16,
          padding: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        }}
      >
        <div className="overflow-x-auto border border-white/10 rounded-xl">
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d.id ?? i} className="align-top">
                  <td className="p-3 border-b border-white/10 font-semibold whitespace-nowrap">
                    {d.title || "—"}
                  </td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.stage || "—"}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{fmtGBP(d.valueGBP)}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.sector || "—"}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">{d.location || "—"}</td>
                  <td className="p-3 border-b border-white/10 whitespace-nowrap">
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 border-b border-white/10">
                    <div className="whitespace-pre-wrap break-words max-w-xs md:max-w-md">
                      {d.notes || "—"}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-sm opacity-80" colSpan={7}>
                    No deals yet. Click “Seed demo deals” to add some examples.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
