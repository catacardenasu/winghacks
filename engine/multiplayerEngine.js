export class MultiplayerEngine {
  constructor() {
    // In-memory room registry. Replace with backend persistence later.
    this.rooms = new Map();
  }

  createRoom(playerName) {
    const roomCode = this.generateUniqueRoomCode();
    const hostPlayer = this.createPlayer(playerName || "Player 1");

    this.rooms.set(roomCode, {
      code: roomCode,
      players: [hostPlayer],
      createdAt: Date.now(),
    });

    return { roomCode, localPlayer: hostPlayer };
  }

  joinRoom(roomCode, playerName) {
    const normalizedCode = this.normalizeRoomCode(roomCode);
    const room = this.rooms.get(normalizedCode);

    if (!room) {
      throw new Error("Room not found.");
    }

    if (room.players.length >= 2) {
      throw new Error("Room is full.");
    }

    const newPlayer = this.createPlayer(playerName || "Player 2");
    room.players.push(newPlayer);

    return { roomCode: normalizedCode, localPlayer: newPlayer };
  }

  ensureMockOpponent(roomCode, localPlayerId) {
    const room = this.rooms.get(this.normalizeRoomCode(roomCode));
    if (!room) return null;

    const hasOpponent = room.players.some((player) => player.id !== localPlayerId);
    if (!hasOpponent) {
      const mockPlayer = this.createPlayer(this.getRandomOpponentName(), true);
      room.players.push(mockPlayer);
    }

    return room;
  }

  resetRoomScores(roomCode) {
    const room = this.rooms.get(this.normalizeRoomCode(roomCode));
    if (!room) return null;

    room.players.forEach((player) => {
      player.score = 0;
    });

    return room;
  }

  simulateOpponentRound(roomCode, localPlayerId) {
    const room = this.ensureMockOpponent(roomCode, localPlayerId);
    if (!room) {
      throw new Error("No active room.");
    }

    // Opponent completion time from round start in seconds.
    const finishTimeSec = 25 + Math.floor(Math.random() * 55);

    return {
      finishTimeSec,
      paceFactor: 0.85 + Math.random() * 0.35,
    };
  }

  generateOpponentRoundScore(localRoundScore, plan) {
    const swing = Math.floor(Math.random() * 19) - 9;
    const paceBonus = Math.round((plan.paceFactor - 1) * 12);
    const score = localRoundScore + swing + paceBonus;
    return Math.max(48, Math.min(100, score));
  }

  submitRoundScore(roomCode, localPlayerId, localRoundScore, opponentRoundScore) {
    const room = this.ensureMockOpponent(roomCode, localPlayerId);
    if (!room) {
      throw new Error("No active room.");
    }

    const localPlayer = room.players.find((player) => player.id === localPlayerId);
    const opponent = room.players.find((player) => player.id !== localPlayerId);

    if (!localPlayer || !opponent) {
      throw new Error("Players are not initialized.");
    }

    localPlayer.score += localRoundScore;
    opponent.score += opponentRoundScore;

    return {
      roomCode: room.code,
      localPlayer,
      opponent,
      players: room.players,
      localRoundScore,
      opponentRoundScore,
    };
  }

  generateUniqueRoomCode() {
    let roomCode = this.randomCode();

    while (this.rooms.has(roomCode)) {
      roomCode = this.randomCode();
    }

    return roomCode;
  }

  randomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let index = 0; index < 6; index += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    return code;
  }

  normalizeRoomCode(roomCode) {
    return String(roomCode || "").trim().toUpperCase();
  }

  createPlayer(name, isMock = false) {
    return {
      id: `p-${Math.random().toString(36).slice(2, 10)}`,
      name,
      isMock,
      score: 0,
    };
  }

  getRandomOpponentName() {
    const names = ["Rival Ray", "Chem Champ", "Ion Ivy", "Bond Blaze", "Lab Fox"];
    return names[Math.floor(Math.random() * names.length)];
  }

  // Backend integration placeholders:
  // connectWebSocket(url) {}
  // connectFirebase(config) {}
  // syncRoomState(roomCode) {}
}
