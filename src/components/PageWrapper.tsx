// src/components/PageWrapper.tsx
import React from "react";
import "./PageWrapper.css";

type Props = {
  title: string;
  sub?: string;
  children: React.ReactNode;
};

export default function PageWrapper({ title, sub, children }: Props) {
  return (
    <section className="ai-card">
      <header className="ai-card-head">
        <h1 className="ai-h1">{title}</h1>
        {sub ? <p className="ai-sub">{sub}</p> : null}
      </header>
      <div className="ai-card-body">{children}</div>
    </section>
  );
}
