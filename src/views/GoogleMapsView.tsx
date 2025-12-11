// src/views/googlemapsview.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Reads your key from Render env: VITE_GOOGLE_MAPS_API_KEY */
const GOOGLE_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";

/* ==== Categories (7) ====================================================== */
type CategoryKey =
  | "lateFilings"       // 1
  | "leaseExpiring"     // 2
  | "foodBeverage"      // 3
  | "retail"            // 4
  | "driveThru"         // 5
  | "shoppingMalls"     // 6
  | "newProperties";    // 7

const CATEGORY_LABEL: Record<CategoryKey, string> = {
  lateFilings: "Late filings",
  leaseExpiring: "Lease expiring",
  foodBeverage: "Food & Beverage",
  retail: "Retail",
  driveThru: "Drive-thru",
  shoppingMalls: "Shopping malls",
  newProperties: "New properties",
};

const CATEGORY_COLOR: Record<CategoryKey, string> = {
  lateFilings:    "#FF4D4D",
  leaseExpiring:  "#FFB020",
  foodBeverage:   "#22C55E",
  retail:         "#60A5FA",
  driveThru:      "#A78BFA",
  shoppingMalls:  "#F472B6",
  newProperties:  "#2FFFD1",
};

/* ==== Demo data (replace with API later) ================================== */
type Pin = {
  id: string | number;
  title: string;
  lat: number;
  lng: number;
  category: CategoryKey;
  note?: string;
};

const DEMO_PINS: Pin[] = [
  { id: 1, title: "Late filing – Soho Ltd", lat: 51.5136, lng: -0.1365, category: "lateFilings" },
  { id: 2, title: "Lease expiring – Shoreditch", lat: 51.5262, lng: -0.0779, category: "leaseExpiring" },
  { id: 3, title: "F&B – Covent Garden", lat: 51.5129, lng: -0.1247, category: "foodBeverage" },
  { id: 4, title: "Retail – Oxford Street", lat: 51.5154, lng: -0.1410, category: "retail" },
  { id: 5, title: "Drive-thru – Wembley", lat: 51.5560, lng: -0.2796, category: "driveThru" },
  { id: 6, title: "Shopping mall – Westfield", lat: 51.5079, lng: -0.2244, category: "shoppingMalls" },
  { id: 7, title: "New property – Battersea", lat: 51.4794, lng: -0.1447, category: "newProperties" },
];

/* ==== Loader ============================================================== */
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

/* ==== Pin icon (SVG) ====================================================== */
function svgPin(color: string, label?: string): google.maps.Icon {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="48" viewBox="0 0 34 48">
      <defs>
        <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="${color}" flood-opacity="0.45"/>
        </filter>
      </defs>
      <path filter="url(#g)" d="M17 0c9 0 17 7.16 17 16 0 11.76-14.06 29.39-16.01 31.74a1.3 1.3 0 0 1-1.98 0C14.06 45.39 0 27.76 0 16 0 7.16 8 0 17 0z" fill="${color}"/>
      <circle cx="17" cy="16" r="7" fill="#0B0F14" fill-opacity="0.9"/>
      ${label ? `<text x="17" y="20.5" text-anchor="middle" font-size="10" font-family="Inter,Arial" fill="#E7FEF9" font-weight="700">${label}</text>` : ``}
    </svg>`;
  return {
    url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(34, 48),
    anchor: new google.maps.Point(17, 48),
  };
}

/* ==== Component =========================================================== */
export default function GoogleMapsView(): JSX.Element {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const panoRef = useRef<HTMLDivElement | null>(null);

  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<Record<CategoryKey, boolean>>({
    lateFilings: true,
    leaseExpiring: true,
    foodBeverage: true,
    retail: true,
    driveThru: true,
    shoppingMalls: true,
    newProperties: true,
  });

  const activeCategories = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k as CategoryKey),
    [selected]
  );

  useEffect(() => {
    let map: google.maps.Map | null = null;
    let markers: google.maps.Marker[] = [];
    let infowindow: google.maps.InfoWindow | null = null;
    let panorama: google.maps.StreetViewPanorama | null = null;
    let svService: google.maps.StreetViewService | null = null;

    loadGoogle(GOOGLE_KEY)
      .then((g) => {
        if (!mapRef.current || !panoRef.current) return;

        // Map
        map = new g.maps.Map(mapRef.current, {
          center: { lat: 51.5074, lng: -0.1278 }, // London
          zoom: 11,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false, // we manage our own split panel
        });

        // Street View (right panel)
        panorama = new g.maps.StreetViewPanorama(panoRef.current, {
          addressControl: false,
          linksControl: true,
          panControl: false,
          fullscreenControl: true,
          motionTracking: false,
          visible: false, // only show after a pin click with coverage
        });

        svService = new g.maps.StreetViewService();
        infowindow = new g.maps.InfoWindow();

        function openStreetViewAt(latLng: google.maps.LatLngLiteral) {
          if (!svService || !panorama) return;
          svService.getPanorama({ location: latLng, radius: 50 }, (data, status) => {
            if (status === g.maps.StreetViewStatus.OK && data && data.location) {
              panorama!.setPano(data.location.pano);
              panorama!.setPov({ heading: 0, pitch: 0 });
              panorama!.setVisible(true); // show panel
            } else {
              panorama!.setVisible(false); // hide if no coverage
            }
          });
        }

        function draw() {
          markers.forEach(m => m.setMap(null));
          markers = [];

          DEMO_PINS.filter(p => selected[p.category]).forEach((p) => {
            const m = new g.maps.Marker({
              position: { lat: p.lat, lng: p.lng },
              title: p.title,
              icon: svgPin(CATEGORY_COLOR[p.category]),
              map,
            });

            m.addListener("click", () => {
              const latLng = { lat: p.lat, lng: p.lng };
              infowindow!.setContent(
                `<div style="min-width:240px">
                  <div style="font-weight:700;margin-bottom:4px">${p.title}</div>
                  <div style="opacity:.8;margin-bottom:6px">${CATEGORY_LABEL[p.category]}</div>
                  <div style="opacity:.75;font-size:12px">Click opened Street View →</div>
                </div>`
              );
              infowindow!.open({ map: map!, anchor: m });
              openStreetViewAt(latLng);
              map!.panTo(latLng);
            });

            markers.push(m);
          });
        }

        draw();

        return () => {
          markers.forEach(m => m.setMap(null));
          markers = [];
          infowindow?.close();
          panorama?.setVisible(false);
        };
      })
      .catch((e) => setErr(e.message || String(e)));

    return () => {
      map = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selected)]);

  function toggle(k: CategoryKey) {
    setSelected((s) => ({ ...s, [k]: !s[k] }));
  }
  function setAll(v: boolean) {
    setSelected({
      lateFilings: v, leaseExpiring: v, foodBeverage: v, retail: v,
      driveThru: v, shoppingMalls: v, newProperties: v
    });
  }

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
          {err} — check <code>VITE_GOOGLE_MAPS_API_KEY</code> on Render.
        </div>
      )}

      {/* Legend / Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        {(
          [
            "lateFilings",
            "leaseExpiring",
            "foodBeverage",
            "retail",
            "driveThru",
            "shoppingMalls",
            "newProperties",
          ] as CategoryKey[]
        ).map((k) => (
          <button
            key={k}
            className="brand-btn"
            onClick={() => toggle(k)}
            title={CATEGORY_LABEL[k]}
            style={{
              borderColor: selected[k]
                ? "rgba(47,255,209,0.55)"
                : "rgba(255,255,255,0.18)",
              boxShadow: selected[k]
                ? "0 0 0 1px rgba(47,255,209,0.35) inset, 0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)"
                : "0 0 0 1px rgba(255,255,255,0.12) inset",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: CATEGORY_COLOR[k],
                boxShadow: "0 0 6px " + CATEGORY_COLOR[k],
                marginRight: 8,
              }}
            />
            {CATEGORY_LABEL[k]}
          </button>
        ))}

        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 8 }}>
          <button className="brand-btn" onClick={() => setAll(true)}>Show all</button>
          <button className="brand-btn" onClick={() => setAll(false)}>Hide all</button>
        </span>
      </div>

      {/* Split layout: Map (left) + Street View (right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
        }}
      >
        {/* responsive: stack on small, split on >= 1024px */}
        <style>{`
          @media (min-width: 1024px) {
            .split-panels { grid-template-columns: 65% 35%; }
          }
        `}</style>

        <div className="split-panels" style={{ display: "grid", gap: 12 }}>
          <div
            ref={mapRef}
            style={{
              height: "60vh",
              minHeight: 360,
              width: "100%",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow:
                "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
