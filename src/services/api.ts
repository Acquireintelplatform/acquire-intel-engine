// src/services/api.ts
// Unified API wrapper for GET, POST, PUT, DELETE + FILE UPLOAD

const API_BASE_URL = "https://acquire-intel-api.onrender.com/api";

// Generic JSON request
async function request(method: string, url: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${url}`, options);

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ============================
// EXPORTED JSON HELPERS
// ============================

export function get(url: string) {
  return request("GET", url);
}

export function post(url: string, body?: any) {
  return request("POST", url, body);
}

export function put(url: string, body?: any) {
  return request("PUT", url, body);
}

export function del(url: string) {
  return request("DELETE", url);
}

// ============================
// FILE UPLOAD (FormData)
// ============================

export async function postFile(url: string, formData: FormData) {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    body: formData, // Browser automatically sets multipart/form-data boundary
  });

  if (!res.ok) {
    throw new Error(`File upload error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}
