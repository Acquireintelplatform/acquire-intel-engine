// src/views/GoogleMapsView.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

/** === Config (env + API base) ========================================== */
const GOOGLE_KEY: string =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) || "";

const API_BASE: string =
  ((import.meta as any).env?.VITE_API_BASE_URL as string) ||
  "https://acquire-intel-api.onrender.com";

/** === Categories ======================================================== */
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
  foodBeverage: "#8E44FF",
  retail: "#00A870",
  driveThru: "#3B82F6",
  shoppingMalls: "#10B981",
  newProperties: "#FF5A5F",
};

const ALL_CATEGORIES: CategoryKey[] = Object.keys(CATEGORY_LABEL) as CategoryKey[];

/** === Types ============================================================= */
type Pin = {
  id: string;
  title: string;
  type: CategoryKey;
  address?: string;
  lat: number;
  lng: number;
  createdAt?: string;
  meta?: any;
};

/** === Map container/style ============================================== */
const MAP_CONTAINER_STYLE: google.maps.MapOptions["styles"] | undefined = undefined;
const MAP_DIMENSIONS = { width: "100%", height: "76vh" };

const DEFAULT_CENTER = { lat: 51.507351, lng: -0.127758 }; // London

/** Make a simple colored pin symbol */
function makePin(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#0C1E1B",
    strokeWeight: 2,
  };
}

/** ================================================================
 *  Main View
 *  ================================================================ */
const GoogleMapsView: React.FC = () => {
  const mapRef = useRef<google.maps.Map | null>(null);

  const [pins, setPins] = useState<Pin[]>([]);
  const [visibleCats, setVisibleCats] = useState<Record<CategoryKey, boolean>>(
    () =>
      ALL_CATEGORIES.reduce((acc, k) => {
        acc[k] = true;
        return acc;
      }, {} as Record<CategoryKey, boolean>)
  );

  const [search, setSearch] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  /** Load pins from API */
  const loadPins = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mapPins`);
      const data = await res.json();
      if (res.ok && data?.ok) {
        setPins(data.pins || []);
      } else {
        console.error("Load pins failed:", data);
      }
    } catch (e) {
      console.error("Load pins error:", e);
    }
  }, []);

  useEffect(() => {
    loadPins();
    // Expose a quick refresher in case we need it
    (window as any).__reloadPins = loadPins;
  }, [loadPins]);

  /** Show all / Hide all */
  const showAll = useCallback(() => {
    setVisibleCats(
      ALL_CATEGORIES.reduce((acc, k) => {
        acc[k] = true;
        return acc;
      }, {} as Record<CategoryKey, boolean>)
    );
  }, []);

  const hideAll = useCallback(() => {
    setVisibleCats(
      ALL_CATEGORIES.reduce((acc, k) => {
        acc[k] = false;
        return acc;
      }, {} as Record<CategoryKey, boolean>)
    );
  }, []);

  /** Toggle a single category */
  const toggleCat = useCallback((k: CategoryKey) => {
    setVisibleCats((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  /** Filtered pins to render */
  const filteredPins = useMemo(
    () => pins.filter((p) => visibleCats[p.type]),
    [pins, visibleCats]
  );

  /** Search → geocode → pan */
  const onSearch = useCallback(async () => {
    const g = (window as any).google;
    if (!mapRef.current || !g?.maps?.Geocoder) return;
    if (!search.trim()) return;

    try {
      const geocoder = new g.maps.Geocoder();
      const res = await geocoder.geocode({ address: search.trim() });
      const location = res?.results?.[0]?.geometry?.location;
      if (location) {
        mapRef.current.panTo(location);
        mapRef.current.setZoom(15);
      }
    } catch (e) {
      console.error("Geocode error:", e);
    }
  }, [search]);

  /** Fallback, full-screen safe: prompt-based add */
  const promptAndAddPin = useCallback(
    async (lat: number, lng: number) => {
      try {
        const title = window.prompt("Pin title", "Test pin");
        if (!title) return;

        const type = (window
          .prompt(
            'Type (one of): lateFilings | leaseExpiring | foodBeverage | retail | driveThru | shoppingMalls | newProperties',
            "retail"
          )
          ?.trim() || "") as CategoryKey;

        if (!ALL_CATEGORIES.includes(type)) {
          alert("Invalid type.");
          return;
        }

        const address =
          window.prompt("Address (optional)", `${lat.toFixed(6)}, ${lng.toFixed(6)}`) || "";

        const res = await fetch(`${API_BASE}/api/mapPins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, type, address, lat, lng }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          alert(`Save failed: ${data?.error || res.statusText}`);
          return;
        }
        await loadPins();
      } catch (e: any) {
        alert(`Save failed: ${e?.message || e}`);
      }
    },
    [loadPins]
  );

  /** Handle map click */
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isPlacing) return;
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat != null && lng != null) {
        // fallback prompt-add
        promptAndAddPin(lat, lng);
        setIsPlacing(false);
      }
    },
    [isPlacing, promptAndAddPin]
  );

  const onLoadMap = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  /** Render buttons (compact) */
  const Button: React.FC<
    React.PropsWithChildren<{ onClick?: () => void; active?: boolean }>
  > = ({ onClick, active, children }) => (
    <button
      onClick={onClick}
      className="rounded-xl px-4 py-2 mx-1 my-1 text-sm font-semibold shadow-[0_1px_0_rgba(0,0,0,.25),0_0_10px_rgba(47,255,209,.20),0_0_24px_rgba(47,255,209,.14)]"
      style={{
        background: active ? "rgba(47,255,209,0.18)" : "rgba(47,255,209,0.10)",
        border: "1px solid rgba(47,255,209,0.35)",
        color: "#B9FFF2",
      }}
    >
      {children}
    </button>
  );

  return (
    <div className="px-4 pb-8">
      <h1 className="text-3xl font-semibold mb-4">Google Maps Engine</h1>

      <div className="flex flex-wrap items-center mb-3">
        <Button onClick={() => setIsPlacing((s) => !s)} active={isPlacing}>
          Click map to place…
        </Button>
        <Button onClick={loadPins}>Refresh</Button>
        <Button onClick={showAll}>Show all</Button>
        <Button onClick={hideAll}>Hide all</Button>
      </div>

      <div className="flex flex-wrap items-center mb-3">
        {ALL_CATEGORIES.map((k) => (
          <Button key={k} onClick={() => toggleCat(k)} active={visibleCats[k]}>
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-[2px]"
              style={{ background: CATEGORY_COLOR[k] }}
            />
            {CATEGORY_LABEL[k]}
          </Button>
        ))}
      </div>

      <div className="mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder="Search address, store, postcode…"
          className="w-full max-w-xl rounded-xl px-4 py-3"
          style={{
            background: "rgba(9, 30, 27, 0.9)",
            color: "#DFFCF6",
            border: "1px solid rgba(47,255,209,.28)",
            boxShadow:
              "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
          }}
        />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(47,255,209,.28)",
          boxShadow:
            "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)",
        }}
      >
        <LoadScript googleMapsApiKey={GOOGLE_KEY} libraries={["places"]}>
          <GoogleMap
            mapContainerStyle={MAP_DIMENSIONS}
            center={DEFAULT_CENTER}
            zoom={12}
            options={{
              styles: MAP_CONTAINER_STYLE,
              streetViewControl: true,
              fullscreenControl: true,
              mapTypeControl: false,
              clickableIcons: true,
            }}
            onClick={onMapClick}
            onLoad={onLoadMap}
          >
            {filteredPins.map((p) => (
              <Marker
                key={p.id}
                position={{ lat: p.lat, lng: p.lng }}
                title={`${p.title} — ${CATEGORY_LABEL[p.type]}`}
                icon={makePin(CATEGORY_COLOR[p.type])}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default GoogleMapsView;
