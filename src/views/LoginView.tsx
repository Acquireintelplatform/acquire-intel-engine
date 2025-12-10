import React, { useState } from "react";
import { login } from "../services/auth";   // ✅ correct import
import "../index.css";

export default function LoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");     // ✅ needed for real login
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await login(email, password);

      if (res && res.token) {
        // Save token
        localStorage.setItem("authToken", res.token);

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError("Invalid login credentials.");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#031321",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h1 className="page-title" style={{ marginBottom: "12px" }}>
          Login
        </h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              marginBottom: "16px",
              background: "#001a29",
              color: "white",
              fontSize: "14px",
            }}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              marginBottom: "16px",
              background: "#001a29",
              color: "white",
              fontSize: "14px",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--accent)",
              color: "#031321",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Login
          </button>
        </form>

        {error && (
          <p style={{ marginTop: "12px", color: "red", fontSize: "14px" }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
