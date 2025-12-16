// src/views/GoogleMapsView.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

/** Exact 7 categories (API contract) */
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL) as string;
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
  lateFilings: "#00E6E6",
  leaseExpiring: "#00C2A8",
  foodBeverage: "#2FA8FF",
  retail: "#7C5CFF",
  driveThru: "#FF874D",
  shoppingMalls: "#FFB300",
  newProperties: "#5AD66F",
};

// Clean, high-contrast SVG fallback (if Symbol rendering is odd on device)
function svgPin(color: string) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
      <path fill="${color}" stroke="white" stroke-width="1.2"
        d="M12 2c-4.4 0-8 3.6-8 8c0 5.6 8 12 8 12s8-6.4 8-12c0-4.4-3.6-8-8-8zm0 13a4.5 4.5 0 1 1 0-9a4.5 4.5 0 0 1 0 9z"/>
    </svg>`
  );
  return `data:image/svg+xml;charset=UTF-8,${svg}`;
}

function symbolFor(category: Category): google.maps.Symbol {
  return {
    path: "M12 2C7.6 2 4 5.6 4 10c0 5.6 8 12 8 12s8-6.4 8-12c0-4.4-3.6-8-8-8zm0 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" as any,
    fillColor: CATEGORY_COLOR[category],
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.9, // bigger => clearly visible
    anchor: new google.maps.Point(12, 22),
  };
}

const pageWrap: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 12, padding: 16 };
const panelStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(7,20,24,0.98), rgba(7,20,24,0.92))",
  border: "1px solid rgba(0,255,255,0.18)",
  borderRadius: 16,
  padding: 16,
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};
const titleStyle: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: "#e6ffff", margin: 0 };
const row: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" };
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
const infoText: React.CSSProperties = { fontSize: 12, opacity: 0.8, color: "#cfffff", marginLeft: 4 };
const mapContainer: React.CSSProperties = { width: "100%", height: "calc(100vh - 240px)" };
const defaultCenter = { lat: 51.5074, lng: -0.1278 };
const defaultZoom = 12;

/** Safe readers for mixed backends (JSON / text / empty) */
async function readJsonSafe(res: Response): Promise<any | null> {
  const ct = res.headers.get("content-type") || "";
  const len = res.headers.get("content-length");
  if (!ct || Number(len) === 0 || res.status === 204) return null;
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { return null; }
  }
  try {
    const t = await res.text();
    if (t && t.trim().startsWith("{")) {
      try { return JSON.parse(t); } catch { return { text: t }; }
    }
  } catch { /* ignore */ }
  return null;
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
  const [selectedCats, setSelectedCats] = useState<Set<Category>>(new Set(CATEGORIES));

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<Category>("retail");
  const [formAddress, setFormAddress] = useState("");

  const [shouldFitBounds, setShouldFitBounds] = useState<boolean>(true);
  const [health, setHealth] = useState<string>("checking…");
  const [getStatus, setGetStatus] = useState<string>("—");

  const fetchHealth = useCallback(async () => {
    try {
      setHealth("checking…");
      const res = await fetch(`${API_BASE_URL}/api/health`, { mode: "cors" });
      if (!res.ok) setHealth(`down (HTTP ${res.status})`);
      else {
        const j = await readJsonSafe(res);
        setHealth(j?.ok ? "ok" : "ok (no json)");
      }
    } catch {
      setHealth("unreachable");
    }
  }, []);

  const fetchPins = useCallback(async () => {
    try {
      setGetStatus("loading…");
      const res = await fetch(`${API_BASE_URL}/api/mapPins`, { mode: "cors" });
      if (!res.ok) {
        setGetStatus(`HTTP ${res.status}`);
        setPins([]);
        return;
      }
      const data = await readJsonSafe(res);
      const list: Pin[] =
        (data && Array.isArray((data as any).pins) && (data as any).pins) ||
        (Array.isArray(data) ? (data as Pin[]) : []);
      setPins(Array.isArray(list) ? list : []);
      setShouldFitBounds(true);
      setGetStatus("ok");
    } catch {
      setGetStatus("network error");
      setPins([]);
    }
  }, []);

  useEffect(() => {
    fetchHealth().catch(() => void 0);
    fetchPins().catch(() => void 0);
  }, [fetchHealth, fetchPins]);

  useEffect(() => {
    if (!shouldFitBounds || !mapRef.current) return;
    const filtered = pins.filter((p) => selectedCats.has(p.type));
    if (filtered.length === 0) {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(defaultZoom);
      setShouldFitBounds(false);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    filtered.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    setTimeout(() => {
      mapRef.current && mapRef.current.fitBounds(bounds, 60);
      setShouldFitBounds(false);
    }, 0);
  }, [pins, selectedCats, shouldFitBounds]);

  const onPlaceChanged = useCallback(() => {
    const place = autoRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const loc = place.geometry.location;
    mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() });
    mapRef.current?.setZoom(14);
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      if (!(window as any).google?.maps?.Geocoder) return "";
      return await new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results[0]) resolve(results[0].formatted_address ?? "");
          else resolve("");
        });
      });
    } catch {
      return "";
    }
  }, []);

  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setPendingLatLng({ lat, lng });
    setFormTitle("");
    setFormType("retail");
    reverseGeocode(lat, lng).then((addr) => setFormAddress(addr || "")).catch(() => setFormAddress(""));
    setModalOpen(true);
  }, [reverseGeocode]);

  const onSavePin = useCallback(async () => {
    if (!pendingLatLng) return;
    if (!formTitle.trim()) { alert("Title is required."); return; }
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

      if (!res.ok) {
        const payload = await readJsonSafe(res);
        const msg = typeof payload === "string" ? payload : payload?.message || payload?.error || JSON.stringify(payload);
        alert(`Save failed: HTTP ${res.status}${msg ? ` — ${msg}` : ""}`);
        return;
      }

      await readJsonSafe(res).catch(() => null);
      setModalOpen(false);
      setPendingLatLng(null);
      await fetchPins();
      setShouldFitBounds(true);
    } catch (err: any) {
      alert(`Network error saving pin.${err?.message ? ` ${err.message}` : ""}`);
      console.error("POST /api/mapPins network error", err);
    }
  }, [pendingLatLng, formTitle, formType, formAddress, fetchPins]);

  const seedDemoSet = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/mapPins/seed-demo`, { mode: "cors" });
      if (!res.ok) {
        const payload = await readJsonSafe(res);
        alert(`Seed failed: HTTP ${res.status} ${payload ? JSON.stringify(payload) : ""}`);
        return;
      }
      await fetchPins();
      setShouldFitBounds(true);
    } catch (e: any) {
      alert(`Seed failed: ${e?.message || "network error"}`);
    }
  }, [fetchPins]);

  const toggleCategory = useCallback((cat: Category) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    setShouldFitBounds(true);
  }, []);
  const showAll = useCallback(() => { setSelectedCats(new Set(CATEGORIES)); setShouldFitBounds(true); }, []);
  const hideAll = useCallback(() => { setSelectedCats(new Set()); setShouldFitBounds(true); }, []);

  const filteredPins = useMemo(() => pins.filter((p) => selectedCats.has(p.type)), [pins, selectedCats]);

  if (loadError) return <div style={{ padding: 24 }}>Failed to load Google Maps.</div>;
  if (!isLoaded) return <div style={{ padding: 24 }}>Loading map…</div>;

  return (
    <div style={pageWrap}>
      <div className="teal-glow" style={panelStyle}>
        <h2 style={titleStyle}>Google Maps Engine</h2>

        <div style={{ ...row, marginTop: 10, alignItems: "center" }}>
          <button type="button" className="teal-glow" style={actionBtn} onClick={() => alert("Click anywhere on the map to place a pin.")}>
            Click map to place…
          </button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={() => { fetchPins(); setShouldFitBounds(true); }}>
            Refresh
          </button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={showAll}>Show all</button>
          <button type="button" className="teal-glow" style={actionBtn} onClick={hideAll}>Hide all</button>

          <span style={infoText}>Filtered {filteredPins.length} / {pins.length} pins</span>
          <span style={{ ...infoText, marginLeft: 12 }}>API: {health} • GET: {getStatus} • Base: {API_BASE_URL}</span>

          <button type="button" className="teal-glow" style={actionBtn} onClick={seedDemoSet}>Seed demo set</button>
        </div>

        <div style={{ ...row, marginTop: 12 }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCats.has(cat);
            return (
              <button key={cat} type="button" className="teal-glow" onClick={() => toggleCategory(cat)} style={chip(active)} aria-pressed={active}>
                {CATEGORY_LABEL[cat]}
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 12 }}>
          <Autocomplete onLoad={(a) => (autoRef.current = a)} onPlaceChanged={onPlaceChanged}>
            <input placeholder="Search address, store, postcode…" style={searchInput} aria-label="Search places" />
          </Autocomplete>
        </div>
      </div>

      <GoogleMap
        onLoad={(m) => (mapRef.current = m)}
        onClick={onMapClick}
        mapContainerStyle={mapContainer}
        center={defaultCenter}
        zoom={defaultZoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy", // scroll to zoom without holding Ctrl
        }}
      >
        {filteredPins.map((pin, idx) => {
          // Symbol for crisp vector pin; data-url fallback guarantees visibility
          const icon =
            (window as any).google?.maps
              ? symbolFor(pin.type)
              : { url: svgPin(CATEGORY_COLOR[pin.type]) };

          return (
            <Marker
              key={pin.id ?? `${pin.lat},${pin.lng},${idx}`}
              position={{ lat: pin.lat, lng: pin.lng }}
              title={`${pin.title}${pin.address ? " — " + pin.address : ""}`}
              icon={icon as any}
              zIndex={9999}
              opacity={0.98}
            />
          );
        })}
      </GoogleMap>

      {/* Modal (unchanged UI) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add pin"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999,
          }}
        >
          <div
            className="teal-glow"
            style={{
              width: "100%", maxWidth: 520, background: "#0e1114", borderRadius: 16, padding: 20,
              border: "1px solid rgba(0,255,255,0.15)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <h3 style={{ margin: "6px 0 14px", color: "#cfffff", fontSize: 18, fontWeight: 800 }}>Add Map Pin</h3>

            <label style={{ display: "block", fontSize: 12, letterSpacing: 0.4, marginBottom: 6, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Title *</label>
            <input
              style={{ width: "100%", background: "#0f1418", color: "#e6f6f5", border: "1px solid rgba(0,255,255,0.25)", borderRadius: 12, padding: "10px 12px", outline: "none" }}
              placeholder="e.g., Prime retail unit"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />

            <div style={{ height: 12 }} />

            <label style={{ display: "block", fontSize: 12, letterSpacing: 0.4, marginBottom: 6, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Type</label>
            <select
              style={{ width: "100%", background: "#0f1418", color: "#e6f6f5", border: "1px solid rgba(0,255,255,0.25)", borderRadius: 12, padding: "10px 12px", outline: "none" }}
              value={formType}
              onChange={(e) => setFormType(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>

            <div style={{ height: 12 }} />

            <label style={{ display: "block", fontSize: 12, letterSpacing: 0.4, marginBottom: 6, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Address</label>
            <input
              style={{ width: "100%", background: "#0f1418", color: "#e6f6f5", border: "1px solid rgba(0,255,255,0.25)", borderRadius: 12, padding: "10px 12px", outline: "none" }}
              placeholder="Optional address"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 14 }}>
              <button
                type="button"
                className="teal-glow"
                onClick={() => { setModalOpen(false); setPendingLatLng(null); }}
                style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,255,255,0.25)", background: "transparent", color: "#cfffff", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="teal-glow"
                onClick={onSavePin}
                style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid rgba(0,255,255,0.25)", background: "linear-gradient(135deg, rgba(0,255,255,0.18), rgba(0,255,200,0.18))", color: "#e6fffe", fontWeight: 800, cursor: "pointer" }}
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
