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

// Keep exactly these seven categories across UX/API (chips & pin colors)
const CATEGORIES: Category[] = [
  "lateFilings",
  "leaseExpiring",
  "foodBeverage",
  "retail",
  "driveThru",
  "shoppingMalls",
  "newProperties",
];

// Minimal, readable search box container
const searchBoxContainerStyle: React.CSSProperties = {
  position: "absolute",
  top: 16,
  left: 16,
  zIndex: 5,
  display: "flex",
  gap: 8,
  alignItems: "center",
};

// Enforce readable text (no transparency)
const searchInputStyle: React.CSSProperties = {
  background: "#ffffff",
  color: "#111111",
  borderRadius: 12,
  padding: "10px 12px",
  minWidth: 320,
  border: "1px solid rgba(0,0,0,0.12)",
  outline: "none",
  boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
};

// Modal overlay + card; reuse global teal glow via `teal-glow` on the card.
// Comment: We intentionally avoid guessing your full design system; `teal-glow` is reused per your note.
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "#0e1114",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  border: "1px solid rgba(0,255,255,0.15)",
};

const modalLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  letterSpacing: 0.4,
  marginBottom: 6,
  color: "rgba(255,255,255,0.7)",
  textTransform: "uppercase",
};

const modalInputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f1418",
  color: "#e6f6f5",
  border: "1px solid rgba(0,255,255,0.25)",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
};

const modalRowStyle: React.CSSProperties = { display: "grid", gap: 12 };
const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 12,
};

const tealButtonClass =
  "teal-glow"; /* keep consistent; assume global class exists per brief */
const chipBase =
  "teal-glow"; /* reused on chips for premium soft glow look & consistent spacing */

const mapContainerStyle: React.CSSProperties = { width: "100%", height: "calc(100vh - 80px)" };
const defaultCenter = { lat: 51.5074, lng: -0.1278 }; // London
const defaultZoom = 10;

// Category → marker color (kept stable)
const CATEGORY_COLOR: Record<Category, string> = {
  lateFilings: "#0dd3d3",
  leaseExpiring: "#00c2a8",
  foodBeverage: "#35b0ff",
  retail: "#7c5cff",
  driveThru: "#ff8a4d",
  shoppingMalls: "#ffb300",
  newProperties: "#5ad66f",
};

// SVG path for a clean marker. We use a symbol so we can color by category.
// Why: keeps consistent brand colours without external assets.
const PIN_PATH =
  "M12 2C7.6 2 4 5.6 4 10c0 5.6 8 12 8 12s8-6.4 8-12c0-4.4-3.6-8-8-8zm0 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z";

function categoryIcon(category: Category): google.maps.Symbol {
  return {
    path: PIN_PATH as any,
    fillColor: CATEGORY_COLOR[category],
    fillOpacity: 0.95,
    strokeColor: "white",
    strokeWeight: 1,
    scale: 1.2,
    anchor: new google.maps.Point(12, 22),
  };
}

export default function GoogleMapsView(): JSX.Element {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(
    () => new Set(CATEGORIES),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Category>("retail");
  const [formAddress, setFormAddress] = useState("");

  // Load pins once, then whenever we save.
  const fetchPins = useCallback(async () => {
    const res = await fetch(`${API_BASE_URL}/api/mapPins`, { credentials: "omit" });
    const data = await res.json();
    if (data?.ok && Array.isArray(data.pins)) {
      setPins(data.pins as Pin[]);
    }
  }, []);

  useEffect(() => {
    fetchPins().catch(() => void 0);
  }, [fetchPins]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const auto = autoRef.current;
    if (!auto) return;
    const place = auto.getPlace();
    if (!place || !place.geometry || !place.geometry.location) return;
    const loc = place.geometry.location;
    const lat = loc.lat();
    const lng = loc.lng();
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(14);
  }, []);

  // Reverse geocode address (best-effort, optional).
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!(window as any).google?.maps?.Geocoder) return "";
    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          resolve(results[0].formatted_address ?? "");
        } else {
          resolve("");
        }
      });
    });
  }, []);

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPendingLatLng({ lat, lng });
      setFormTitle("");
      setFormType("retail");
      // Prefill address if possible, but don't block UI.
      const guessed = await reverseGeocode(lat, lng).catch(() => "");
      setFormAddress(guessed || "");
      setModalOpen(true);
    },
    [reverseGeocode],
  );

  // Save → POST /api/mapPins, then refresh.
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data?.ok) {
        await fetchPins();
        setModalOpen(false);
        setPendingLatLng(null);
      } else {
        alert("Failed to save pin.");
      }
    } catch {
      alert("Network error saving pin.");
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

  const filteredPins = useMemo(
    () => pins.filter((p) => selectedCats.has(p.type)),
    [pins, selectedCats],
  );

  if (loadError) return <div style={{ padding: 24 }}>Failed to load Google Maps.</div>;
  if (!isLoaded) return <div style={{ padding: 24 }}>Loading map…</div>;

  return (
    <div style={{ position: "relative" }}>
      {/* Search & Category Chips */}
      <div style={searchBoxContainerStyle}>
        <Autocomplete
          onLoad={(a) => (autoRef.current = a)}
          onPlaceChanged={onPlaceChanged}
        >
          <input
            placeholder="Search places (UK)…"
            style={searchInputStyle}
            aria-label="Search places"
          />
        </Autocomplete>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCats.has(cat);
            return (
              <button
                key={cat}
                type="button"
                className={chipBase}
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,255,255,0.25)",
                  background: active ? "rgba(0,255,255,0.12)" : "rgba(255,255,255,0.06)",
                  color: active ? "#cfffff" : "#e5f7f7",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <GoogleMap
        onLoad={onMapLoad}
        onClick={onMapClick}
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={defaultZoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          styles: undefined,
        }}
      >
        {filteredPins.map((pin, idx) => (
          <Marker
            key={pin.id ?? `${pin.lat},${pin.lng},${idx}`}
            position={{ lat: pin.lat, lng: pin.lng }}
            title={`${pin.title}${pin.address ? " — " + pin.address : ""}`}
            icon={categoryIcon(pin.type)}
          />
        ))}
      </GoogleMap>

      {/* Modal for adding a pin */}
      {modalOpen && (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true" aria-label="Add pin">
          <div className={`teal-glow`} style={modalCardStyle}>
            <h3 style={{ margin: "6px 0 14px", color: "#cfffff", fontSize: 18, fontWeight: 700 }}>
              Add Map Pin
            </h3>

            <div style={modalRowStyle}>
              <label style={modalLabelStyle}>Title *</label>
              <input
                style={modalInputStyle}
                placeholder="e.g., Prime retail unit"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div style={{ height: 12 }} />

            <div style={modalRowStyle}>
              <label style={modalLabelStyle}>Type</label>
              <select
                style={modalInputStyle}
                value={formType}
                onChange={(e) => setFormType(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ height: 12 }} />

            <div style={modalRowStyle}>
              <label style={modalLabelStyle}>Address</label>
              <input
                style={modalInputStyle}
                placeholder="Optional address"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
              />
            </div>

            <div style={modalFooterStyle}>
              <button
                type="button"
                className={tealButtonClass}
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
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={tealButtonClass}
                onClick={onSavePin}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,255,255,0.25)",
                  background:
                    "linear-gradient(135deg, rgba(0,255,255,0.18), rgba(0,255,200,0.18))",
                  color: "#e6fffe",
                  fontWeight: 700,
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
