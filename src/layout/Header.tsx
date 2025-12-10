import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      {/* No title here – avoids duplicate page headings */}
      <div className="header__status">
        <div className="header__dot" />
        <span>System Online</span>
      </div>
    </header>
  );
}
