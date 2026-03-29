import { useEffect, useState } from "react";
import { GameOverInfo, GameState } from "../hooks/useGame";
import { nakama, LeaderboardEntry } from "../lib/nakama";

interface Props {
  gameOver: GameOverInfo;
  gameState: GameState;
  myUserId: string;
  onPlayAgain: () => void;
}

const REASON_LABELS: Record<string, string> = {
  win: "wins!",
  draw: "It's a draw!",
  timeout: "wins by timeout",
  opponent_disconnected: "wins — opponent disconnected",
};

export function GameOverScreen({
  gameOver,
  gameState,
  myUserId,
  onPlayAgain,
}: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // ✅ CORRECT LOGIC
  const iDraw = gameOver.winner === "draw";
  const iWon = gameOver.winner === myUserId;

  const winnerName =
    gameOver.winner && gameOver.winner !== "draw"
      ? gameState.players[gameOver.winner]?.username
      : null;

  // ✅ Fetch leaderboard
  useEffect(() => {
    nakama.getLeaderboard().then(setLeaderboard).catch(() => {});
  }, []);

  return (
    <div className="screen gameover-screen">
      <div className="gameover-card">

        {/* ✅ FIXED ICON */}
        <div
          className={`result-icon ${
            iDraw ? "draw" : iWon ? "win" : "lose"
          }`}
        >
          {iDraw ? "🤝" : iWon ? "✔️" : "❌"}
        </div>

        {/* ✅ FIXED TEXT */}
        <h2
          className={`result-label ${
            iDraw ? "" : iWon ? "win" : "lose"
          }`}
        >
          {iDraw
            ? "It's a Draw!"
            : iWon
            ? "You Win!"
            : `${winnerName} ${REASON_LABELS[gameOver.reason]}`}
        </h2>

        {/* ✅ SUB TEXT */}
        <p className="result-sub">
          {iWon && "+1 win added to your record"}
          {!iWon && !iDraw && "Better luck next time"}
          {iDraw && "Nobody wins, nobody loses"}
        </p>
        {/* ✅ LEADERBOARD */}
        {leaderboard.length > 0 && (
          <div className="leaderboard">
            <h3>🏆 Top Players</h3>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Wins</th>
                </tr>
              </thead>

              <tbody>
                {leaderboard.map((r) => (
                  <tr
                    key={r.rank}
                    className={
                      r.username ===
                      gameState.players[myUserId]?.username
                        ? "me"
                        : ""
                    }
                  >
                    <td>{r.rank}</td>
                    <td>{r.username}</td>
                    <td>{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BUTTON */}
        <button
          className="btn-primary btn-large"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}