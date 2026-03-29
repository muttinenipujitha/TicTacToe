// // Nakama Server-Side Game Logic
// // Uses string-based function references for goja compatibility

// var MODULE_NAME = "tictactoe";
// var LEADERBOARD_ID = "global_wins";
// var TICK_RATE = 1;
// var TURN_DURATION_SEC = 30;

// function checkWinner(board) {
//   var wins = [
//     [0,1,2],[3,4,5],[6,7,8],
//     [0,3,6],[1,4,7],[2,5,8],
//     [0,4,8],[2,4,6]
//   ];
//   for (var i = 0; i < wins.length; i++) {
//     var a = wins[i][0], b = wins[i][1], c = wins[i][2];
//     if (board[a] && board[a] === board[b] && board[a] === board[c]) {
//       return board[a];
//     }
//   }
//   for (var j = 0; j < board.length; j++) {
//     if (board[j] === "") return null;
//   }
//   return "draw";
// }

// function initialState() {
//   return {
//     board: ["","","","","","","","",""],
//     turn: "",
//     players: {},
//     playerOrder: [],
//     winner: null,
//     gameOver: false,
//     turnDeadline: 0,
//     moveCount: 0
//   };
// }

// function sanitizeState(state) {
//   return {
//     board: state.board,
//     turn: state.turn,
//     players: state.players,
//     winner: state.winner,
//     gameOver: state.gameOver,
//     turnDeadline: state.turnDeadline,
//     moveCount: state.moveCount
//   };
// }

// function matchInit(ctx, logger, nk, params) {
//   var state = initialState();
//   logger.info("Match created: " + ctx.matchId);
//   return { state: state, tickRate: TICK_RATE, label: "waiting" };
// }

// function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
//   if (state.playerOrder.length >= 2) {
//     return { state: state, accept: false, rejectMessage: "Match is full" };
//   }
//   if (state.gameOver) {
//     return { state: state, accept: false, rejectMessage: "Match is over" };
//   }
//   return { state: state, accept: true };
// }

// function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
//   for (var i = 0; i < presences.length; i++) {
//     var presence = presences[i];
//     if (state.playerOrder.length >= 2) break;
//     var symbol = state.playerOrder.length === 0 ? "X" : "O";
//     state.players[presence.userId] = { symbol: symbol, username: presence.username };
//     state.playerOrder.push(presence.userId);
//     logger.info("Player joined: " + presence.username + " as " + symbol);
//   }

//   if (state.playerOrder.length === 2) {
//     state.turn = state.playerOrder[0];
//     state.turnDeadline = Math.floor(Date.now() / 1000) + TURN_DURATION_SEC;
//     dispatcher.broadcastMessage(1, JSON.stringify({ type: "game_start", state: sanitizeState(state) }), null, null, true);
//     dispatcher.matchLabelUpdate("in_progress");
//     logger.info("Game started in match " + ctx.matchId);
//   } else {
//     dispatcher.broadcastMessage(1, JSON.stringify({ type: "waiting", message: "Waiting for opponent..." }), null, null, true);
//   }
//   return { state: state };
// }

// function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
//   for (var i = 0; i < presences.length; i++) {
//     var presence = presences[i];
//     if (!state.gameOver && state.playerOrder.indexOf(presence.userId) !== -1) {
//       var remainingId = null;
//       for (var j = 0; j < state.playerOrder.length; j++) {
//         if (state.playerOrder[j] !== presence.userId) { remainingId = state.playerOrder[j]; break; }
//       }
//       if (remainingId) {
//         state.gameOver = true;
//         state.winner = remainingId;
//         dispatcher.broadcastMessage(1, JSON.stringify({ type: "game_over", winner: remainingId, reason: "opponent_disconnected", state: sanitizeState(state) }), null, null, true);
//       }
//     }
//     logger.info("Player left: " + presence.userId);
//   }
//   return { state: state };
// }

// function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
//   for (var i = 0; i < messages.length; i++) {
//     var msg = messages[i];
//     if (state.gameOver || state.playerOrder.length < 2) continue;
//     if (msg.sender.userId !== state.turn) {
//       dispatcher.broadcastMessage(2, JSON.stringify({ type: "error", message: "Not your turn" }), [msg.sender], null, true);
//       continue;
//     }
//     var moveData;
//     try { moveData = JSON.parse(nk.binaryToString(msg.data)); } catch(e) { continue; }
//     var pos = moveData.position;
//     if (typeof pos !== "number" || pos < 0 || pos > 8 || state.board[pos] !== "") {
//       dispatcher.broadcastMessage(2, JSON.stringify({ type: "error", message: "Invalid move" }), [msg.sender], null, true);
//       continue;
//     }
//     var symbol = state.players[msg.sender.userId].symbol;
//     state.board[pos] = symbol;
//     state.moveCount++;
//     var result = checkWinner(state.board);
//     if (result) {
//       state.gameOver = true;
//       if (result === "draw") {
//         state.winner = "draw";
//       } else {
//         var winnerId = null;
//         for (var k = 0; k < state.playerOrder.length; k++) {
//           if (state.players[state.playerOrder[k]].symbol === result) { winnerId = state.playerOrder[k]; break; }
//         }
//         state.winner = winnerId;
//         try { nk.leaderboardRecordWrite(LEADERBOARD_ID, winnerId, state.players[winnerId].username, 1, 0, {}, {}); } catch(e) { logger.warn("LB write failed: " + e); }
//       }
//       dispatcher.broadcastMessage(1, JSON.stringify({ type: "game_over", winner: state.winner, reason: result === "draw" ? "draw" : "win", state: sanitizeState(state) }), null, null, true);
//       dispatcher.matchLabelUpdate("finished");
//     } else {
//       var nextTurn = null;
//       for (var n = 0; n < state.playerOrder.length; n++) {
//         if (state.playerOrder[n] !== state.turn) { nextTurn = state.playerOrder[n]; break; }
//       }
//       state.turn = nextTurn;
//       state.turnDeadline = Math.floor(Date.now() / 1000) + TURN_DURATION_SEC;
//       dispatcher.broadcastMessage(1, JSON.stringify({ type: "move", position: pos, symbol: symbol, state: sanitizeState(state) }), null, null, true);
//     }
//   }

//   if (!state.gameOver && state.playerOrder.length === 2 && state.turnDeadline > 0) {
//     var now = Math.floor(Date.now() / 1000);
//     if (now >= state.turnDeadline) {
//       var forfeitId = state.turn;
//       var twinnerId = null;
//       for (var t = 0; t < state.playerOrder.length; t++) {
//         if (state.playerOrder[t] !== forfeitId) { twinnerId = state.playerOrder[t]; break; }
//       }
//       state.gameOver = true;
//       state.winner = twinnerId;
//       try { nk.leaderboardRecordWrite(LEADERBOARD_ID, winnerId, state.players[winnerId].username, 1, 0, {}); } catch(e) { logger.warn("LB write failed: " + e); }
//       dispatcher.broadcastMessage(1, JSON.stringify({ type: "game_over", winner: twinnerId, reason: "timeout", state: sanitizeState(state) }), null, null, true);
//       dispatcher.matchLabelUpdate("finished");
//     } else {
//       dispatcher.broadcastMessage(3, JSON.stringify({ type: "timer", secondsLeft: state.turnDeadline - now, turn: state.turn }), null, null, true);
//     }
//   }

//   if (state.gameOver && state.playerOrder.length === 0) return null;
//   return { state: state };
// }

// function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
//   dispatcher.broadcastMessage(1, JSON.stringify({ type: "server_shutdown" }), null, null, true);
//   return { state: state };
// }

// function matchSignal(ctx, logger, nk, dispatcher, tick, state) {
//   return { state: state, data: "" };
// }

// function rpcFindMatch(ctx, logger, nk, payload) {
//   var matches = nk.matchList(10, true, "waiting", null, null, "*");
//   // Filter out any matches that aren't strictly "waiting"
//   var waitingMatches = [];
//   for (var i = 0; i < matches.length; i++) {
//     if (matches[i].label === "waiting") {
//       waitingMatches.push(matches[i]);
//     }
//   }
//   if (waitingMatches.length > 0) {
//     return JSON.stringify({ matchId: waitingMatches[0].matchId });
//   }
//   var matchId = nk.matchCreate(MODULE_NAME, {});
//   return JSON.stringify({ matchId: matchId });
// }

// function rpcGetLeaderboard(ctx, logger, nk, payload) {
//   try {
//     var result = nk.leaderboardRecordsList(LEADERBOARD_ID, [], 10, "", 0);
//     var records = (result.records || []).map(function(r) {
//       return { username: r.username, score: r.score, rank: r.rank };
//     });
//     return JSON.stringify({ records: records });
//   } catch(e) {
//     logger.error("Leaderboard fetch failed: " + e);
//     return JSON.stringify({ records: [] });
//   }
// }

// function InitModule(ctx, logger, nk, initializer) {
//   try {
//     nk.leaderboardCreate(LEADERBOARD_ID, false, "desc", "incr", "", {});
//   } catch(e) {
//     logger.info("Leaderboard already exists");
//   }
//   initializer.registerMatch(MODULE_NAME, {
//     matchInit: matchInit,
//     matchJoinAttempt: matchJoinAttempt,
//     matchJoin: matchJoin,
//     matchLeave: matchLeave,
//     matchLoop: matchLoop,
//     matchTerminate: matchTerminate,
//     matchSignal: matchSignal
//   });
//   initializer.registerRpc("find_match", rpcFindMatch);
//   initializer.registerRpc("get_leaderboard", rpcGetLeaderboard);
//   logger.info("TicTacToe module loaded.");
// }

// tictactoe.js
var MODULE_NAME = "tictactoe";
var LEADERBOARD_ID = "global_wins";
var TICK_RATE = 1;
var TURN_DURATION_SEC = 30;

function checkWinner(board) {
  var wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (var i = 0; i < wins.length; i++) {
    var a = wins[i][0], b = wins[i][1], c = wins[i][2];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  for (var j = 0; j < board.length; j++) {
    if (board[j] === "") return null;
  }
  return "draw";
}

function initialState() {
  return {
    board: ["","","","","","","","",""],
    turn: "",
    players: {},
    playerOrder: [],
    winner: null,
    gameOver: false,
    turnDeadline: 0,
    moveCount: 0
  };
}

function sanitizeState(state) {
  return {
    board: state.board,
    turn: state.turn,
    players: state.players,
    winner: state.winner,
    gameOver: state.gameOver,
    turnDeadline: state.turnDeadline,
    moveCount: state.moveCount
  };
}

function writeWin(nk, logger, winnerId, username) {
  try {
    nk.leaderboardRecordWrite(LEADERBOARD_ID, winnerId, username, 1, 0, {});
  } catch (e) {
    logger.warn("Leaderboard write error: " + e);
  }
}

function matchInit(ctx, logger, nk, params) {
  logger.info("Match created: " + ctx.matchId);
  return { state: initialState(), tickRate: TICK_RATE, label: "waiting" };
}

function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  if (state.playerOrder.length >= 2) {
    return { state: state, accept: false, rejectMessage: "Match is full" };
  }
  if (state.gameOver) {
    return { state: state, accept: false, rejectMessage: "Match is over" };
  }
  return { state: state, accept: true };
}

function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var p = presences[i];
    if (state.playerOrder.length >= 2) break;
    var symbol = state.playerOrder.length === 0 ? "X" : "O";
    state.players[p.userId] = { symbol: symbol, username: p.username };
    state.playerOrder.push(p.userId);
    logger.info("Player joined: " + p.username + " as " + symbol);
  }

  if (state.playerOrder.length === 2) {
    state.turn = state.playerOrder[0];
    state.turnDeadline = Math.floor(Date.now() / 1000) + TURN_DURATION_SEC;
    dispatcher.broadcastMessage(1, JSON.stringify({
      type: "game_start",
      state: sanitizeState(state)
    }));
    dispatcher.matchLabelUpdate("in_progress");
    logger.info("Game started: " + ctx.matchId);
  } else {
    dispatcher.broadcastMessage(1, JSON.stringify({
      type: "waiting",
      message: "Waiting for opponent..."
    }));
  }
  return { state: state };
}

function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var p = presences[i];
    if (!state.gameOver && state.playerOrder.indexOf(p.userId) !== -1) {
      var remainingId = null;
      for (var j = 0; j < state.playerOrder.length; j++) {
        if (state.playerOrder[j] !== p.userId) { remainingId = state.playerOrder[j]; break; }
      }
      if (remainingId) {
        state.gameOver = true;
        state.winner = remainingId;
        writeWin(nk, logger, remainingId, state.players[remainingId].username);
        dispatcher.broadcastMessage(1, JSON.stringify({
          type: "game_over",
          winner: remainingId,
          reason: "opponent_disconnected",
          state: sanitizeState(state)
        }));
      }
    }
    logger.info("Player left: " + p.userId);
  }
  return { state: state };
}

function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
  var now = Math.floor(Date.now() / 1000);

  // Process moves first
  for (var i = 0; i < messages.length; i++) {
    var msg = messages[i];
    if (state.gameOver) continue;
    if (state.playerOrder.length < 2) continue;
    if (msg.sender.userId !== state.turn) continue;

    var data;
    try { data = JSON.parse(nk.binaryToString(msg.data)); } catch(e) { continue; }

    var pos = data.position;
    if (typeof pos !== "number" || pos < 0 || pos > 8 || state.board[pos] !== "") continue;

    var symbol = state.players[msg.sender.userId].symbol;
    state.board[pos] = symbol;
    state.moveCount++;

    var result = checkWinner(state.board);

    if (result) {
      state.gameOver = true;
      if (result === "draw") {
        state.winner = "draw";
      } else {
        var winnerId = null;
        for (var j = 0; j < state.playerOrder.length; j++) {
          if (state.players[state.playerOrder[j]].symbol === result) {
            winnerId = state.playerOrder[j]; break;
          }
        }
        state.winner = winnerId;
        writeWin(nk, logger, winnerId, state.players[winnerId].username);
      }
      dispatcher.broadcastMessage(1, JSON.stringify({
        type: "game_over",
        winner: state.winner,
        reason: result === "draw" ? "draw" : "win",
        state: sanitizeState(state)
      }));
      dispatcher.matchLabelUpdate("finished");
      return { state: state };
    }

    // Switch turn
    for (var k = 0; k < state.playerOrder.length; k++) {
      if (state.playerOrder[k] !== state.turn) { state.turn = state.playerOrder[k]; break; }
    }
    state.turnDeadline = Math.floor(Date.now() / 1000) + TURN_DURATION_SEC;

    dispatcher.broadcastMessage(1, JSON.stringify({
      type: "move",
      position: pos,
      symbol: symbol,
      state: sanitizeState(state)
    }));
  }

  // Skip timer logic if game over
  if (state.gameOver) return { state: state };

  // Skip timer if game hasn't started yet
  if (state.playerOrder.length < 2 || state.turnDeadline === 0) return { state: state };

  // Check timeout
  if (now >= state.turnDeadline) {
    var loser = state.turn;
    var timeoutWinner = null;
    for (var t = 0; t < state.playerOrder.length; t++) {
      if (state.playerOrder[t] !== loser) { timeoutWinner = state.playerOrder[t]; break; }
    }
    state.gameOver = true;
    state.winner = timeoutWinner;
    writeWin(nk, logger, timeoutWinner, state.players[timeoutWinner].username);
    dispatcher.broadcastMessage(1, JSON.stringify({
      type: "game_over",
      winner: timeoutWinner,
      reason: "timeout",
      state: sanitizeState(state)
    }));
    dispatcher.matchLabelUpdate("finished");
    return { state: state };
  }

  // Broadcast timer (only when game is active)
  var secondsLeft = state.turnDeadline - now;
  if (secondsLeft >= 0) {
    dispatcher.broadcastMessage(3, JSON.stringify({
      type: "timer",
      secondsLeft: secondsLeft,
      turn: state.turn
    }));
  }

  return { state: state };
}

function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  dispatcher.broadcastMessage(1, JSON.stringify({ type: "server_shutdown" }));
  return { state: state };
}

function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
  return { state: state, data: "" };
}

function rpcFindMatch(ctx, logger, nk, payload) {
  var matches = nk.matchList(10, true, "waiting", null, null, "*");
  for (var i = 0; i < matches.length; i++) {
    if (matches[i].label === "waiting" && matches[i].size < 2) {
      return JSON.stringify({ matchId: matches[i].matchId });
    }
  }
  var matchId = nk.matchCreate(MODULE_NAME, {});
  return JSON.stringify({ matchId: matchId });
}

function rpcGetLeaderboard(ctx, logger, nk, payload) {
  try {
    var result = nk.leaderboardRecordsList(LEADERBOARD_ID, [], 10, "", 0);
    var list = [];
    for (var i = 0; i < result.records.length; i++) {
      var r = result.records[i];
      list.push({ username: r.username, score: r.score, rank: r.rank });
    }
    return JSON.stringify({ records: list });
  } catch(e) {
    logger.error("Leaderboard fetch failed: " + e);
    return JSON.stringify({ records: [] });
  }
}

function InitModule(ctx, logger, nk, initializer) {
  try {
    nk.leaderboardCreate(LEADERBOARD_ID, false, "desc", "incr", "", {});
    logger.info("Leaderboard created: " + LEADERBOARD_ID);
  } catch(e) {
    logger.info("Leaderboard already exists");
  }

  initializer.registerMatch(MODULE_NAME, {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal
  });

  initializer.registerRpc("find_match", rpcFindMatch);
  initializer.registerRpc("get_leaderboard", rpcGetLeaderboard);

  logger.info("TicTacToe module loaded.");
}