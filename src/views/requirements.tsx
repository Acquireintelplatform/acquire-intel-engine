import { useEffect, useMemo, useState } from "react";

type Requirement = {
  id: number;
  operator_name: string;
  min_size_sqft: number | null;
  max_size_sqft: number | null;
  preferred_locations: string | null;
  extraction_required: boolean | null;
  notes: string | null;
  uploaded_at: string | null;
};

export default function Requirements() {
  const [includeExtraction, setIncludeExtraction] = useState(false);
  const [rows, setRows] = useState<Requirement[] | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!rows) return [];
    if (!includeExtraction) return rows;
    return rows.filter(r => r.extraction_required === true);
  }, [rows, includeExtraction]);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("https://acquire-intel-api.onrender.com/api/operator-requirements");
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Requirement[];
      setRows(
        data.sort((a, b) => (b.uploaded_at || "").localeCompare(a.uploaded_at || ""))
      );
    } catch (err) {
      console.error("Failed to load requirements", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <div className="rounded-xl border border-[#0e2e2e] bg-[#071922]/70 shadow-[0_0_40px_rgba(0,255,200,0.08)]">
        <div className="px-6 pt-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-teal-300 drop-shadow-[0_0_12px_rgba(0,255,200,0.35)]">
            Operator Requirements
          </h1>
          <p className="mt-3 text-[15px] text-teal-100/70">
            Match operator requirements to property opportunities.
          </p>
        </div>

        <div className="px-6 pt-6">
          <label className="inline-flex items-center gap-3 text-teal-100/85">
            <input
              type="checkbox"
              checked={includeExtraction}
              onChange={(e) => setIncludeExtraction(e.target.checked)}
            />
            <span>Include requirements needing extraction</span>
          </label>

          <button
            onClick={load}
            disabled={loading}
            className="ml-6 inline-block w-[420px] rounded-lg px-5 py-3 text-center font-semibold transition
                       bg-[#34f5d1] text-[#07222a] disabled:opacity-60"
          >
            {loading ? "Loading…" : "Match Operators"}
          </button>
        </div>

        <div className="px-6 py-6 overflow-x-auto">
          {!rows && <div className="py-10 text-teal-100/70">Loading…</div>}
          {rows && filtered.length === 0 && (
            <div className="py-10 text-teal-100/70">No matches found.</div>
          )}
          {rows && filtered.length > 0 && (
            <table className="min-w-full text-sm">
              <thead className="text-teal-200/80">
                <tr className="border-b border-[#0f2d2d]">
                  <th className="py-2 pr-4 text-left">Operator</th>
                  <th className="py-2 pr-4 text-left">Size (sqft)</th>
                  <th className="py-2 pr-4 text-left">Locations</th>
                  <th className="py-2 pr-4 text-left">Extraction?</th>
                  <th className="py-2 pr-4 text-left">Notes</th>
                  <th className="py-2 pr-4 text-left">Uploaded</th>
                </tr>
              </thead>
              <tbody className="text-teal-100/80">
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-[#0b2424]">
                    <td className="py-2 pr-4">{r.operator_name}</td>
                    <td className="py-2 pr-4">
                      {r.min_size_sqft ?? "—"} – {r.max_size_sqft ?? "—"}
                    </td>
                    <td className="py-2 pr-4">{r.preferred_locations ?? "—"}</td>
                    <td className="py-2 pr-4">{r.extraction_required ? "Yes" : "No"}</td>
                    <td className="py-2 pr-4">{r.notes ?? "—"}</td>
                    <td className="py-2 pr-4">
                      {r.uploaded_at ? new Date(r.uploaded_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
