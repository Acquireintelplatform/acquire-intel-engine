// src/services/auth.ts

const API_BASE = "https://acquire-intel-api.onrender.com";

/**
 * DEV LOGIN (RS / HD bypass)
 */
export async function devLogin(code: string) {
  const allowed = ["RS", "HD"];

  return {
    ok: allowed.includes(code.toUpperCase()),
    token: "dev-token",
  };
}

/**
 * REAL LOGIN (future use — API authentication)
 */
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    return { ok: false };
  }

  const data = await res.json();
  return { ok: true, token: data.token };
}

export default {
  devLogin,
  login,
};
