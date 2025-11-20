require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameState = require('./gameState');
const db = require('./db');

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
  cors: corsOptions,
  transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
  allowEIO3: true, // Allow Engine.IO v3 clients
  pingTimeout: 60000, // Increase timeout for Railway proxy
  pingInterval: 25000, // Send ping every 25s
  connectTimeout: 45000, // Connection timeout
  path: '/socket.io/', // Explicit path
  serveClient: false // Don't serve client files
});

const gameState = new GameState();

const PORT = process.env.PORT || 3000;

// Serve static files if needed
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to check database
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.pool.query('SELECT NOW()');
    res.json({ database: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ database: 'error', error: err.message });
  }
});

io.on('connection', async (socket) => {
  try {
    console.log(`Player attempting connection: ${socket.id}`);

    // Add player to game state
    const playerName = socket.handshake.query.name || 'Anonymous';

    // Normalize social parameters - Socket.IO may send 'null', 'undefined', or empty strings
    const normalizeSocialParam = (param) => {
      if (!param || param === 'null' || param === 'undefined' || param.trim() === '') {
        return null;
      }
      return param.trim();
    };

    const socialPlatform = normalizeSocialParam(socket.handshake.query.socialPlatform);
    const socialHandle = normalizeSocialParam(socket.handshake.query.socialHandle);
    console.log(`Adding player: ${playerName} (${socialPlatform}: ${socialHandle})`);

    const player = await gameState.addPlayer(socket.id, playerName, socialPlatform, socialHandle);
    console.log(`Player added to game state: ${socket.id}`);

    // Send initial game state to new player
    socket.emit('gameState', {
      player: player,
      allPlayers: gameState.getAllPlayers(),
      leaderboard: gameState.getLeaderboard()
    });

    // Send recent chat history
    try {
      const result = await db.pool.query(
        'SELECT player_name as name, message FROM chat_messages ORDER BY timestamp DESC LIMIT 50'
      );
      // Send in reverse order (oldest first) so client appends correctly
      const history = result.rows.reverse();
      socket.emit('chatHistory', history);
    } catch (err) {
      console.error('Error fetching chat history:', err);
      // Continue even if chat history fails
      socket.emit('chatHistory', []);
    }

    console.log(`Player connected successfully: ${socket.id}`);


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
    // Handle building entry
    socket.on('enterBuilding', (data) => {
      const player = gameState.getPlayer(socket.id);
      if (player) {
        // Update player scene to the building type (e.g., 'bar', 'hotel')
        const oldScene = player.scene;
        const updatedPlayer = gameState.updatePlayer(socket.id, { scene: data.buildingType });

        if (updatedPlayer) {
          // Notify players in old scene
          socket.broadcast.emit('playerLeftScene', { id: socket.id, scene: oldScene });

          // Notify client of success
          socket.emit('buildingEntered', {
            buildingId: data.buildingId,
            buildingType: data.buildingType,
            scene: updatedPlayer.scene
          });

          // Send new scene state (players inside the building)
          const playersInBuilding = gameState.getPlayersInScene(data.buildingType);
          socket.emit('sceneState', {
            players: playersInBuilding
          });

          // Notify players in new scene (building)
          playersInBuilding.forEach(p => {
            if (p.id !== socket.id) {
              io.to(p.id).emit('playerJoinedScene', updatedPlayer);
            }
          });
        }
      }
    });

    // Handle building exit
    // Handle building exit
    socket.on('exitBuilding', (data) => {
      const player = gameState.getPlayer(socket.id);
      if (player) {
        const oldScene = player.scene;
        const targetScene = data.targetScene || 'city'; // Default fallback

        const updatedPlayer = gameState.updatePlayer(socket.id, {
          scene: targetScene,
          x: data.x || player.x,
          y: data.y || player.y
        });

        if (updatedPlayer) {
          // Notify players in building (old scene)
          socket.broadcast.emit('playerLeftScene', { id: socket.id, scene: oldScene });

          // Notify client
          socket.emit('buildingExited', {
            scene: updatedPlayer.scene,
            x: updatedPlayer.x,
            y: updatedPlayer.y
          });

          // Send new scene state (outdoor)
          const playersInNewScene = gameState.getPlayersInScene(targetScene);
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
      }
    });

    // Handle fist bump
    socket.on('fistBump', async (data) => {
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
        const scoreChanged = await gameState.incrementScore(socket.id, uniqueTargetId);
        if (scoreChanged) {
          socket.emit('scoreUpdate', { score: player.score });
          io.emit('leaderboardUpdate', gameState.getLeaderboard());
        }
      }
    });

    socket.on('dateResult', async (data) => {
      const points = Number(data?.points) || 0;
      if (points <= 0) return;

      const scoreChanged = await gameState.addScore(socket.id, points);
      if (scoreChanged) {
        const updatedPlayer = gameState.getPlayer(socket.id);
        socket.emit('scoreUpdate', { score: updatedPlayer.score });
        io.emit('leaderboardUpdate', gameState.getLeaderboard());
      }
    });

    // Handle chat
    socket.on('chatMessage', async (data) => {
      const player = gameState.getPlayer(socket.id);
      if (player) {
        // Persist to DB
        try {
          await db.pool.query(
            'INSERT INTO chat_messages (player_name, message) VALUES ($1, $2)',
            [player.name, data.message]
          );
        } catch (err) {
          console.error('Error saving chat message:', err);
        }

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
  } catch (error) {
    console.error(`Error in connection handler for ${socket.id}:`, error);
    console.error('Stack trace:', error.stack);
    // Try to notify the client of the error
    try {
      socket.emit('error', { message: 'Server error during connection' });
    } catch (emitError) {
      console.error('Could not emit error to socket:', emitError);
    }
  }
});

server.listen(PORT, async () => {
  await db.initDB();
  await gameState.initialize(); // Load all players from database
  console.log(`LSL MMORPG Server running on port ${PORT}`);
});

