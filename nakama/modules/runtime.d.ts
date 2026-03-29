declare namespace nkruntime {
  interface Context { matchId: string; }
  interface Logger { info(msg: string, ...args: any[]): void; warn(msg: string, ...args: any[]): void; error(msg: string, ...args: any[]): void; }
  interface Nakama {
    matchCreate(module: string, params?: {}): string;
    matchList(limit: number, authoritative: boolean, label: string, minSize: any, maxSize: any, query: string): any[];
    leaderboardCreate(id: string, authoritative: boolean, sort: string, operator: string, reset: string, metadata: {}): void;
    leaderboardRecordWrite(id: string, ownerId: string, username: string, score: number, subscore: number, metadata: {}, override: {}): void;
    leaderboardRecordsList(id: string, ownerIds: string[], limit: number, cursor: string, expiry: string): { records: any[] };
    binaryToString(data: Uint8Array): string;
    rpc(id: string, payload: string): any;
  }
  interface Dispatcher {
    broadcastMessage(opCode: number, data: string, presences?: any[]): void;
    matchLabelUpdate(label: string): void;
  }
  interface Presence { userId: string; username: string; }
  interface MatchMessage { sender: Presence; data: Uint8Array; opCode: number; }
  type MatchInitFunction = (ctx: Context, logger: Logger, nk: Nakama, params: {}) => { state: any; tickRate: number; label: string };
  type MatchJoinAttemptFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any, presence: Presence, metadata: {}) => { state: any; accept: boolean; rejectMessage?: string };
  type MatchJoinFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any, presences: Presence[]) => { state: any };
  type MatchLeaveFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any, presences: Presence[]) => { state: any };
  type MatchLoopFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any, messages: MatchMessage[]) => { state: any } | null;
  type MatchTerminateFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any, graceSeconds: number) => { state: any };
  type MatchSignalFunction = (ctx: Context, logger: Logger, nk: Nakama, dispatcher: Dispatcher, tick: number, state: any) => { state: any; data: string };
  type RpcFunction = (ctx: Context, logger: Logger, nk: Nakama, payload: string) => string;
  interface Initializer {
    registerMatch(name: string, handlers: { matchInit: MatchInitFunction; matchJoinAttempt: MatchJoinAttemptFunction; matchJoin: MatchJoinFunction; matchLeave: MatchLeaveFunction; matchLoop: MatchLoopFunction; matchTerminate: MatchTerminateFunction; matchSignal: MatchSignalFunction }): void;
    registerRpc(name: string, fn: RpcFunction): void;
  }
}
declare function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer): void;