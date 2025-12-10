// src/views/RequirementsView.tsx
import React, { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";

type Operator = { id: number | string; name: string };
type ManualItem = {
  id: number; name: string; category?: string | null;
  minSqft?: number | null; maxSqft?: number | null;
  useClass?: string | null; preferredLocations?: string[]; notes?: string | null;
  createdAt?: string;
};

const API = import.meta.env.VITE_API_URL || "https://acquire-intel-api.onrender.com";
const ENDPOINTS = {
  operators: `${API}/api/operators`,
  csvUpload: `${API}/api/operatorCsvUpload`,
  pdfUpload: `${API}/api/operatorRequirements`,
  manualAdd: `${API}/api/operatorRequirements/manual`,
  manualList: `${API}/api/operatorRequirements/manual`,
  deleteItem: (id: number|string) => `${API}/api/operatorRequirements/${id}`,
};

export default function RequirementsView(): JSX.Element {
  // Operators (optional)
  const [ops, setOps] = useState<Operator[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [opsErr, setOpsErr] = useState("");

  // Upload state
  const [opId, setOpId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");

  // Manual form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [minSqft, setMinSqft] = useState("");
  const [maxSqft, setMaxSqft] = useState("");
  const [useClass, setUseClass] = useState("");
  const [locations, setLocations] = useState("");
  const [notes, setNotes] = useState("");
  const [manualMsg, setManualMsg] = useState("");

  // Recent list
  const [recent, setRecent] = useState<ManualItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingOps(true);
        const r = await fetch(ENDPOINTS.operators);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const normalized: Operator[] = Array.isArray(data)
          ? data.map((o: any, i: number) =>
              typeof o === "string"
                ? { id: i + 1, name: o }
                : { id: o.id ?? o.operator_id ?? i + 1, name: o.name ?? o.operator_name ?? String(o.name || o) }
            )
          : [];
        setOps(normalized);
      } catch (e: any) {
        setOpsErr(`Failed to load operators: ${e?.message || "fetch error"}`);
      } finally {
        setLoadingOps(false);
      }
    })();
  }, []);

  async function loadRecent() {
    try {
      setLoadingRecent(true);
      const r = await fetch(ENDPOINTS.manualList);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: ManualItem[] = await r.json();
      setRecent(Array.isArray(data) ? data : []);
    } catch {
      setRecent([]);
    } finally {
      setLoadingRecent(false);
    }
  }
  useEffect(() => { loadRecent(); }, []);

  const isCsv = useMemo(() => (file ? file.name.toLowerCase().endsWith(".csv") : false), [file]);
  const isPdf = useMemo(() => (file ? file.name.toLowerCase().endsWith(".pdf") : false), [file]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadMsg("");
    if (!file) return setUploadMsg("Choose a PDF or CSV file.");
    if (isPdf && !opId) return setUploadMsg("Select an operator for the PDF upload.");

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (opId) fd.append("operatorId", opId);
      const url = isCsv ? ENDPOINTS.csvUpload : ENDPOINTS.pdfUpload;
      const r = await fetch(url, { method: "POST", body: fd });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let msg = `${isCsv ? "CSV" : "PDF"} uploaded successfully.`;
      try { const j = await r.json(); msg = j?.message || msg; } catch {}
      setUploadMsg(`✅ ${msg}`); setFile(null);
      loadRecent();
    } catch (e: any) {
      setUploadMsg(`❌ Upload failed: ${e?.message || e}`);
    }
  }

  async function handleManual(e: React.FormEvent) {
    e.preventDefault();
    setManualMsg("");
    if (!name.trim()) return setManualMsg("Enter an operator name.");
    try {
      const body = {
        name: name.trim(),
        category: category.trim() || null,
        minSqft: minSqft ? Number(minSqft) : null,
        maxSqft: maxSqft ? Number(maxSqft) : null,
        useClass: useClass.trim() || null,
        preferredLocations: locations ? locations.split(",").map(s=>s.trim()).filter(Boolean) : [],
        notes: notes.trim() || null,
      };
      const r = await fetch(ENDPOINTS.manualAdd, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      let msg = "Requirement saved.";
      try { const j = await r.json(); msg = j?.message || msg; } catch {}
      setManualMsg(`✅ ${msg}`);
      setName(""); setCategory(""); setMinSqft(""); setMaxSqft("");
      setUseClass(""); setLocations(""); setNotes("");
      loadRecent();
    } catch (e: any) {
      setManualMsg(`❌ Save failed: ${e?.message || e}`);
    }
  }

  function downloadCsvTemplate() {
    const headers = ["name","category","minSqft","maxSqft","useClass","preferredLocations","notes"];
    const example = ['Nando\'s','Casual Dining','1200','2000','E','London; Birmingham; Manchester','Typical size 1,200–2,000 sqft'];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "operator-requirements-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    try {
      const r = await fetch(ENDPOINTS.deleteItem(id), { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await loadRecent();
    } catch (e) {
      alert("Delete failed.");
    }
  }

  return (
    <PageWrapper title="Operator Requirements" sub="Upload a PDF/CSV or add a requirement manually.">
      {/* Upload panel */}
      <section className="ai-panel">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Upload Requirements (PDF or CSV)</h2>
            <p style={{ color: "#9bc0c9", marginTop: 6 }}>PDF = single operator pack. CSV = bulk requirements.</p>
          </div>
          <button type="button" className="ai-btn" onClick={downloadCsvTemplate}>Download CSV Template</button>
        </div>

        <form className="ai-form" onSubmit={handleUpload}>
          <div className="ai-field">
            <label>Select Operator (required for PDF uploads)</label>
            <select className="ai-select" value={opId} onChange={(e) => setOpId(e.target.value)} disabled={loadingOps || !!opsErr}>
              <option value="">{opsErr ? "— Operator list unavailable —" : (loadingOps ? "Loading operators…" : "-- Choose Operator --")}</option>
              {ops.map((o) => (<option key={o.id} value={String(o.id)}>{o.name}</option>))}
            </select>
            {opsErr && <div style={{ color: "#f4a2a2" }}>{opsErr}</div>}
          </div>

          <div className="ai-field">
            <label>Requirements File</label>
            <input type="file" accept=".pdf,.csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div style={{ color: "#9bc0c9", fontSize: 13 }}>
              {isPdf && "PDF detected → will call /api/operatorRequirements"}
              {isCsv && "CSV detected → will call /api/operatorCsvUpload"}
              {!file && "Choose a PDF (single operator) or CSV (bulk)."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" className="ai-btn">Upload & Process</button>
            <span style={{ color: uploadMsg.startsWith("✅") ? "#7fffd4" : "#f8b0b0" }}>{uploadMsg}</span>
          </div>
        </form>
      </section>

      {/* Manual add */}
      <section className="ai-panel">
        <h2 style={{ margin: 0 }}>Add Requirement Manually</h2>
        <p style={{ color: "#9bc0c9", marginTop: 6 }}>Use this for one-off requirements discussed on calls or emails.</p>

        <form className="ai-form" onSubmit={handleManual}>
          <div className="ai-field"><label>Operator Name *</label>
            <input className="ai-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Nando's" />
          </div>
          <div className="ai-field"><label>Category</label>
            <input className="ai-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Casual Dining, Coffee, QSR" />
          </div>
          <div className="ai-row-2">
            <div className="ai-field"><label>Min Sq Ft</label>
              <input className="ai-input" value={minSqft} onChange={(e) => setMinSqft(e.target.value)} placeholder="e.g., 1200" />
            </div>
            <div className="ai-field"><label>Max Sq Ft</label>
              <input className="ai-input" value={maxSqft} onChange={(e) => setMaxSqft(e.target.value)} placeholder="e.g., 2000" />
            </div>
          </div>
          <div className="ai-field"><label>Use Class</label>
            <input className="ai-input" value={useClass} onChange={(e) => setUseClass(e.target.value)} placeholder="e.g., E" />
          </div>
          <div className="ai-field"><label>Preferred Locations (comma separated)</label>
            <input className="ai-input" value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="e.g., London, Birmingham, Manchester" />
          </div>
          <div className="ai-field"><label>Notes</label>
            <textarea className="ai-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="submit" className="ai-btn">Save Requirement</button>
            <span style={{ color: manualMsg.startsWith("✅") ? "#7fffd4" : "#f8b0b0" }}>{manualMsg}</span>
          </div>
        </form>
      </section>

      {/* Recent */}
      <section className="ai-panel">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h2 style={{ margin:0 }}>Recent Manual Entries</h2>
          <button type="button" className="ai-btn" onClick={loadRecent} disabled={loadingRecent}>
            {loadingRecent ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="ai-table-wrap" style={{ marginTop: 10 }}>
          <table className="ai-table">
            <thead>
              <tr>
                <th>Created</th>
                <th>Name</th>
                <th>Category</th>
                <th>Min–Max Sq Ft</th>
                <th>Use Class</th>
                <th>Preferred Locations</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={8} style={{ color: "#9bc0c9" }}>No entries yet.</td></tr>
              ) : recent.map(item => (
                <tr key={item.id}>
                  <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}</td>
                  <td>{item.name}</td>
                  <td>{item.category || "—"}</td>
                  <td>{[item.minSqft ?? "—", item.maxSqft ?? "—"].join(" – ")}</td>
                  <td>{item.useClass || "—"}</td>
                  <td>{(item.preferredLocations || []).join("; ") || "—"}</td>
                  <td>{item.notes || "—"}</td>
                  <td>
                    <button
                      type="button"
                      className="ai-btn"
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: "8px 12px" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageWrapper>
  );
}
