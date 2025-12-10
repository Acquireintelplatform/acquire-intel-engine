// src/views/HealthView.tsx
import React, { useEffect, useState } from "react";
import ENDPOINTS, { API_BASE } from "@/utils/endpoints";

type Check = {
  label: string;
  ok: boolean;
  ms: number;
  error?: string;
};

export default function HealthView() {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Operators", ok: false, ms: 0 },
    { label: "Properties", ok: false, ms: 0 },
    { label: "Distress", ok: false, ms: 0 },
    { label: "Scraper", ok: false, ms: 0 },
  ]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const t0 = performance.now();
      try {
        const res = await fetch(ENDPOINTS.health, { cache: "no-store" });
        const t1 = performance.now();
        const ok = res.ok;
        const ms = Math.round(t1 - t0);
        const updated = checks.map((c) => ({ ...c, ok, ms, error: ok ? undefined : `HTTP ${res.status}` }));
        if (!cancelled) setChecks(updated);
      } catch (e: any) {
        const t1 = performance.now();
        const ms = Math.round(t1 - t0);
        const updated = checks.map((c) => ({ ...c, ok: false, ms, error: "Failed to fetch" }));
        if (!cancelled) setChecks(updated);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-extrabold mb-2">System Health</h1>
      <p className="opacity-80 mb-6">API base: {API_BASE}</p>

      <div className="grid md:grid-cols-2 gap-6">
        {checks.map((c) => (
          <div key={c.label} className="rounded-xl p-5 border border-teal-700/30 bg-[#0f2730] shadow-lg">
            <h3 className="text-xl font-semibold mb-2">{c.label}</h3>
            <p>Status: {c.ok ? "OK ✅" : "Problem ❌"}</p>
            <p>Time: {c.ms} ms</p>
            {!c.ok && <p className="text-red-400">{c.error || "Unknown error"}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
