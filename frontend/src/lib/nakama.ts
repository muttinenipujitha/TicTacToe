import { Client, Session, Socket } from "@heroiclabs/nakama-js";

const HOST = import.meta.env.VITE_NAKAMA_HOST || "localhost";
const PORT = import.meta.env.VITE_NAKAMA_PORT || "7350";
const USE_SSL = import.meta.env.VITE_NAKAMA_SSL === "true";
const SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";

class NakamaClient {
  client: Client;
  session: Session | null = null;
  socket: Socket | null = null;

  constructor() {
    this.client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);
  }

  async authenticate(username: string): Promise<Session> {
    // Device auth — creates account automatically
    const deviceId = this.getOrCreateDeviceId();
    this.session = await this.client.authenticateDevice(deviceId, true, username);
    return this.session;
  }

  async connectSocket(): Promise<Socket> {
    if (!this.session) throw new Error("Not authenticated");
    this.socket = this.client.createSocket(USE_SSL, false);
    await this.socket.connect(this.session, true);
    return this.socket;
  }

  async findMatch(): Promise<string> {
    if (!this.session) throw new Error("Not authenticated");
    const res = await this.client.rpc(this.session, "find_match", {});
    const payload = res.payload as { matchId: string };
    return payload.matchId;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.session) throw new Error("Not authenticated");
    const res = await this.client.rpc(this.session, "get_leaderboard", {});
    const payload = res.payload as { records: LeaderboardEntry[] };
    return payload.records || [];
  }

  private getOrCreateDeviceId(): string {
    let id = localStorage.getItem("nakama_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("nakama_device_id", id);
    }
    return id;
  }
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  rank: number;
}

export const nakama = new NakamaClient();
