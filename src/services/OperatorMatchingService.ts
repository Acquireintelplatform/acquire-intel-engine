// src/services/OperatorMatchingService.ts

const BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://acquire-intel-api.onrender.com";

export async function fetchOperatorMatches(postcode: string | null) {
  try {
    const param = postcode ? `?postcode=${encodeURIComponent(postcode)}` : "";

    const res = await fetch(`${BASE_URL}/api/matching/operators${param}`);

    if (!res.ok) {
      throw new Error("Failed to load operator matches");
    }

    const data = await res.json();

    return data;
  } catch (err) {
    console.error("Operator Matching Service Error:", err);
    throw err;
  }
}
