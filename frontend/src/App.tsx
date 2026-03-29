import { useGame } from "./hooks/useGame";
import { LoginScreen } from "./components/LoginScreen";
import { MatchmakingScreen } from "./components/MatchmakingScreen";
import { GameBoard } from "./components/GameBoard";
import { GameOverScreen } from "./components/GameOverScreen";

export default function App() {
  const {
    phase,
    username,
    gameState,
    gameOver,
    secondsLeft,
    error,
    myUserId,
    login,
    findMatch,
    makeMove,
    playAgain,
  } = useGame();

  return (
    <div className="app">
      {phase === "login" && (
        <LoginScreen onLogin={login} error={error} />
      )}

      {(phase === "matchmaking" || phase === "waiting") && (
        <MatchmakingScreen
          phase={phase}
          username={username}
          onFind={findMatch}
        />
      )}

      {phase === "playing" && gameState && myUserId && (
        <GameBoard
          gameState={gameState}
          myUserId={myUserId}
          secondsLeft={secondsLeft}
          onMove={makeMove}
        />
      )}

      {phase === "game_over" && gameOver && gameState && myUserId && (
        <GameOverScreen
          gameOver={gameOver}
          gameState={gameState}
          myUserId={myUserId}
          onPlayAgain={playAgain}
        />
      )}

      {error && phase !== "login" && (
        <div className="toast-error">{error}</div>
      )}
    </div>
  );
}


