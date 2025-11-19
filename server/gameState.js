const db = require('./db');

class GameState {
  constructor() {
    this.players = new Map(); // socketId -> player data
    this.persistentScores = new Map(); // playerName -> { score, bumpedTargets }
    this.scenes = ['beach', 'city', 'bar', 'hotel'];
  }

  async addPlayer(socketId, playerName) {
    // Random spawn in one of the scenes
    const randomScene = this.scenes[Math.floor(Math.random() * this.scenes.length)];
    const spawnX = 100 + Math.random() * 200; // Random spawn position
    const spawnY = 900; // Ground level (adjusted for visual ground)

    const name = playerName || `Player_${socketId.substring(0, 6)}`;

    // Initialize or retrieve persistent score from DB
    let score = 0;
    let bumpedTargets = new Set();

    try {
      // Check if player exists
      const res = await db.pool.query('SELECT score, bumped_targets FROM players WHERE name = $1', [name]);

      if (res.rows.length > 0) {
        score = res.rows[0].score;
        // Postgres stores arrays as {item1,item2}, but pg parses them to JS arrays if type is correct.
        // We defined bumped_targets as TEXT[], so it should be an array of strings.
        bumpedTargets = new Set(res.rows[0].bumped_targets || []);
      } else {
        // Create new player entry
        await db.pool.query('INSERT INTO players (name, score, bumped_targets) VALUES ($1, $2, $3)', [name, 0, []]);
      }
    } catch (err) {
      console.error('Error loading player data:', err);
    }

    // Update in-memory map for fast access (optional, but good for performance)
    this.persistentScores.set(name, {
      score: score,
      bumpedTargets: bumpedTargets
    });

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
      score: score,
      bumpedTargets: bumpedTargets
    };

    this.players.set(socketId, player);
    return player;
  }

  async incrementScore(socketId, uniqueTargetId) {
    const player = this.players.get(socketId);
    if (!player) return false;

    // Access persistent data directly to ensure updates persist
    const persistentData = this.persistentScores.get(player.name);
    if (!persistentData) return false;

    if (!persistentData.bumpedTargets.has(uniqueTargetId)) {
      persistentData.bumpedTargets.add(uniqueTargetId);
      persistentData.score += 1;

      // Sync back to active player object
      player.score = persistentData.score;

      // Persist to DB
      try {
        await db.pool.query(
          'UPDATE players SET score = $1, bumped_targets = $2, last_active = CURRENT_TIMESTAMP WHERE name = $3',
          [persistentData.score, Array.from(persistentData.bumpedTargets), player.name]
        );
      } catch (err) {
        console.error('Error updating score:', err);
      }

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
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
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

