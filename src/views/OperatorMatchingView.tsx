// src/views/OperatorMatchingView.tsx
import React from "react";

/**
 * Operator Matching (placeholder)
 * Step 2 only creates the view component.
 * In the next step we'll wire this into the router so you can navigate to it.
 */
export default function OperatorMatchingView() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold mb-4">Operator Matching</h1>

      <p className="opacity-80 mb-6">
        This screen will help you match operator requirements (where brands want
        to open) with properties and your saved searches. We’re adding it in
        small, safe steps so nothing breaks.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="text-xl font-bold mb-2">Requirements</h2>
          <p className="opacity-80 mb-4">
            Store each operator’s preferred locations, size ranges and notes.
          </p>
          <button
            className="rounded-xl px-4 py-2 border border-white/20 opacity-50 cursor-not-allowed"
            title="Coming next step"
            disabled
          >
            + Add requirement
          </button>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="text-xl font-bold mb-2">Saved Searches</h2>
          <p className="opacity-80 mb-4">
            Hold your acquisition filters here (city, size, use class, rent,
            yield…).
          </p>
          <button
            className="rounded-xl px-4 py-2 border border-white/20 opacity-50 cursor-not-allowed"
            title="Coming next step"
            disabled
          >
            + Add search
          </button>
        </div>

        <div className="rounded-xl border border-white/10 p-4">
          <h2 className="text-xl font-bold mb-2">Matching</h2>
          <p className="opacity-80 mb-4">
            We’ll cross-reference requirements vs. searches and show ranked
            matches.
          </p>
          <button
            className="rounded-xl px-4 py-2 border border-white/20 opacity-50 cursor-not-allowed"
            title="Coming next step"
            disabled
          >
            Run matching
          </button>
        </div>
      </div>

      <div className="mt-8 text-sm opacity-70">
        API check:{" "}
        <a
          className="underline"
          href="https://acquire-intel-api.onrender.com/api/searches"
          target="_blank"
          rel="noreferrer"
        >
          /api/searches
        </a>{" "}
        should return <code>{`{ ok: true }`}</code>.
      </div>
    </div>
  );
}
