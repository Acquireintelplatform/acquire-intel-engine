// src/components/SectionCard.tsx
import React from "react";
import "./SectionCard.css";

export default function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="section-card">{children}</div>;
}
