// src/views/AdminAllInOne.tsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || "https://acquire-intel-api.onrender.com";

type Deal = {
  id: number;
  title: string;
  stage: string;
  valueGBP: number | null;
  sector: string | null;
  location: string | null;
  notes: string | null;
  updatedAt: string;
};

type Pin = {
  id: number;
  title: string;
  type: string;
  lat: number;
  lng: number;
  address: string | null;
};

type Requirement = {
  id: number;
  operatorId: string | null;
  name: string;
  preferredLocations: string | null;
  notes: string | null;
  createdAt: string;
};

type SavedSearch = {
  id: number;
  title: string;
  location: string | null;
  sector: string | null;
  minValueGBP: number | null;
  maxValueGBP: number | null;
  keywords: string | null;
  createdAt: string;
};

const STAGES = ["New", "Screening", "Review", "Sourcing", "Underwriting", "Offer Made", "Negotiation", "In Legals", "Heads", "Completed"];

export default function AdminAllInOne(): JSX.Element {
  const [tab, setTab] = useState<"deals" | "pins" | "reqs" | "searches">("deals");
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin — All-in-One</h1>
      <div className="flex gap-2">
        <TabBtn onClick={() => setTab("deals")} active={tab === "deals"}>Deals</TabBtn>
        <TabBtn onClick={() => setTab("pins")} active={tab === "pins"}>Map Pins</TabBtn>
        <TabBtn onClick={() => setTab("reqs")} active={tab === "reqs"}>Requirements</TabBtn>
        <TabBtn onClick={() => setTab("searches")} active={tab === "searches"}>Saved Searches</TabBtn>
      </div>
      {tab === "deals" && <DealsPane />}
      {tab === "pins" && <PinsPane />}
      {tab === "reqs" && <ReqsPane />}
      {tab === "searches" && <SearchesPane />}
    </div>
  );
}

/* ---------------- Deals ---------------- */
function DealsPane() {
  const [rows, setRows] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", stage: "New", valueGBP: "", sector: "", location: "", notes: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/deals`);
      const j = await r.json();
      if (j?.ok) setRows(j.items);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return rows.filter((d) => (!s ? true : [d.title, d.stage, d.sector ?? "", d.location ?? "", d.notes ?? ""].join(" ").toLowerCase().includes(s)));
  }, [rows, q]);

  const onCreate = async () => {
    if (!form.title.trim()) return alert("Title required");
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        stage: form.stage || "New",
        valueGBP: form.valueGBP ? Number(form.valueGBP) : null,
        sector: form.sector.trim() || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      };
      const r = await fetch(`${API_BASE}/api/deals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j?.ok) { await load(); setForm({ title: "", stage: "New", valueGBP: "", sector: "", location: "", notes: "" }); }
      else alert(j?.error || "Create failed");
    } finally { setBusy(false); }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete deal?")) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/deals/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j?.ok) await load();
    } finally { setBusy(false); }
  };

  const onSeed = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/deals/seed`, { method: "POST" });
      const j = await r.json();
      if (j?.ok) setRows(j.items);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Bar>
        <input className="rounded-xl bg-white/5 px-3 py-2 w-full" placeholder="Search deals…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={onSeed} disabled={busy}>Seed demo</button>
      </Bar>

      <Card>
        <h3 className="font-semibold mb-3">Create Deal</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Input label="Title *" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Select label="Stage" value={form.stage} onChange={(v) => setForm((f) => ({ ...f, stage: v }))} options={STAGES} />
          <Input label="Value (GBP)" value={form.valueGBP} onChange={(v) => setForm((f) => ({ ...f, valueGBP: v }))} />
          <Input label="Sector" value={form.sector} onChange={(v) => setForm((f) => ({ ...f, sector: v }))} />
          <Input label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
          <Input label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
        </div>
        <div className="mt-3">
          <button className="rounded-lg px-4 py-2 bg-emerald-600" onClick={onCreate} disabled={busy}>Create</button>
        </div>
      </Card>

      <Table headers={["Title", "Stage", "Value", "Sector", "Location", "Notes", ""]}>
        {filtered.map((d) => (
          <tr key={d.id} className="border-t border-white/10">
            <Td>{d.title}</Td>
            <Td>{d.stage}</Td>
            <Td>{d.valueGBP ? `£${Number(d.valueGBP).toLocaleString("en-GB")}` : "—"}</Td>
            <Td>{d.sector || "—"}</Td>
            <Td>{d.location || "—"}</Td>
            <Td className="max-w-[300px]">{d.notes || "—"}</Td>
            <Td>
              <button className="rounded-lg px-3 py-1.5 bg-rose-600" onClick={() => onDelete(d.id)} disabled={busy}>Delete</button>
            </Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Pins ---------------- */
const CATS = ["lateFilings","leaseExpiring","foodBeverage","retail","driveThru","shoppingMalls","newProperties"] as const;
function PinsPane() {
  const [rows, setRows] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", type: "retail", lat: "", lng: "", address: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/mapPins`);
      const j = await r.json();
      if (j?.ok) setRows(j.pins ?? j.items ?? []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.title.trim() || !form.lat || !form.lng) return alert("Title, lat, lng required");
    setBusy(true);
    try {
      const body = { title: form.title.trim(), type: form.type, lat: Number(form.lat), lng: Number(form.lng), address: form.address.trim() || null };
      const r = await fetch(`${API_BASE}/api/mapPins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j?.ok) { await load(); setForm({ title: "", type: "retail", lat: "", lng: "", address: "" }); }
      else alert(j?.error || "Create failed");
    } finally { setBusy(false); }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete pin?")) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/mapPins/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j?.ok) await load();
    } finally { setBusy(false); }
  };

  const onSeed = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/mapPins/seed`, { method: "POST" });
      const j = await r.json();
      if (j?.ok) setRows(j.pins ?? j.items ?? []);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Bar>
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={onSeed} disabled={busy}>Seed demo</button>
      </Bar>

      <Card>
        <h3 className="font-semibold mb-3">Create Pin (Admin)</h3>
        <div className="grid md:grid-cols-5 gap-3">
          <Input label="Title *" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Select label="Type" value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} options={[...CATS]} />
          <Input label="Lat *" value={form.lat} onChange={(v) => setForm((f) => ({ ...f, lat: v }))} />
          <Input label="Lng *" value={form.lng} onChange={(v) => setForm((f) => ({ ...f, lng: v }))} />
          <Input label="Address" value={form.address} onChange={(v) => setForm((f) => ({ ...f, address: v }))} />
        </div>
        <div className="mt-3">
          <button className="rounded-lg px-4 py-2 bg-emerald-600" onClick={onCreate} disabled={busy}>Create</button>
        </div>
      </Card>

      <Table headers={["Title","Type","Lat","Lng","Address",""]}>
        {rows.map((p) => (
          <tr key={p.id} className="border-t border-white/10">
            <Td>{p.title}</Td>
            <Td>{p.type}</Td>
            <Td>{p.lat}</Td>
            <Td>{p.lng}</Td>
            <Td className="max-w-[300px]">{p.address || "—"}</Td>
            <Td><button className="rounded-lg px-3 py-1.5 bg-rose-600" onClick={() => onDelete(p.id)}>Delete</button></Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Requirements ---------------- */
function ReqsPane() {
  const [rows, setRows] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ operatorId: "", name: "", preferredLocations: "", notes: "" });
  const [csv, setCsv] = useState("name,operatorId,preferredLocations,notes\nCoffeeCo,123,London; Birmingham,250-300 sqm high streets\n");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/operatorRequirements`);
      const j = await r.json();
      if (j?.ok) setRows(j.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.name.trim()) return alert("Name required");
    setBusy(true);
    try {
      const body = { operatorId: form.operatorId || null, name: form.name.trim(), preferredLocations: form.preferredLocations.trim() || null, notes: form.notes.trim() || null };
      const r = await fetch(`${API_BASE}/api/operatorRequirements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j?.ok) { await load(); setForm({ operatorId: "", name: "", preferredLocations: "", notes: "" }); }
      else alert(j?.error || "Create failed");
    } finally { setBusy(false); }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete requirement?")) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/operatorRequirements/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j?.ok) await load();
    } finally { setBusy(false); }
  };

  const onUploadCsv = async () => {
    if (!csv.trim()) return alert("Paste CSV first");
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/operatorRequirements/uploadCsv`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv }) });
      const j = await r.json();
      if (j?.ok) { alert(`Inserted: ${j.inserted}`); await load(); }
      else alert(j?.error || "CSV import failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Bar>
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </Bar>

      <Card>
        <h3 className="font-semibold mb-3">Add Requirement</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <Input label="Name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          <Input label="Operator ID" value={form.operatorId} onChange={(v) => setForm((f) => ({ ...f, operatorId: v }))} />
          <Input label="Preferred Locations" value={form.preferredLocations} onChange={(v) => setForm((f) => ({ ...f, preferredLocations: v }))} />
          <Input label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
        </div>
        <div className="mt-3">
          <button className="rounded-lg px-4 py-2 bg-emerald-600" onClick={onCreate} disabled={busy}>Create</button>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold mb-3">CSV Paste (quick import)</h3>
        <textarea className="w-full h-40 rounded-xl bg-white/5 p-3" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div className="mt-2">
          <button className="rounded-lg px-4 py-2 bg-white/10" onClick={onUploadCsv} disabled={busy}>Upload CSV</button>
        </div>
        <div className="text-xs opacity-70 mt-2">Headers: <code>name,operatorId,preferredLocations,notes</code></div>
      </Card>

      <Table headers={["Name","Operator","Locations","Notes",""]}>
        {rows.map((r) => (
          <tr key={r.id} className="border-t border-white/10">
            <Td>{r.name}</Td>
            <Td>{r.operatorId || "—"}</Td>
            <Td className="max-w-[300px]">{r.preferredLocations || "—"}</Td>
            <Td className="max-w-[300px]">{r.notes || "—"}</Td>
            <Td><button className="rounded-lg px-3 py-1.5 bg-rose-600" onClick={() => onDelete(r.id)}>Delete</button></Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------------- Saved Searches ---------------- */
function SearchesPane() {
  const [rows, setRows] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", location: "", sector: "", minValueGBP: "", maxValueGBP: "", keywords: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/searches`);
      const j = await r.json();
      if (j?.ok) setRows(j.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!form.title.trim()) return alert("Title required");
    setBusy(true);
    try {
      const body = {
        title: form.title.trim(),
        location: form.location.trim() || null,
        sector: form.sector.trim() || null,
        minValueGBP: form.minValueGBP ? Number(form.minValueGBP) : null,
        maxValueGBP: form.maxValueGBP ? Number(form.maxValueGBP) : null,
        keywords: form.keywords.trim() || null,
      };
      const r = await fetch(`${API_BASE}/api/searches`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (j?.ok) { await load(); setForm({ title: "", location: "", sector: "", minValueGBP: "", maxValueGBP: "", keywords: "" }); }
      else alert(j?.error || "Create failed");
    } finally { setBusy(false); }
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete saved search?")) return;
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/api/searches/${id}`, { method: "DELETE" });
      const j = await r.json();
      if (j?.ok) await load();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <Bar>
        <button className="rounded-lg px-3 py-2 bg-white/10" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
      </Bar>

      <Card>
        <h3 className="font-semibold mb-3">Create Saved Search</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <Input label="Title *" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Input label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
          <Input label="Sector" value={form.sector} onChange={(v) => setForm((f) => ({ ...f, sector: v }))} />
          <Input label="Min Value GBP" value={form.minValueGBP} onChange={(v) => setForm((f) => ({ ...f, minValueGBP: v }))} />
          <Input label="Max Value GBP" value={form.maxValueGBP} onChange={(v) => setForm((f) => ({ ...f, maxValueGBP: v }))} />
          <Input label="Keywords" value={form.keywords} onChange={(v) => setForm((f) => ({ ...f, keywords: v }))} />
        </div>
        <div className="mt-3">
          <button className="rounded-lg px-4 py-2 bg-emerald-600" onClick={onCreate} disabled={busy}>Create</button>
        </div>
      </Card>

      <Table headers={["Title","Location","Sector","Range","Keywords",""]}>
        {rows.map((s) => (
          <tr key={s.id} className="border-t border-white/10">
            <Td>{s.title}</Td>
            <Td>{s.location || "—"}</Td>
            <Td>{s.sector || "—"}</Td>
            <Td>
              {s.minValueGBP != null || s.maxValueGBP != null
                ? `£${(s.minValueGBP ?? 0).toLocaleString("en-GB")} — £${(s.maxValueGBP ?? 0).toLocaleString("en-GB")}`
                : "—"}
            </Td>
            <Td className="max-w-[300px]">{s.keywords || "—"}</Td>
            <Td><button className="rounded-lg px-3 py-1.5 bg-rose-600" onClick={() => onDelete(s.id)}>Delete</button></Td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

/* ---------- tiny UI helpers ---------- */
function TabBtn({ children, active, onClick }: React.PropsWithChildren<{ active?: boolean; onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 ${active ? "bg-emerald-600" : "bg-white/10 hover:bg-white/15"}`}
    >
      {children}
    </button>
  );
}
function Bar({ children }: React.PropsWithChildren) {
  return <div className="flex flex-wrap gap-3 items-center">{children}</div>;
}
function Card({ children }: React.PropsWithChildren) {
  return <div className="rounded-2xl border border-white/10 p-4 bg-white/5">{children}</div>;
}
function Table({ headers, children }: React.PropsWithChildren<{ headers: string[] }>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[900px]">
        <thead className="bg-white/5">
          <tr className="text-left">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-sm font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm opacity-80">{label}</span>
      <input className="rounded-xl bg-white/5 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm opacity-80">{label}</span>
      <select className="rounded-xl bg-white/5 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function Td({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
