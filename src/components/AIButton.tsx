// src/components/AIButton.tsx

import "./AIButton.css";

interface AIButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function AIButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  style = {},
}: AIButtonProps) {
  return (
    <button
      className="ai-button"
      onClick={onClick}
      type={type}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}
