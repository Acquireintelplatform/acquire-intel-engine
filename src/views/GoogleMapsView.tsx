// src/views/GoogleMapsView.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useRef, useState } from "react";

/** === Keys & API base ============================================== */
const GOOGLE_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";

const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/** === Categories ==================================================== */
type CategoryKey =
  | "lateFilings"
  | "leaseExpiring"
  | "foodBeverage"
  | "retail"
  | "driveThru"
  | "shoppingMalls"
  | "newProperties";

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
  lateFilings: "#4FF4D4", // teal glow family
  leaseExpiring: "#FFB020",
  foodBeverage: "#9b59b6",
  retail: "#1abc9c",
  driveThru: "#3498db",
  shoppingMalls: "#2ecc71",
  newProperties: "#e74c3c",
};

/** === API types ===================================================== */
type ApiPin = {
  id: string;
  type: CategoryKey | string;
  lat: number;
  lng: number;
  title: string;
  address?: string;
  meta?: any;
  createdAt: string;
};

/** Convert API pin → internal marker shape */
const toMarker = (p: ApiPin) => ({
  id: p.id,
  type: (p.type as CategoryKey) || "retail",
  position: { lat: p.lat, lng: p.lng },
  title: p.title || "",
  address: p.address || "",
  meta: p.meta ?? {},
  createdAt: p.createdAt,
});

/** Tiny Google loader (avoids double-loading) */
function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // already loaded
    if ((window as any).google?.maps) return resolve();

    // already requested
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ai="gmaps"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Google Maps failed to load"))
      );
      return;
    }

    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.dataset.ai = "gmaps";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(s);
  });
}

/** Build a colored SVG pin as a data URL */
function makeSvgPin(color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'>
      <defs>
        <filter id='g' x='-50%' y='-50%' width='200%' height='200%'>
          <feDropShadow dx='0' dy='1' stdDeviation='1.5' flood-color='rgba(0,0,0,0.25)'/>
          <feDropShadow dx='0' dy='0' stdDeviation='3' flood-color='${color}33'/>
        </filter>
      </defs>
      <path filter='url(#g)' fill='${color}'
        d='M18 2c-6.1 0-11 4.9-11 11 0 7.5 9 19 11 21 2-2 11-13.5 11-21 0-6.1-4.9-11-11-11zm0 15.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z'/>
    </svg>`
  );
  return `data:image/svg+xml;charset=UTF-8,${svg}`;
}

/** =================== Component ==================================== */
export default function GoogleMapsView(): JSX.Element {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [markers, setMarkers] = useState<
    ReturnType<typeof toMarker>[]
  >([]);
  const [activeCats, setActiveCats] = useState<Set<CategoryKey>>(
    // start with all categories active
    () => new Set(Object.keys(CATEGORY_LABEL) as CategoryKey[])
  );
  const [adding, setAdding] = useState<boolean>(false);

  // Keep track of google Marker instances so we can clear/re-render
  const gMarkersRef = useRef<any[]>([]);

  const visibleMarkers = useMemo(
    () => markers.filter((m) => activeCats.has(m.type)),
    [markers, activeCats]
  );

  /** Load pins from the backend */
  const loadPins = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mapPins`);
      const json = await res.json();
      if (json?.ok && Array.isArray(json.pins)) {
        setMarkers(json.pins.map(toMarker));
      }
    } catch (e) {
      console.error("Failed to load map pins:", e);
    }
  };

  /** Mount Google Maps */
  useEffect(() => {
    (async () => {
      await loadGoogleMaps(GOOGLE_KEY);
      const google = (window as any).google;

      // Map
      const center = { lat: 51.5074, lng: -0.1278 }; // London
      mapRef.current = new google.maps.Map(mapEl.current, {
        center,
        zoom: 9,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: true, // allow dragging the little yellow man
      });

      // Search box
      const input = searchInputRef.current!;
      const searchBox = new google.maps.places.SearchBox(input);
      mapRef.current.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
      mapRef.current.addListener("bounds_changed", () => {
        searchBox.setBounds(mapRef.current.getBounds());
      });
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places || places.length === 0) return;
        const bounds = new google.maps.LatLngBounds();
        places.forEach((p: any) => {
          if (p.geometry?.viewport) bounds.union(p.geometry.viewport);
          else if (p.geometry?.location) bounds.extend(p.geometry.location);
        });
        mapRef.current.fitBounds(bounds);
      });

      // Add-marker mode: click to select point then prompt for details
      mapRef.current.addListener("click", async (ev: any) => {
        if (!adding) return;
        const lat = ev.latLng.lat();
        const lng = ev.latLng.lng();

        // quick inputs
        const type = (prompt(
          `Choose type:\n` +
            Object.entries(CATEGORY_LABEL)
              .map(([k, v]) => `- ${k}: ${v}`)
              .join("\n") +
            `\n\nEnter key exactly (e.g. retail, lateFilings, driveThru):`
        ) || "retail") as CategoryKey;

        const title =
          prompt("Title for this marker (e.g. 'Unit available / Store')") ||
          "Marker";
        const address = prompt("Address (optional)") || "";

        try {
          const res = await fetch(`${API_BASE}/api/mapPins`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type,
              lat,
              lng,
              title,
              address,
              meta: {},
            }),
          });
          const json = await res.json();
          if (!json?.ok) {
            alert("Save failed");
            console.error("Save failed:", json);
          } else {
            await loadPins();
          }
        } catch (err) {
          alert("Save failed");
          console.error(err);
        } finally {
          setAdding(false);
        }
      });

      // First load
      loadPins();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-render Google markers whenever visible set changes */
  useEffect(() => {
    const google = (window as any).google;
    if (!google || !mapRef.current) return;

    // clear old
    gMarkersRef.current.forEach((m) => m.setMap(null));
    gMarkersRef.current = [];

    // draw new
    visibleMarkers.forEach((m) => {
      const icon = {
        url: makeSvgPin(CATEGORY_COLOR[m.type]),
        scaledSize: new google.maps.Size(36, 36),
        anchor: new google.maps.Point(18, 36),
      };
      const gm = new google.maps.Marker({
        map: mapRef.current,
        position: m.position,
        title: m.title,
        icon,
      });

      const html = `
        <div style="min-width:220px">
          <div style="font-weight:600;margin-bottom:4px">${m.title || ""}</div>
          <div style="opacity:.85;margin-bottom:6px">${CATEGORY_LABEL[m.type]}</div>
          ${
            m.address
              ? `<div style="font-size:12px;opacity:.8">${m.address}</div>`
              : ""
          }
        </div>`;
      const info = new google.maps.InfoWindow({ content: html });
      gm.addListener("click", () => info.open({ map: mapRef.current, anchor: gm }));

      gMarkersRef.current.push(gm);
    });
  }, [visibleMarkers]);

  /** UI helpers */
  const toggleCat = (key: CategoryKey) => {
    setActiveCats((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const showAll = () =>
    setActiveCats(new Set(Object.keys(CATEGORY_LABEL) as CategoryKey[]));
  const hideAll = () => setActiveCats(new Set());

  /** Render */
  return (
    <div className="p-4">
      {/* Title */}
      <h1 className="text-2xl font-semibold mb-3">Google Maps Engine</h1>

      {/* Search + actions row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search address, store, postcode…"
          className="px-4 py-2 rounded-lg outline-none"
          style={{
            width: "340px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(79,244,212,.25)",
            boxShadow:
              "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
          }}
        />

        <button
          onClick={() => setAdding((s) => !s)}
          className="px-4 py-2 rounded-xl font-medium"
          style={{
            background: adding ? "#1f9c80" : "#26D3B7",
            color: "#0b1518",
            boxShadow:
              "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
          }}
          title="Click then click on the map to place a marker"
        >
          {adding ? "Click map to place…" : "Add marker"}
        </button>

        <button
          onClick={() => loadPins()}
          className="px-4 py-2 rounded-xl font-medium"
          style={{
            background: "#26D3B7",
            color: "#0b1518",
            boxShadow:
              "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
          }}
        >
          Refresh
        </button>

        <button
          onClick={showAll}
          className="px-3 py-2 rounded-xl font-medium"
          style={{
            background: "#132529",
            color: "#bff9ef",
            border: "1px solid rgba(79,244,212,.25)",
          }}
        >
          Show all
        </button>
        <button
          onClick={hideAll}
          className="px-3 py-2 rounded-xl font-medium"
          style={{
            background: "#132529",
            color: "#bff9ef",
            border: "1px solid rgba(79,244,212,.25)",
          }}
        >
          Hide all
        </button>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-8 mb-4">
        {(Object.keys(CATEGORY_LABEL) as CategoryKey[]).map((k) => {
          const active = activeCats.has(k);
          return (
            <button
              key={k}
              onClick={() => toggleCat(k)}
              className="px-3 py-2 rounded-xl font-semibold"
              style={{
                background: active ? "#0d2024" : "transparent",
                color: active ? "#affff0" : "#a0bdba",
                border: `2px solid ${
                  active ? CATEGORY_COLOR[k] : "rgba(79,244,212,.25)"
                }`,
                boxShadow: active
                  ? `0 0 10px ${CATEGORY_COLOR[k]}44, 0 0 22px ${CATEGORY_COLOR[k]}26`
                  : "none",
              }}
              title={CATEGORY_LABEL[k]}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  marginRight: 8,
                  background: CATEGORY_COLOR[k],
                  verticalAlign: "middle",
                }}
              />
              {CATEGORY_LABEL[k]}
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div
        ref={mapEl}
        style={{
          width: "100%",
          height: "70vh",
          borderRadius: 16,
          border: "1px solid rgba(79,244,212,.25)",
          boxShadow:
            "0 1px 0 rgba(0,0,0,.25), 0 0 18px rgba(47,255,209,.16), 0 0 36px rgba(47,255,209,.10)",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
