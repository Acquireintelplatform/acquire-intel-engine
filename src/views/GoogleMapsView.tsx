// src/views/googlemapsview.tsx
import React, { useEffect, useRef, useState } from "react";

/** Reads your key from Render env: VITE_GOOGLE_MAPS_API_KEY */
const GOOGLE_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";

/** Lazy-load Google Maps JS API once */
function loadGoogle(apiKey: string): Promise<typeof google> {
  if (!apiKey) return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);

  const existing = document.querySelector<HTMLScriptElement>('script[data-google-loader="1"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve((window as any).google));
      existing.addEventListener("error", () => reject(new Error("Google loader failed")));
    });
  }

  const s = document.createElement("script");
  s.async = true; s.defer = true; s.setAttribute("data-google-loader", "1");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
  document.head.appendChild(s);

  return new Promise((resolve, reject) => {
    s.addEventListener("load", () => resolve((window as any).google));
    s.addEventListener("error", () => reject(new Error("Google loader failed")));
  });
}

export default function GoogleMapsView(): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let map: google.maps.Map | null = null;
    loadGoogle(GOOGLE_KEY)
      .then((g) => {
        if (!mapRef.current) return;

        map = new g.maps.Map(mapRef.current, {
          center: { lat: 51.5074, lng: -0.1278 }, // London
          zoom: 10,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
        });

        new g.maps.Marker({
          position: { lat: 51.50809, lng: -0.12859 },
          title: "London",
          map,
        });
      })
      .catch((e) => setErr(e.message || String(e)));

    return () => { map = null; };
  }, []);

  return (
    <section
      style={{
        borderRadius: 16,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      <h2 className="brand-title">Google Maps Engine</h2>
      {err && (
        <div className="text-red-400 text-sm mb-3">
          {err} — check your <code>VITE_GOOGLE_MAPS_API_KEY</code> on Render.
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          height: "70vh",
          minHeight: 420,
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow:
            "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
    </section>
  );
}
