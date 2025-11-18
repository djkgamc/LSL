class GameState {
  constructor() {
    this.players = new Map(); // socketId -> player data
    this.scenes = ['beach', 'city', 'bar', 'hotel'];
  }

  addPlayer(socketId, playerName) {
    // Random spawn in one of the scenes
    const randomScene = this.scenes[Math.floor(Math.random() * this.scenes.length)];
    const spawnX = 100 + Math.random() * 200; // Random spawn position
    const spawnY = 900; // Ground level (adjusted for visual ground)

    const player = {
      id: socketId,
      name: playerName || `Player_${socketId.substring(0, 6)}`,
      scene: randomScene,
      x: spawnX,
      y: spawnY,
      facing: 'right',
      animState: 'idle',
      color: this.getRandomColor(),
      lastUpdate: Date.now()
    };

    this.players.set(socketId, player);
    return player;
  }

  removePlayer(socketId) {
    return this.players.delete(socketId);
  }

  updatePlayer(socketId, data) {
    const player = this.players.get(socketId);
    if (!player) return null;

    // Update player state
    if (data.x !== undefined) player.x = data.x;
    if (data.y !== undefined) player.y = data.y;
    if (data.scene !== undefined) player.scene = data.scene;
    if (data.facing !== undefined) player.facing = data.facing;
    if (data.animState !== undefined) player.animState = data.animState;
    
    player.lastUpdate = Date.now();
    return player;
  }

  getPlayersInScene(scene) {
    return Array.from(this.players.values()).filter(p => p.scene === scene);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getRandomColor() {
    const colors = [
      0xff6b6b, // Red
      0x4ecdc4, // Teal
      0x45b7d1, // Blue
      0xffa07a, // Light salmon
      0x98d8c8, // Mint
      0xf7dc6f, // Yellow
      0xbb8fce, // Purple
      0x85c1e2  // Light blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getNearbyPlayers(socketId, range = 100) {
    const player = this.players.get(socketId);
    if (!player) return [];

    const playersInScene = this.getPlayersInScene(player.scene);
    return playersInScene.filter(p => {
      if (p.id === socketId) return false;
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= range;
    });
  }
}

module.exports = GameState;

