// src/views/GoogleMapsView.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/** Keys & API base (keeps your env + fallback) */
const GOOGLE_KEY: string =
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";
const API_BASE: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://acquire-intel-api.onrender.com";

/** Categories */
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
  lateFilings: "#44FFD4",
  leaseExpiring: "#FFB020",
  foodBeverage: "#B055FF",
  retail: "#38E1A8",
  driveThru: "#3BA3FF",
  shoppingMalls: "#35D19A",
  newProperties: "#FF5252",
};

type Pin = {
  id: string;
  type: CategoryKey;
  lat: number;
  lng: number;
  title: string;
  address?: string;
  meta?: any;
  createdAt?: string;
};

declare global {
  interface Window {
    google: any;
  }
}

function loadGoogle(key: string) {
  if (window.google?.maps) return Promise.resolve();
  const id = "gmaps-sdk";
  if (document.getElementById(id)) {
    return new Promise<void>((res) => {
      const ready = () => window.google?.maps && res();
      const t = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(t);
          res();
        }
      }, 100);
    });
  }
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.defer = true;
  s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
  document.head.appendChild(s);
  return new Promise<void>((res, rej) => {
    s.onload = () => res();
    s.onerror = rej;
  });
}

export default function GoogleMapsView(): JSX.Element {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markersRef = useRef<any[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [placing, setPlacing] = useState<boolean>(false);
  const [selected, setSelected] = useState<Set<CategoryKey>>(
    () => new Set(Object.keys(CATEGORY_LABEL) as CategoryKey[])
  );
  const selectedArray = useMemo(() => Array.from(selected), [selected]);

  /** Fetch pins */
  const fetchPins = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/mapPins`, { credentials: "omit" });
      const j = await r.json();
      if (j?.ok && Array.isArray(j.pins)) {
        setPins(j.pins);
      }
    } catch (e) {
      console.error("fetchPins failed", e);
    }
  };

  /** Post new pin */
  const postPin = async (pin: Omit<Pin, "id">) => {
    try {
      const r = await fetch(`${API_BASE}/api/mapPins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pin),
      });
      const j = await r.json();
      if (j?.ok) {
        await fetchPins();
      } else {
        alert(j?.error || "Save failed");
      }
    } catch {
      alert("Save failed");
    }
  };

  /** Init map once */
  useEffect(() => {
    (async () => {
      await loadGoogle(GOOGLE_KEY);
      if (!mapDivRef.current) return;

      const center = { lat: 51.5074, lng: -0.1278 }; // London default
      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: 11,
        disableDefaultUI: true,
        styles: [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });

      // Places search box
      if (searchInputRef.current) {
        const sb = new window.google.maps.places.SearchBox(
          searchInputRef.current
        );
        mapRef.current.controls[
          window.google.maps.ControlPosition.TOP_LEFT
        ].push(searchInputRef.current);

        sb.addListener("places_changed", () => {
          const places = sb.getPlaces();
          if (!places || !places.length) return;
          const bounds = new window.google.maps.LatLngBounds();
          places.forEach((p: any) => {
            if (p.geometry?.viewport) bounds.union(p.geometry.viewport);
            else if (p.geometry?.location) bounds.extend(p.geometry.location);
          });
          mapRef.current.fitBounds(bounds);
        });
      }

      // Click-to-place flow
      mapRef.current.addListener("click", async (ev: any) => {
        if (!placing) return;
        const lat = ev.latLng.lat();
        const lng = ev.latLng.lng();

        // Simple reliable prompts
        const title = window.prompt("Title for this marker?");
        if (!title) return;
        // Choose type from quick list
        const typeChoice = window.prompt(
          `Type (one of):\n${Object.keys(CATEGORY_LABEL).join(", ")}\n\nDefault: newProperties`
        ) as CategoryKey | null;
        const type =
          (typeChoice as CategoryKey) && CATEGORY_LABEL[typeChoice as CategoryKey]
            ? (typeChoice as CategoryKey)
            : ("newProperties" as CategoryKey);

        const address = window.prompt("Address (optional):") || "";

        await postPin({ title, type, lat, lng, address });
      });

      await fetchPins();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Rebuild map markers when pins or selection changes */
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Clear old
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const visiblePins = pins.filter((p) => selected.has(p.type));

    visiblePins.forEach((p) => {
      const m = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapRef.current,
        title: `${CATEGORY_LABEL[p.type]} • ${p.title}`,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          strokeColor: CATEGORY_COLOR[p.type],
          fillColor: CATEGORY_COLOR[p.type],
          fillOpacity: 1,
          strokeWeight: 1,
        },
      });

      const infowindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family:Inter,system-ui,-apple-system,Segoe UI;
                      color:#e9feff">
            <div style="font-weight:700;margin-bottom:4px">${p.title}</div>
            <div style="opacity:.9;margin-bottom:6px">${CATEGORY_LABEL[p.type]}</div>
            ${
              p.address
                ? `<div style="opacity:.8">${p.address}</div>`
                : `<div style="opacity:.6">No address</div>`
            }
          </div>
        `,
      });
      m.addListener("click", () => infowindow.open(mapRef.current, m));
      markersRef.current.push(m);
    });
  }, [pins, selected]);

  /** UI helpers */
  const togglePlacing = () => setPlacing((v) => !v);

  const toggleCategory = (k: CategoryKey) => {
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const showAll = () =>
    setSelected(new Set(Object.keys(CATEGORY_LABEL) as CategoryKey[]));
  const hideAll = () => setSelected(new Set());

  /** Styles */
  const pill = (active = true) =>
    `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
     ${active ? "bg-[#14ffd11f] hover:bg-[#14ffd12a]" : "bg-[#0e2a34] opacity-70"}
     border border-[#2fffd1]/30 shadow-[0_0_0_1px_rgba(20,255,209,.1),0_0_18px_rgba(20,255,209,.12)]
     transition`;

  return (
    <div className="p-6">
      {/* Search + controls */}
      <div className="mb-3 flex flex-wrap gap-3 items-center">
        <button className={pill(placing)} onClick={togglePlacing}>
          {placing ? "Click map to place…" : "Click map to place…"}
        </button>
        <button className={pill()} onClick={fetchPins}>
          Refresh
        </button>
        <button className={pill()} onClick={showAll}>
          Show all
        </button>
        <button className={pill()} onClick={hideAll}>
          Hide all
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(CATEGORY_LABEL) as CategoryKey[]).map((k) => (
          <button
            key={k}
            className={pill(selected.has(k))}
            onClick={() => toggleCategory(k)}
            title={CATEGORY_LABEL[k]}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 9999,
                background: CATEGORY_COLOR[k],
              }}
            />
            {CATEGORY_LABEL[k]}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-[#2fffd1]/25 shadow-[0_0_0_1px_rgba(20,255,209,.08),0_0_30px_rgba(20,255,209,.15)]">
        {/* Search input pinned to map (styled, opaque, readable) */}
        <input
          ref={searchInputRef}
          placeholder="Search address, store, postcode…"
          className="absolute z-[5] top-3 left-3 px-4 py-2 rounded-xl outline-none"
          style={{
            background: "#07232b",
            border: "1px solid rgba(47,255,209,.35)",
            color: "#e9feff",
            width: 320,
            boxShadow:
              "0 0 0 1px rgba(20,255,209,.08), 0 0 16px rgba(20,255,209,.14)",
          }}
        />

        <div ref={mapDivRef} style={{ width: "100%", height: "74vh" }} />
      </div>

      {/* Map + PAC (autocomplete) theming */}
      <style>{`
        .pac-target-input,
        .pac-target-input:focus {
          background: #07232b !important;
          color: #e9feff !important;
          border: 1px solid rgba(47,255,209,.35) !important;
        }
        .pac-container {
          background: #061e26 !important;
          color: #e9feff !important;
          border: 1px solid rgba(47,255,209,.25);
          box-shadow: 0 0 24px rgba(47,255,209,.14) !important;
        }
        .pac-item { color:#e9feff !important; }
        .pac-item:hover { background:#0c2b35 !important; }
        .pac-item-query { color:#a9ffef !important; }
      `}</style>
    </div>
  );
}
