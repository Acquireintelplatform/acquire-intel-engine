// src/components/SectionTitle.tsx
import React from "react";
import "./SectionTitle.css";

export default function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}


