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
  newProperties:  "#2FFFD1", // brand teal
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
  { id: 4, title: "Retail – Oxford Street", lat: 51.5154, lng: -0.141,  category: "retail" },
  { id: 5, title: "Drive-thru – Wembley", lat: 51.556,  lng: -0.2796, category: "driveThru" },
  { id: 6, title: "Shopping mall – Westfield", lat: 51.5079, lng: -0.2244, category: "shoppingMalls" },
  { id: 7, title: "New property – Battersea", lat: 51.4794, lng: -0.1447, category: "newProperties" },
];

/* ==== Loader ============================================================== */
function loadGoogle(apiKey: string): Promise<typeof google> {
  if (!apiKey) return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  // @ts-ignore
  if (window.google?.maps) return Promise.resolve((window as any).google);

  const existing = document.querySelector<HTMLScriptElement>('script[data-google-loader="1"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve((window as any).google));
      existing.addEventListener("error", () => reject(new Error("Google loader failed")));
    });
  }

  const s = document.createElement("script");
  s.async = true;
  s.defer = true;
  s.setAttribute("data-google-loader", "1");
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
      <circle c
