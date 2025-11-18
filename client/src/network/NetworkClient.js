export class NetworkClient {
  constructor(serverUrl, playerName) {
    // Use global io from Socket.io CDN
    this.socket = window.io(serverUrl, {
      query: { name: playerName }
    });
    this.playerId = null;
    this.connected = false;
    this.callbacks = {};

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.connected = false;
      this.emit('disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connected = false;
      this.emit('connect_error', error);
    });

    this.socket.on('gameState', (data) => {
      this.playerId = data.player.id;
      this.emit('gameState', data);
    });

    this.socket.on('playerJoined', (player) => {
      this.emit('playerJoined', player);
    });

    this.socket.on('playerLeft', (data) => {
      this.emit('playerLeft', data);
    });

    this.socket.on('playerUpdate', (player) => {
      this.emit('playerUpdate', player);
    });

    this.socket.on('playerJoinedScene', (player) => {
      this.emit('playerJoinedScene', player);
    });

    this.socket.on('playerLeftScene', (data) => {
      this.emit('playerLeftScene', data);
    });

    this.socket.on('sceneState', (data) => {
      this.emit('sceneState', data);
    });

    this.socket.on('sceneSync', (data) => {
      this.emit('sceneSync', data);
    });

    this.socket.on('buildingEntered', (data) => {
      this.emit('buildingEntered', data);
    });

    this.socket.on('buildingExited', (data) => {
      this.emit('buildingExited', data);
    });

    this.socket.on('fistBumpSuccess', (data) => {
      this.emit('fistBumpSuccess', data);
    });

    this.socket.on('fistBumpReceived', (data) => {
      this.emit('fistBumpReceived', data);
    });

    this.socket.on('fistBumpAnimation', (data) => {
      this.emit('fistBumpAnimation', data);
    });

    this.socket.on('chatMessage', (data) => {
      this.emit('chatMessage', data);
    });

    this.socket.on('scoreUpdate', (data) => {
      this.emit('scoreUpdate', data);
    });

    this.socket.on('leaderboardUpdate', (data) => {
      this.emit('leaderboardUpdate', data);
    });
  }

  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  off(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  removeAllListeners(event) {
    if (event) {
      this.callbacks[event] = [];
    } else {
      this.callbacks = {};
    }
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  sendPlayerMove(data) {
    if (this.connected) {
      this.socket.emit('playerMove', data);
    }
  }

  changeScene(scene, x, y) {
    if (this.connected) {
      this.socket.emit('changeScene', { scene, x, y });
    }
  }

  enterBuilding(buildingId, buildingType) {
    if (this.connected) {
      this.socket.emit('enterBuilding', { buildingId, buildingType });
    }
  }

  exitBuilding(x, y) {
    if (this.connected) {
      this.socket.emit('exitBuilding', { x, y });
    }
  }

  fistBump(targetId, type = 'player') {
    if (this.connected) {
      this.socket.emit('fistBump', { targetId, type });
    }
  }

  sendChat(message) {
    if (this.connected) {
      this.socket.emit('chatMessage', { message });
    }
  }

  getPlayerId() {
    return this.playerId;
  }
}

