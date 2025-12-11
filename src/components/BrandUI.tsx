// src/components/BrandUI.tsx
import React from "react";

const TEAL = "#2FFFD1";

const glow = "0 1px 0 rgba(0,0,0,.25), 0 0 10px rgba(47,255,209,.20), 0 0 24px rgba(47,255,209,.14)";

const basePill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  padding: "0 16px",
  borderRadius: 16,
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: 0.2,
  userSelect: "none",
  transition: "transform .06s ease, opacity .15s ease, box-shadow .15s ease, background .15s ease, color .15s ease",
  border: `1px solid rgba(47,255,209,0.35)`,
  boxShadow: `0 0 0 1px rgba(47,255,209,0.22) inset, ${glow}`,
  color: "#E7FEF9",
  background: "transparent",
};

const activeFill: React.CSSProperties = {
  background: TEAL,
  color: "#0b1220",
  border: "1px solid rgba(255,255,255,0.18)",
  boxShadow: `0 0 0 1px rgba(47,255,209,0.35) inset, ${glow}`,
};

type PillProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  title?: string;
  fill?: boolean; // false => outline like sidebar; true => filled
  disabled?: boolean;
  style?: React.CSSProperties;
};

export function PillButton({
  children, onClick, type = "button", title, fill = false, disabled = false, style,
}: PillProps) {
  const [hover, setHover] = React.useState(false);
  const [down, setDown] = React.useState(false);
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setDown(false); }}
      onMouseDown={() => setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        ...basePill,
        ...(fill ? activeFill : null),
        opacity: disabled ? 0.6 : hover ? 0.95 : 1,
        transform: down ? "translateY(1px)" : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

type CardProps = { children: React.ReactNode; style?: React.CSSProperties };
export function SectionCard({ children, style }: CardProps) {
  return (
    <section
      style={{
        borderRadius: 16,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/** Guaranteed inline gap row (global CSS can't break it). */
export function ButtonRow({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return <div style={{ display: "grid", gridAutoFlow: "column", columnGap: gap, alignItems: "center" }}>{children}</div>;
}
