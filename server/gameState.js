class GameState {
  constructor() {
    this.players = new Map(); // socketId -> player data
    this.persistentScores = new Map(); // playerName -> { score, bumpedTargets }
    this.scenes = ['beach', 'city', 'bar', 'hotel'];
  }

  addPlayer(socketId, playerName) {
    // Random spawn in one of the scenes
    const randomScene = this.scenes[Math.floor(Math.random() * this.scenes.length)];
    const spawnX = 100 + Math.random() * 200; // Random spawn position
    const spawnY = 900; // Ground level (adjusted for visual ground)

    const name = playerName || `Player_${socketId.substring(0, 6)}`;

    // Initialize or retrieve persistent score
    if (!this.persistentScores.has(name)) {
      this.persistentScores.set(name, {
        score: 0,
        bumpedTargets: new Set()
      });
    }
    const persistentData = this.persistentScores.get(name);

    const player = {
      id: socketId,
      name: name,
      scene: randomScene,
      x: spawnX,
      y: spawnY,
      facing: 'right',
      animState: 'idle',
      color: this.getRandomColor(),
      lastUpdate: Date.now(),
      score: persistentData.score,
      bumpedTargets: persistentData.bumpedTargets
    };

    this.players.set(socketId, player);
    return player;
  }

  incrementScore(socketId, uniqueTargetId) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    // Access persistent data directly to ensure updates persist
    const persistentData = this.persistentScores.get(player.name);
    if (!persistentData) return false;

    if (!persistentData.bumpedTargets.has(uniqueTargetId)) {
      persistentData.bumpedTargets.add(uniqueTargetId);
      persistentData.score += 1;
      
      // Sync back to active player object (though they share the Set reference, score is primitive)
      player.score = persistentData.score;
      return true;
    }
    return false;
  }

  getLeaderboard() {
    return Array.from(this.persistentScores.entries())
      .map(([name, data]) => ({
        name: name,
        score: data.score,
        // For the leaderboard ID, we'll use the name since socket ID is transient
        id: name 
      }))
      .sort((a, b) => b.score - a.score);
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

