// src/distress/helpers.js

// Simple delay helper
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
