import { useState, useRef, useCallback, useEffect } from "react";
import { nakama } from "../lib/nakama";

export type GamePhase =
  | "login"
  | "matchmaking"
  | "waiting"
  | "playing"
  | "game_over";

  

export interface PlayerInfo {
  symbol: "X" | "O";
  username: string;
}

export interface GameState {
  board: string[];
  turn: string;
  players: { [userId: string]: PlayerInfo };
  winner: string | null;
  gameOver: boolean;
  turnDeadline: number;
  moveCount: number;
}

export interface GameOverInfo {
  winner: string | null;
  reason: "win" | "draw" | "timeout" | "opponent_disconnected";
}

export function useGame() {
  const [phase, setPhase] = useState<GamePhase>("login");
  const [username, setUsername] = useState("");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const matchIdRef = useRef<string | null>(null);

  // Keep matchIdRef in sync
  useEffect(() => { matchIdRef.current = matchId; }, [matchId]);

  const setupSocketListeners = useCallback(() => {
    const socket = nakama.socket!;

    socket.onmatchdata = (data) => {
      let msg: any;
      try {
        if (typeof data.data === "string") {
          msg = JSON.parse(data.data);
        } else if (data.data instanceof Uint8Array) {
          msg = JSON.parse(new TextDecoder().decode(data.data));
        } else {
          msg = JSON.parse(new TextDecoder().decode(new Uint8Array(Object.values(data.data as any))));
        }
      } catch (e) {
        console.error("Failed to parse match data", e);
        return;
      }

      console.log("Match message:", msg);

      switch (msg.type) {
        case "waiting":
          setPhase("waiting");
          break;
        case "game_start":
  setGameOver(null);
  setGameState({ ...msg.state, gameOver: false });
  setPhase("playing");
  break;
        case "move":
          setGameState({ ...msg.state });
          break;
        case "game_over":
  setGameState({ ...msg.state });
  setGameOver({ winner: msg.winner, reason: msg.reason });
  setPhase("game_over");
  fetchLeaderboard(); // ✅ ADD THIS LINE
  break;
       case "timer":
  setSecondsLeft(Math.max(0, msg.secondsLeft)); // ✅ FIX
  break;
        case "error":
          setError(msg.message);
          break;
      }
    };

    socket.ondisconnect = () => {
      setError("Disconnected from server");
      setPhase("login");
    };
  }, []);
const fetchLeaderboard = useCallback(async () => {
  try {
    const res = await nakama.client.rpc(
      nakama.session!,
      "get_leaderboard",
      {}
    );

    const data =
      typeof res.payload === "string"
        ? JSON.parse(res.payload)
        : res.payload;

    console.log("Leaderboard:", data); // optional debug

    setLeaderboard(data.records || []);
  } catch (e) {
    console.error("Leaderboard fetch failed", e);
  }
}, []);
  const login = useCallback(async (name: string) => {
    try {
      setError(null);
      const session = await nakama.authenticate(name);
      setMyUserId(session.user_id!);
      setUsername(name);
      await nakama.connectSocket();
      setupSocketListeners();
      setPhase("matchmaking");
    } catch (e: any) {
      setError("Failed to connect: " + (e.message || e));
    }
  }, [setupSocketListeners]);

  const findMatch = useCallback(async () => {
    try {
      setError(null);
      setGameOver(null);
      setGameState(null);
      setSecondsLeft(30);
      setPhase("waiting");

      if (matchIdRef.current) {
        try { await nakama.socket!.leaveMatch(matchIdRef.current); } catch {}
      }

      const id = await nakama.findMatch();
      setMatchId(id);
      matchIdRef.current = id;
      await nakama.socket!.joinMatch(id);
    } catch (e: any) {
      setError("Matchmaking failed: " + (e.message || e));
      setPhase("matchmaking");
    }
  }, []);

  const makeMove = useCallback(async (position: number) => {
    if (!matchIdRef.current || !nakama.socket) return;
    await nakama.socket.sendMatchState(matchIdRef.current, 0, JSON.stringify({ position }));
  }, []);

  const playAgain = useCallback(() => {
    setPhase("matchmaking");
    setGameState(null);
    setGameOver(null);
    setMatchId(null);
    matchIdRef.current = null;
  }, []);

  return {
    phase,
    username,
    matchId,
    gameState,
    gameOver,
    secondsLeft,
    error,
    myUserId,
    login,
    findMatch,
    leaderboard,
    makeMove,
    playAgain,
  };
}