interface Props {
  phase: "matchmaking" | "waiting";
  username: string;
  onFind: () => void;
}

export function MatchmakingScreen({ phase, username, onFind }: Props) {
  return (
    <div className="screen matchmaking-screen">
      <div className="matchmaking-card">
        <p className="greeting">Hey, <strong>{username}</strong></p>

        {phase === "matchmaking" ? (
          <>
            <h2>Ready to play?</h2>
            <button className="btn-primary btn-large" onClick={onFind}>
              Find Match
            </button>
          </>
        ) : (
          <>
            <h2>Finding opponent...</h2>
            <div className="spinner" />
            <p className="hint">Usually takes a few seconds</p>
          </>
        )}
      </div>
    </div>
  );
}
