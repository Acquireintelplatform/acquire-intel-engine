// src/views/GoogleMapsView.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";

/**
 * WHY: Keep the exact 7 categories in API/UX, but show human labels in chips.
 */
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

const mapContainerStyle: React.CSSProperties = {
  width: "100%",
  height: "calc(100vh - 80px)",
};

const panelWrapStyle: React.CSSProperties = {
  position: "absolute",
  top: 14,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 5,
  width: "min(1100px, calc(100% - 32px))",
};

const panelStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(7,20,24,0.98), rgba(7,20,24,0.92))",
  border: "1px solid rgba(0,255,255,0.18)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#e6ffff",
  margin: "0 0 10px 0",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 14,
  border: "1px solid rgba(0,255,255,0.25)",
  background: "rgba(0,255,255,0.10)",
  color: "#e6ffff",
  fontWeight: 700,
  cursor: "pointer",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
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

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  background: "#0f1418",
  color: "#e6f6f5",
  border: "1px solid rgba(0,255,255,0.25)",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(
    () => new Set(CATEGORIES),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Category>("retail");
  const [formAddress, setFormAddress] = useState("");

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

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setPendingLatLng({ lat, lng });
      setFormTitle("");
      setFormType("retail");
      const guessed = await reverseGeocode(lat, lng).catch(() => "");
      setFormAddress(guessed || "");
      setModalOpen(true);
    },
    [reverseGeocode],
  );

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

  const showAll = useCallback(() => setSelectedCats(new Set(CATEGORIES)), []);
  const hideAll = useCallback(() => setSelectedCats(new Set()), []);

  const filteredPins = useMemo(
    () => pins.filter((p) => selectedCats.has(p.type)),
    [pins, selectedCats],
  );

  if (loadError) return <div style={{ padding: 24 }}>Failed to load Google Maps.</div>;
  if (!isLoaded) return <div style={{ padding: 24 }}>Loading map…</div>;

  return (
    <div style={{ position: "relative" }}>
      {/* PREMIUM CONTROL PANEL (matches your older layout) */}
      <div style={panelWrapStyle}>
        <div className="teal-glow" style={panelStyle}>
          <div style={titleStyle}>Google Maps Engine</div>

          {/* Top action buttons */}
          <div style={{ ...rowStyle, marginBottom: 12 }}>
            <button
              type="button"
              className="teal-glow"
              style={buttonStyle}
              // NOTE: Map click opens the modal; this button is a hint-only.
              onClick={() => alert("Tip: Click anywhere on the map to place a pin.")}
            >
              Click map to place…
            </button>
            <button
              type="button"
              className="teal-glow"
              style={buttonStyle}
              onClick={() => fetchPins()}
            >
              Refresh
            </button>
            <button type="button" className="teal-glow" style={buttonStyle} onClick={showAll}>
              Show all
            </button>
            <button type="button" className="teal-glow" style={buttonStyle} onClick={hideAll}>
              Hide all
            </button>
          </div>

          {/* Category chips */}
          <div style={{ ...rowStyle, marginBottom: 12 }}>
            {CATEGORIES.map((cat) => {
              const active = selectedCats.has(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className="teal-glow"
                  onClick={() => toggleCategory(cat)}
                  style={chipStyle(active)}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              );
            })}
          </div>

          {/* Search input (full width row, below chips) */}
          <Autocomplete onLoad={(a) => (autoRef.current = a)} onPlaceChanged={onPlaceChanged}>
            <input
              placeholder="Search address, store, postcode…"
              style={searchInputStyle}
              aria-label="Search places"
            />
          </Autocomplete>
        </div>
      </div>

      {/* MAP */}
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
