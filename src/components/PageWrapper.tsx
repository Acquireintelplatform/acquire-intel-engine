// src/components/PageWrapper.tsx
import React from "react";

type Props = {
  /** legacy prop kept for compatibility; no visual H1 rendered */
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export default function PageWrapper({ className, children }: Props) {
  return (
    <main className={className ?? ""} style={{ padding: "16px 18px" }}>
      {/* No top-level H1 here — teal titles inside cards remain */}
      {children}
    </main>
  );
}
