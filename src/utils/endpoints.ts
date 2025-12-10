// src/utils/endpoints.ts
const RAW = (import.meta.env.VITE_API_BASE as string) || "https://acquire-intel-api.onrender.com";
export const API_BASE = RAW.replace(/\/+$/, ""); // no trailing slash

export const ENDPOINTS = {
  operatorRequirements: {
    manual: `${API_BASE}/api/operatorRequirements/manual`,   // POST + GET list (same path)
    csv: `${API_BASE}/api/operatorCsvUpload`,                // POST CSV
    pdf: `${API_BASE}/api/operatorRequirements`,             // POST PDF (if used)
    all: `${API_BASE}/api/operatorRequirements/_all`,        // optional debug
  },
  operators: {
    list: `${API_BASE}/api/operators`,
  },
  health: `${API_BASE}/api/health`,
};

export default ENDPOINTS;
