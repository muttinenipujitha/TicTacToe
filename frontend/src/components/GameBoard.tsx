import { GameState } from "../hooks/useGame";

interface Props {
  gameState: GameState;
  myUserId: string;
  secondsLeft: number;
  onMove: (position: number) => void;
}

export function GameBoard({ gameState, myUserId, secondsLeft, onMove }: Props) {
  // ✅ SAFE ACCESS
  const me = gameState.players[String(myUserId)];
  const mySymbol = me?.symbol;

  // ✅ FIX TURN MATCH (MAIN FIX)
  const isMyTurn = String(gameState.turn) === String(myUserId);

  const opponentId = Object.keys(gameState.players).find(
    id => String(id) !== String(myUserId)
  );
  const opponent = opponentId ? gameState.players[opponentId] : null;

  // ✅ FIX TIMER NEGATIVE
  const safeSeconds = secondsLeft < 0 ? 0 : secondsLeft;
  const timerDanger = safeSeconds <= 10;

  // 🔍 DEBUG (optional)
  console.log("TURN:", gameState.turn);
  console.log("ME:", myUserId);
  console.log("isMyTurn:", isMyTurn);

  return (
    <div className="screen game-screen">
      {/* Players bar */}
      <div className="players-bar">
        <div className={`player-info ${isMyTurn ? "active" : ""}`}>
          <span className="symbol">{mySymbol}</span>
          <span className="pname">{me?.username} (you)</span>
        </div>

        <div className={`timer ${timerDanger ? "danger" : ""}`}>
          {safeSeconds}s
        </div>

        <div className={`player-info right ${!isMyTurn ? "active" : ""}`}>
          <span className="pname">{opponent?.username ?? "…"}</span>
          <span className="symbol">{opponent?.symbol}</span>
        </div>
      </div>

      {/* Turn label */}
      <p className="turn-label">
        {isMyTurn ? "Your turn" : `${opponent?.username}'s turn`}
      </p>

      {/* Board */}
      <div className="board">
        {gameState.board.map((cell, i) => {
          // ✅ FIX CLICK ENABLE
          const canClick =
            isMyTurn &&
            !cell &&
            !gameState.gameOver;

          return (
            <button
              key={i}
              className={`cell ${cell} ${canClick ? "clickable" : ""}`}
              onClick={() => canClick && onMove(i)}
              disabled={!canClick}
            >
              {cell}
            </button>
          );
        })}
      </div>

      <p className="move-count">Move {gameState.moveCount}</p>
    </div>
  );
}