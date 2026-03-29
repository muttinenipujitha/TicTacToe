import { useState } from "react";

interface Props {
  onLogin: (username: string) => void;
  error: string | null;
}

export function LoginScreen({ onLogin, error }: Props) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    onLogin(trimmed);
  };

  return (
    <div className="screen login-screen">
      <div className="login-card">
        <div className="logo">✕ ○</div>
        <h1>Tic-Tac-Toe</h1>
        <p className="subtitle">Multiplayer · Real-time · Ranked</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            maxLength={20}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={name.trim().length < 2}
          >
            Play
          </button>
        </div>

        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  );
}
