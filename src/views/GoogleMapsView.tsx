// src/views/GoogleMapsView.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

type Category =
  | "lateFilings"
  | "leaseExpiring"
  | "foodBeverage"
  | "retail"
  | "driveThru"
  | "shoppingMalls"
  | "newProperties";

type Pin = {
  id?: string | number;
  title: string;
  type: Category;
  lat: number;
  lng: number;
  address?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

const CATEGORIES: Category[] = [
  "lateFilings",
  "leaseExpiring",
  "foodBeverage",
  "retail",
  "driveThru",
  "shoppingMalls",
  "newProperties",
];

const CATEGORY_LABEL: Record<Category, string> = {
  lateFilings: "Late filings",
  leaseExpiring: "Lease expiring",
  foodBeverage: "Food & Beverage",
  retail: "Retail",
  driveThru: "Drive-thru",
  shoppingMalls: "Shopping malls",
  newProperties: "New properties",
};

// Distinct colours per category (visible on map)
const CATEGORY_COLOR: Record<Category, string> = {
  lateFilings: "#0dd3d3",
  leaseExpiring: "#00c2a8",
  foodBeverage: "#35b0ff",
  retail: "#7c5cff",
  driveThru: "#ff8a4d",
  shoppingMalls: "#ffb300",
  newProperties: "#5ad66f",
};

const PIN_PATH =
  "M12 2C7.6 2 4 5.6 4 10c0 5.6 8 12 8 12s8-6.4 8-12c0-4.4-3.6-8-8-8zm0 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z";

function iconFor(category: Category): google.maps.Symbol {
  // WHY: forces coloured symbol per category; avoids default red pin
  return {
    path: PIN_PATH as any,
    fillColor: CATEGORY_COLOR[category],
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 1,
    scale: 1.2,
    anchor: new google.maps.Point(12, 22),
  };
}

const pageWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 16,
};

const panelStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(7,20,24,0.98), rgba(7,20,24,0.92))",
  border: "1px solid rgba(0,255,255,0.18)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#e6ffff",
  margin: 0,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const actionBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,255,255,0.25)",
  background: "rgba(0,255,255,0.10)",
  color: "#e6ffff",
  fontWeight: 700,
  cursor: "pointer",
};

const chip = (active: boolean): React.CSSProperties => ({
  padding: "8px 14px",
  borderRadius: 999,
  border: "1px solid rgba(0,255,255,0.20)",
  background: active ? "rgba(0,255,255,0.12)" : "rgba(255,255,255,0.06)",
  color: active ? "#cfffff" : "#e5f7f7",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.2,
  cursor: "pointer",
});

const searchInput: React.CSSProperties = {
  width: "100%",
  background: "#0f1418",
  color: "#e6f6f5",
  border: "1px solid rgba(0,255,255,0.25)",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

const mapContainer: React.CSSProperties = {
  width: "100%",
  height: "calc(100vh - 220px)", // leaves space for panel
};

const defaultCenter = { lat: 51.5074, lng: -0.1278 };
const defaultZoom = 10;

export default function GoogleMapsView(): JSX.Element {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(CATEGORIES));

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Category>("retail");
  const [formAddress, setFormAddress] = useState("");

  const fetchPins = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mapPins`, { mode: "cors" });
      if (!res.ok) {
        const text = await res.text();
        console.error("GET /api/mapPins failed:", res.status, text);
        return;
      }
      const data = await res.json();
      if (data?.ok && Array.isArray(data.pins)) setPins(data.pins as Pin[]);
    } catch (err) {
      console.error("GET /api/mapPins network error", err);
    }
  }, []);

  useEffect(() => {
    fetchPins().catch(() => void 0);
  }, [fetchPins]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const place = autoRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const loc = place.geometry.location;
    mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() });
    mapRef.current?.setZoom(14);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!(window as any).google?.maps?.Geocoder) return "";
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) resolve(results[0].formatted_address ?? "");
        else resolve("");
      });
    });
  }, []);

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPendingLatLng({ lat, lng });
    setFormTitle("");
    setFormType("retail");
    const guessed = await reverseGeocode(lat, lng).catch(() => "");
    setFormAddress(guessed || "");
    setModalOpen(true);
  }, [reverseGeocode]);

  const onSavePin = useCallback(async () => {
    if (!pendingLatLng) return;
    if (!formTitle.trim()) {
      alert("Title is required.");
      return;
    }
    const body = {
      title: formTitle.trim(),
      type: formType,
      address: formAddress?.trim() || "",
      lat: pendingLatLng.lat,
      lng: pendingLatLng.lng,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/mapPins`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Surface real server errors to debug CORS/validation/route mismatches quickly.
      if (!res.ok) {
        let detail = "";
        try {
          const ct = res.headers.get("content-type") || "";
          if (ct.includes("application/json")) {
            const j = await res.json();
            detail = JSON.stringify(j);
          } else {
            detail = await res.text();
          }
        } catch {
          // ignore parse errors
        }
        alert(`Save failed: HTTP ${res.status}${detail ? ` — ${detail}` : ""}`);
        return;
      }

      const data = await res.json();
      if (data?.ok) {
        await fetchPins();
        setModalOpen(false);
        setPendingLatLng(null);
      } else {
        alert(`Save failed: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      alert(`Network error saving pin.${err?.message ? ` ${err.message}` : ""}`);
      console.error("POST /api/mapPins network error", err);
    }
  }, [pendingLatLng, formTitle, formType, formAddress, fetchPins]);

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);
  const showAll = useCallback(() => setSelectedCats(new Set(CATEGORIES)), []);
  const hideAll = useCallback(() => setSelectedCats(new Set()), []);

  const filteredPins = useMemo(
    () => pins.filter((p) => selectedCats.has(p.type)),
    [pins, selectedCats],
  );

  if (loadError) return <div style={{ padding: 24 }}>Failed to load Google Maps.</div>;
  if (!isLoaded) return <div style={{ padding: 24 }}>Loading map…</div>;

  return (
    <div style={pageWrap}>
      {/* PANEL ABOVE MAP */}
      <div className="teal-glow" style={panelStyle}>
        <h2 style={titleStyle}>Google Maps Engine</h2>

        <div style={{ ...row, marginTop: 10 }}>
          <button
            type="button"
            className="teal-glow"
            style={actionBtn}
            onClick={() => alert("Tip: Click anywhere on the map to place a pin.")}
          >
            Click map to place…
          </button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={() => fetchPins()}>
            Refresh
          </button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={showAll}>
            Show all
          </button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={hideAll}>
            Hide all
          </button>
        </div>

        <div style={{ ...row, marginTop: 12 }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCats.has(cat);
            return (
              <button
                key={cat}
                type="button"
                className="teal-glow"
                onClick={() => toggleCategory(cat)}
                style={chip(active)}
              >
                {CATEGORY_LABEL[cat]}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12 }}>
          <Autocomplete onLoad={(a) => (autoRef.current = a)} onPlaceChanged={onPlaceChanged}>
            <input
              placeholder="Search address, store, postcode…"
              style={searchInput}
              aria-label="Search places"
            />
          </Autocomplete>
        </div>
      </div>

      {/* MAP BELOW PANEL */}
      <GoogleMap
        onLoad={onMapLoad}
        onClick={onMapClick}
        mapContainerStyle={mapContainer}
        center={defaultCenter}
        zoom={defaultZoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        }}
      >
        {filteredPins.map((pin, idx) => (
          <Marker
            key={pin.id ?? `${pin.lat},${pin.lng},${idx}`}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={`${pin.title}${pin.address ? " — " + pin.address : ""}`}
            icon={iconFor(pin.type)}
          />
        ))}
      </GoogleMap>

      {/* ADD PIN MODAL */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add pin"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="teal-glow"
            style={{
              width: "100%",
              maxWidth: 520,
              background: "#0e1114",
              borderRadius: 16,
              padding: 20,
              border: "1px solid rgba(0,255,255,0.15)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <h3 style={{ margin: "6px 0 14px", color: "#cfffff", fontSize: 18, fontWeight: 800 }}>
              Add Map Pin
            </h3>

            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: 0.4,
                marginBottom: 6,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
              }}
            >
              Title *
            </label>
            <input
              style={{
                width: "100%",
                background: "#0f1418",
                color: "#e6f6f5",
                border: "1px solid rgba(0,255,255,0.25)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
              placeholder="e.g., Prime retail unit"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            <div style={{ height: 12 }} />

            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: 0.4,
                marginBottom: 6,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
              }}
            >
              Type
            </label>
            <select
              style={{
                width: "100%",
                background: "#0f1418",
                color: "#e6f6f5",
                border: "1px solid rgba(0,255,255,0.25)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
              value={formType}
              onChange={(e) => setFormType(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>

            <div style={{ height: 12 }} />

            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: 0.4,
                marginBottom: 6,
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
              }}
            >
              Address
            </label>
            <input
              style={{
                width: "100%",
                background: "#0f1418",
                color: "#e6f6f5",
                border: "1px solid rgba(0,255,255,0.25)",
                borderRadius: 12,
                padding: "10px 12px",
                outline: "none",
              }}
              placeholder="Optional address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <button
                type="button"
                className="teal-glow"
                onClick={() => {
                  setModalOpen(false);
                  setPendingLatLng(null);
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,255,255,0.25)",
                  background: "transparent",
                  color: "#cfffff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="teal-glow"
                onClick={onSavePin}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,255,255,0.25)",
                  background:
                    "linear-gradient(135deg, rgba(0,255,255,0.18), rgba(0,255,200,0.18))",
                  color: "#e6fffe",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
