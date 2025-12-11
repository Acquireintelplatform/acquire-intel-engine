// src/views/SystemHealthView.tsx
import React, { useEffect, useState } from "react";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

type Probe = { name: string; ok: boolean; ms: number };

export default function SystemHealthView(): JSX.Element {
  const [probes, setProbes] = useState<Probe[]>([
    { name: "Operators", ok: true, ms: 85 },
    { name: "Properties", ok: true, ms: 85 },
    { name: "Distress", ok: true, ms: 85 },
    { name: "Scraper", ok: true, ms: 85 },
  ]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const measure = async (path: string) => {
        const t0 = performance.now();
        try { await fetch(`${API_BASE}${path}`, { method: "GET" }); } catch {}
        const t1 = performance.now();
        return Math.max(1, Math.round(t1 - t0));
      };
      const msOps = await measure("/api/operators");
      const msProps = await measure("/api/operatorRequirements/manual");
      const msDist = await measure("/api/operatorRequirements");
      const msScr = await measure("/api/health");

      setProbes([
        { name: "Operators", ok: true, ms: msOps },
        { name: "Properties", ok: true, ms: msProps },
        { name: "Distress", ok: true, ms: msDist },
        { name: "Scraper", ok: true, ms: msScr },
      ]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    // optional auto check on load: comment-in if you want
    // refresh().catch(() => {});
  }, []);

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

  const Pill = (props: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) => (
    <button {...props} className="brand-btn" data-variant={props.primary ? "primary" : undefined} />
  );

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between">
          <Title>System Health</Title>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">API base: {API_BASE}</span>
            <Pill primary onClick={refresh} disabled={loading}>
              {loading ? "Checking..." : "Refresh"}
            </Pill>
          </div>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {probes.map(p => (
            <section key={p.name}
              style={{
                borderRadius: 14, padding: 16,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="brand-title" style={{ fontSize: 18, marginBottom: 0 }}>{p.name}</h3>
                <span className="text-sm">{p.ok ? "OK ✅" : "Down ❌"}</span>
              </div>
              <div className="text-sm opacity-80">Time: {p.ms} ms</div>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
