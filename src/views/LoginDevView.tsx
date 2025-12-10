import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "../authState";

export default function LoginDevView() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const { login } = useAuthState();

  const handleLogin = () => {
    const allowed = ["rs", "RS", "hd", "HD"];
    if (!allowed.includes(username)) {
      alert("Access denied. Only RS or HD allowed.");
      return;
    }

    login(username);
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Acquire Intel Engine — Dev Login</h2>

        <input
          style={styles.input}
          placeholder="Enter RS or HD"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button style={styles.button} onClick={handleLogin}>
          Log In
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0B0C10",
  },
  card: {
    background: "#1F2833",
    padding: "40px",
    borderRadius: "12px",
    width: "320px",
    textAlign: "center",
  },
  title: {
    color: "white",
    marginBottom: "20px",
    fontSize: "20px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "16px",
  },
  button: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#66FCF1",
    color: "#0B0C10",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
