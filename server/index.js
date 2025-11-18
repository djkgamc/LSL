const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameState = require('./gameState');

const app = express();
const corsOptions = {
  origin: process.env.CLIENT_URL 
    ? [process.env.CLIENT_URL, 'http://localhost:8081']
    : '*',
  methods: ["GET", "POST"]
};
app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const gameState = new GameState();

const PORT = process.env.PORT || 3000;

// Serve static files if needed
app.use(express.json());

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Add player to game state
  const playerName = socket.handshake.query.name;
  const player = gameState.addPlayer(socket.id, playerName);
  
  // Send initial game state to new player
  socket.emit('gameState', {
    player: player,
    allPlayers: gameState.getAllPlayers(),
    leaderboard: gameState.getLeaderboard()
  });

  // Notify other players about new player
  socket.broadcast.emit('playerJoined', player);
  io.emit('leaderboardUpdate', gameState.getLeaderboard());

  // Handle player movement updates
  socket.on('playerMove', (data) => {
    const updatedPlayer = gameState.updatePlayer(socket.id, data);
    if (updatedPlayer) {
      // Broadcast to all players in the same scene
      const playersInScene = gameState.getPlayersInScene(updatedPlayer.scene);
      playersInScene.forEach(p => {
        io.to(p.id).emit('playerUpdate', updatedPlayer);
      });
    }
  });

  // Handle scene changes
  socket.on('changeScene', (data) => {
    const updatedPlayer = gameState.updatePlayer(socket.id, { scene: data.scene, x: data.x || 100, y: data.y || 900 });
    if (updatedPlayer) {
      // Notify players in old scene
      socket.broadcast.emit('playerLeftScene', { id: socket.id, scene: data.scene });
      
      // Send new scene state
      const playersInNewScene = gameState.getPlayersInScene(data.scene);
      socket.emit('sceneState', {
        players: playersInNewScene
      });

      // Notify players in new scene
      playersInNewScene.forEach(p => {
        if (p.id !== socket.id) {
          io.to(p.id).emit('playerJoinedScene', updatedPlayer);
        }
      });
    }
  });

  // Handle building entry
  socket.on('enterBuilding', (data) => {
    const player = gameState.getPlayer(socket.id);
    if (player) {
      socket.emit('buildingEntered', {
        buildingId: data.buildingId,
        buildingType: data.buildingType,
        scene: player.scene
      });
    }
  });

  // Handle building exit
  socket.on('exitBuilding', (data) => {
    const player = gameState.getPlayer(socket.id);
    if (player) {
      socket.emit('buildingExited', {
        scene: player.scene,
        x: data.x || player.x,
        y: data.y || player.y
      });
    }
  });

  // Handle fist bump
  socket.on('fistBump', (data) => {
    const player = gameState.getPlayer(socket.id);
    if (!player) return;

    let success = false;
    let uniqueTargetId = null;
    const type = data.type || 'player';

    if (type === 'player') {
        const nearbyPlayers = gameState.getNearbyPlayers(socket.id, 100);
        const targetPlayer = nearbyPlayers.find(p => p.id === data.targetId);

        if (targetPlayer) {
          // Notify both players
          io.to(socket.id).emit('fistBumpSuccess', { targetId: data.targetId });
          io.to(data.targetId).emit('fistBumpReceived', { fromId: socket.id });
          
          // Notify nearby players
          const playersInScene = gameState.getPlayersInScene(player.scene);
          playersInScene.forEach(p => {
            io.to(p.id).emit('fistBumpAnimation', {
              player1Id: socket.id,
              player2Id: data.targetId
            });
          });
          success = true;
          uniqueTargetId = targetPlayer.name; // Use name for persistence
        }
    } else if (type === 'cat') {
        // Trust client for cat interactions
        if (data.targetId) {
            success = true;
            uniqueTargetId = data.targetId;
        }
    }

    if (success && uniqueTargetId) {
        const scoreChanged = gameState.incrementScore(socket.id, uniqueTargetId);
        if (scoreChanged) {
            socket.emit('scoreUpdate', { score: player.score });
            io.emit('leaderboardUpdate', gameState.getLeaderboard());
        }
    }
  });

  // Handle chat
  socket.on('chatMessage', (data) => {
    const player = gameState.getPlayer(socket.id);
    if (player) {
      const playersInScene = gameState.getPlayersInScene(player.scene);
      playersInScene.forEach(p => {
        io.to(p.id).emit('chatMessage', {
          id: socket.id,
          name: player.name,
          message: data.message
        });
      });
    }
  });

  // Periodic state sync (every 100ms for smooth movement)
  const syncInterval = setInterval(() => {
    const player = gameState.getPlayer(socket.id);
    if (player) {
      const playersInScene = gameState.getPlayersInScene(player.scene);
      socket.emit('sceneSync', {
        players: playersInScene
      });
    }
  }, 100);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    clearInterval(syncInterval);
    gameState.removePlayer(socket.id);
    socket.broadcast.emit('playerLeft', { id: socket.id });
    io.emit('leaderboardUpdate', gameState.getLeaderboard());
  });
});

server.listen(PORT, () => {
  console.log(`LSL MMORPG Server running on port ${PORT}`);
});

