import { Player } from '../entities/Player.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { PALETTE, createGradientTexture } from '../utils/Visuals.js';
import { DateManager } from '../utils/DateManager.js';

const BUMPED_CATS_KEY = 'lsl_bumped_cats';

const TYPE_DIFFICULTY = {
  bar: 'easy',
  cafe: 'medium',
  lounge: 'medium',
  hotel: 'hard',
  boss: 'boss'
};

const BUILDING_DIFFICULTY_MAP = {
  main_bar: 'easy',
  bar_lounge: 'medium',
  beach_bar: 'easy',
  city_bar: 'easy',
  hotel_lounge: 'medium',
  beach_hotel: 'hard',
  beach_boss: 'boss',
  grand_hotel: 'hard',
  city_hotel: 'hard'
};
// Win path math: goal is Style Tier 4 (2000 pts, since tiers climb every 500 and Style Tier = floor(score / 500)).
// Incremental unlocks without repeats: 2x easy (2 * 250 = 500) lifts you to Tier 1 so you can start mediums;
// 3x medium adds 600 (total 1100) for Tier 2 access to hards; 2x hard adds 700 (total 1800) to reach Tier 3 for the boss;
// the boss grants 600 more (total 2400), clearing Tier 4 with room to spare—every gate opens in sequence on first clears.

function loadBumpedCats() {
  try {
    const raw = localStorage.getItem(BUMPED_CATS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (err) {
    console.warn('Unable to load bumped cats', err);
    return new Set();
  }
}

function persistBumpedCats(set) {
  try {
    localStorage.setItem(BUMPED_CATS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Unable to persist bumped cats', err);
  }
}

export class BuildingInterior extends Phaser.Scene {
  constructor() {
    super({ key: 'BuildingInterior' });
  }

  init(data) {
    this.buildingType = data.buildingType || 'bar';
    this.buildingId = data.buildingId || 'unknown';
    this.returnScene = data.returnScene || 'BeachScene';
    this.returnX = data.returnX || 100;
    this.returnY = data.returnY || 900;
    const defaultDifficulty = BUILDING_DIFFICULTY_MAP[this.buildingId] || TYPE_DIFFICULTY[this.buildingType] || 'easy';
    this.dateDifficulty = data.dateDifficulty || defaultDifficulty;
    this.buildingDifficulty = this.dateDifficulty;
    this.bumpedCats = loadBumpedCats();
  }

  create() {
    // Ensure game has focus for keyboard input
    this.input.on('pointerdown', () => {
      this.input.keyboard.enabled = true;
    });

    // Mobile Input State
    // this.virtualInput = { left: false, right: false };
    // this.setupMobileControls();

    // Interior background - Dark gradients
    createGradientTexture(this, 'interiorBg', 1920, 1080, 0x000000, 0x1a0b2e);
    this.add.image(960, 540, 'interiorBg').setDepth(-100);

    // Checkerboard Floor
    this.createFloor();

    // Input lock flag for in-room overlays
    this.inputLocked = false;

    // Interior decorations based on building type
    // Generate random properties based on buildingId
    const seed = this.buildingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = (idx) => {
      const x = Math.sin(seed + idx) * 10000;
      return x - Math.floor(x);
    };

    const isBarStyle = this.buildingType === 'bar' || this.buildingType === 'lounge' || this.buildingType === 'cafe';

    if (isBarStyle) {
      const barName = this.buildingId.replace(/_/g, ' ').toUpperCase();
      const barColor = rand(1) > 0.5 ? '#FF00FF' : '#00FFFF';

      // Neon Bar Sign
      const title = this.add.text(960, 200, barName, {
        fontSize: '48px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        stroke: barColor,
        strokeThickness: 4,
        shadow: { blur: 20, color: barColor, fill: true }
      });
      title.setOrigin(0.5);

      // Bar counter with neon edge
      const counter = this.add.rectangle(960, 700, 600, 150, 0x000000);
      counter.setStrokeStyle(4, parseInt(barColor.replace('#', '0x')));

      // Shelves
      for (let i = 0; i < 3; i++) {
        this.add.rectangle(960, 500 + i * 50, 500, 10, 0x333333);
      }

      // Add some "bottles" (colored rectangles)
      for (let i = 0; i < 20; i++) {
        const color = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00][Math.floor(rand(i + 10) * 4)];
        this.add.rectangle(750 + i * 25, 480 + (i % 3) * 50, 10, 20, color);
      }

    } else {
      const hotelName = this.buildingId.replace(/_/g, ' ').toUpperCase();
      const hotelColor = rand(2) > 0.5 ? '#FFD700' : '#FF0055';

      // Hotel Lobby
      const title = this.add.text(960, 200, hotelName, {
        fontSize: '48px',
        fontFamily: 'Courier New',
        color: '#ffffff',
        stroke: hotelColor,
        strokeThickness: 4,
        shadow: { blur: 20, color: hotelColor, fill: true }
      });
      title.setOrigin(0.5);

      // Reception desk
      const desk = this.add.rectangle(960, 700, 500, 120, 0x222222);
      desk.setStrokeStyle(4, parseInt(hotelColor.replace('#', '0x')));

      // Plants
      const plantColor = rand(3) > 0.5 ? 0x00ff00 : 0x00cc00;
      this.add.circle(650, 680, 40, plantColor).setDepth(-1);
      this.add.circle(1270, 680, 40, plantColor).setDepth(-1);
    }

    // Exit sign (Neon style)
    const exitText = this.add.text(100, 100, 'EXIT (E)', {
      fontSize: '24px',
      fontFamily: 'Courier New',
      color: '#ff0055',
      stroke: '#ff0055',
      strokeThickness: 2,
      shadow: { blur: 10, color: '#ff0055', fill: true }
    });

    // Create local player at entrance
    this.createPlayer();

    // Initialize remotePlayers array (even if empty) to prevent Player crashes
    this.remotePlayers = [];

    // Setup exit
    this.exitKey = this.input.keyboard.addKey('E');

    // Play building music keyed to difficulty
    window.musicManager.playSceneMusic(this.getInteriorMusicKey());

    // Add Techno Cats
    this.createCats();

    // Date booth and dialogue system
    this.createDateBooth();
    this.dateManager = new DateManager(this);

    // Fist bump key
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Exit state
    this.isExiting = false;

    // Network handling
    this.networkHandlers = null;
    this.setupNetworkEvents();

    this.events.on('shutdown', () => {
      this.cleanupNetworkEvents();
      // this.cleanupMobileControls();
    }, this);
  }

  getInteriorMusicKey() {
    const typeKey = `building_${this.buildingType}`;
    const difficultyKey = `building_${this.dateDifficulty}`;
    if (window.musicManager && window.musicManager.themes) {
      if (window.musicManager.themes[typeKey]) return typeKey;
      if (window.musicManager.themes[difficultyKey]) return difficultyKey;
    }
    return 'building';
  }

  // cleanupMobileControls() { ... }

  createCats() {
    this.cats = [];
    const catCount = 5;

    for (let i = 0; i < catCount; i++) {
      const x = 600 + Math.random() * 800; // Random positions
      const y = 800 + Math.random() * 50;

      const container = this.add.container(x, y);
      container.setDepth(10);

      // Cat Body Colors
      const bodyColor = [0x333333, 0xffffff, 0xffcc00, 0x999999][Math.floor(Math.random() * 4)];

      // --- Improved Cat Visuals ---

      // 1. Back Legs / Haunches (Sitting posture base)
      const haunches = this.add.ellipse(0, 10, 34, 24, bodyColor);

      // 2. Front Body/Chest
      const chest = this.add.rectangle(0, 2, 20, 25, bodyColor);

      // 3. Front Legs
      const legL = this.add.rectangle(-6, 18, 6, 14, bodyColor);
      const legR = this.add.rectangle(6, 18, 6, 14, bodyColor);

      // 4. Head
      const head = this.add.ellipse(0, -12, 28, 24, bodyColor);

      // 5. Ears
      // Triangle points relative to center (0,0)
      const earLeft = this.add.triangle(-8, -22, 0, 0, -6, 12, 6, 12, bodyColor);
      const earRight = this.add.triangle(8, -22, 0, 0, -6, 12, 6, 12, bodyColor);

      // 6. Tail
      const tail = this.add.rectangle(12, 10, 25, 6, bodyColor);
      tail.setOrigin(0, 0.5);
      tail.setRotation(-0.5);

      // 7. Face
      // Eyes
      const eyeColor = 0x00ff00; // Laser eyes for techno
      const eyeLeft = this.add.circle(-5, -14, 2.5, eyeColor);
      const eyeRight = this.add.circle(5, -14, 2.5, eyeColor);

      // Nose
      const nose = this.add.triangle(0, -10, 0, 0, -2.5, -2.5, 2.5, -2.5, 0xffaec9); // Pink nose

      // Whiskers (using Graphics)
      const whiskers = this.add.graphics();
      whiskers.lineStyle(1, 0xdddddd);
      // Right whiskers
      whiskers.moveTo(4, -9); whiskers.lineTo(18, -11);
      whiskers.moveTo(4, -9); whiskers.lineTo(18, -8);
      // Left whiskers
      whiskers.moveTo(-4, -9); whiskers.lineTo(-18, -11);
      whiskers.moveTo(-4, -9); whiskers.lineTo(-18, -8);
      whiskers.strokePath();

      container.add([tail, haunches, chest, legL, legR, head, earLeft, earRight, eyeLeft, eyeRight, nose, whiskers]);

      // Store properties for animation
      container.initialY = y;
      container.tail = tail;
      container.phase = Math.random() * Math.PI * 2;
      container.id = `${this.buildingId}_cat_${i}`;

      this.cats.push(container);
    }
  }

  updateCats(time) {
    if (!this.cats) return;

    // Techno tempo ~135 BPM
    const beat = (time / 1000) * (135 / 60) * Math.PI * 2;

    this.cats.forEach((cat, index) => {
      // Bobbing body
      const bounce = Math.sin(beat + cat.phase) * 8;
      cat.y = cat.initialY + bounce;

      // Head bang (rotation)
      cat.rotation = Math.sin(beat * 2 + cat.phase) * 0.05;

      // Tail Wag
      if (cat.tail) {
        cat.tail.rotation = -0.5 + Math.sin(beat + cat.phase) * 0.5;
      }

      // Occasional Jump
      if (Math.random() > 0.995) {
        cat.y -= 30;
      }
    });
  }

  checkCatInteraction() {
    if (!this.localPlayer || !this.cats) return;

    const playerX = this.localPlayer.x;
    const playerY = this.localPlayer.y;

    let interacted = false;

    this.cats.forEach(cat => {
      const dist = Phaser.Math.Distance.Between(playerX, playerY, cat.x, cat.y);

      if (dist < 100) {
        // Fist bump!
        this.triggerCatFistBump(cat);

        // Also trigger player animation
        if (this.localPlayer) {
          this.localPlayer.triggerFistBump();
        }
        interacted = true;
      }
    });

    return interacted;
  }

  triggerCatFistBump(cat) {
    if (this.bumpedCats?.has(cat.id)) {
      const text = this.add.text(cat.x, cat.y - 50, 'They already vibe with you.', {
        fontSize: '18px',
        fontFamily: 'Courier New',
        color: '#ccccff',
        stroke: '#000000',
        strokeThickness: 3
      });
      text.setOrigin(0.5);
      this.tweens.add({
        targets: text,
        y: cat.y - 100,
        alpha: 0,
        duration: 900,
        onComplete: () => text.destroy()
      });
      return;
    }

    this.bumpedCats.add(cat.id);
    persistBumpedCats(this.bumpedCats);

    // Visual feedback
    const text = this.add.text(cat.x, cat.y - 50, 'FIST BUMP!', {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3
    });
    text.setOrigin(0.5);

    // Animate text up and fade
    this.tweens.add({
      targets: text,
      y: cat.y - 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy()
    });

    // Cat reaction: Spin
    this.tweens.add({
      targets: cat,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Bounce.easeOut'
    });

    // Emit network event for fist bump so others see it (optional, maybe just local for now)
    if (window.networkClient) {
      window.networkClient.fistBump(cat.id, 'cat');
    }
  }

  createDateBooth() {
    this.dateBooth = this.add.rectangle(1400, 760, 220, 120, 0xff66aa, 0.25);
    this.dateBooth.setStrokeStyle(3, 0xff00ff, 0.8);
    this.dateBooth.setDepth(5);

    this.datePartner = this.add.text(this.dateBooth.x, this.dateBooth.y - 80, 'DATE SPOT', {
      fontSize: '26px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 4,
      shadow: { blur: 10, color: '#ff00ff', fill: true }
    });
    this.datePartner.setOrigin(0.5);
    this.datePartner.setDepth(6);

    const difficultyLabel = this.dateDifficulty.toUpperCase();
    this.datePrompt = this.add.text(this.dateBooth.x, this.dateBooth.y - 130, `Press E to start a ${difficultyLabel} neon date`, {
      fontSize: '18px',
      fontFamily: 'Courier New',
      color: '#ffddff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      padding: { x: 8, y: 6 }
    });
    this.datePrompt.setOrigin(0.5);
    this.datePrompt.setDepth(7);
    this.datePrompt.setVisible(false);
  }

  updateDateBoothPrompt() {
    if (!this.localPlayer || !this.dateBooth || !this.dateManager) return;

    const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, this.dateBooth.x, this.dateBooth.y);
    const canPrompt = dist < 200 && !this.dateManager.isActive();
    this.datePrompt.setVisible(canPrompt);
    if (canPrompt) {
      this.datePrompt.setPosition(this.dateBooth.x, this.dateBooth.y - 130);
    }
  }

  tryStartDate() {
    if (!this.localPlayer || !this.dateBooth || !this.dateManager) return false;
    const dist = Phaser.Math.Distance.Between(this.localPlayer.x, this.localPlayer.y, this.dateBooth.x, this.dateBooth.y);
    if (dist < 200) {
      this.dateManager.startDate(this.buildingType, this.dateDifficulty);
      return true;
    }
    return false;
  }

  createFloor() {
    const graphics = this.add.graphics();
    const floorY = 800;

    // Draw checkerboard in perspective
    for (let y = 0; y < 10; y++) {
      for (let x = -10; x < 20; x++) {
        const color = (x + y) % 2 === 0 ? 0x2c1e4a : 0x000000; // Dark purple / Black
        graphics.fillStyle(color, 1);

        // Simple perspective projection
        const scale = 1 + y * 0.2;
        const w = 100 * scale;
        const h = 40 * scale;
        const px = 960 + (x - 5) * w;
        const py = floorY + y * h * 0.5;

        // Draw quad (simplified as rect for now)
        graphics.fillRect(px, py, w, h);
      }
    }
    graphics.setDepth(-50);

    // Physics floor (invisible)
    const ground = this.add.rectangle(960, 980, 1920, 200, 0x000000, 0);
    this.physics.add.existing(ground, true);
    ground.body.setSize(1920, 200);
  }

  createPlayer() {
    const networkClient = window.networkClient;
    if (networkClient && networkClient.getPlayerId()) {
      // Map scene name to scene key
      const sceneMap = {
        'beach': 'BeachScene',
        'city': 'CityScene',
        'bar': 'BarScene',
        'hotel': 'HotelScene'
      };
      const sceneKey = sceneMap[this.returnScene] || 'BeachScene';

      // Get player data from previous scene
      const previousScene = this.scene.get(sceneKey);
      let playerData = {
        id: networkClient.getPlayerId(),
        name: 'Player',
        color: 0xff6b6b,
        isLocal: true
      };

      if (previousScene && previousScene.localPlayer) {
        playerData = { ...previousScene.localPlayer.playerData, isLocal: true };
      }

      this.localPlayer = new Player(this, 200, 800, playerData);

      // Camera follow
      this.cameras.main.setBounds(0, 0, 1920, 1080);
      this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);

      // Immediately sync position/presence in the building
      // Since we just entered, the server knows we are here (from enterBuilding),
      // but we should ensure our local coordinates are sent if they differ from spawn.
      window.networkClient.sendPlayerMove({
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        facing: this.localPlayer.facing,
        animState: 'idle'
      });
    }
  }

  update(time, delta) {
    if (this.localPlayer) {
      this.localPlayer.update(time, delta);
    }

    this.updateDateBoothPrompt();

    // Check for exit (disabled while date UI active)
    if (Phaser.Input.Keyboard.JustDown(this.exitKey) && !this.dateManager?.isActive()) {
      if (!this.tryStartDate()) {
        this.exitBuilding();
      }
    }

    // Update cats
    this.updateCats(time);

    // Update remote players
    this.remotePlayers.forEach(player => {
      if (player && player.active) {
        player.update(time, delta);
      }
    });
  }

  handlePlayerInput(key) {
    if (key === 'space') {
      return this.checkCatInteraction();
    }
    return false;
  }

  // setupMobileControls() { ... }

  onMobileAction(action) {
    console.log('BuildingInterior onMobileAction:', action);
    if (action === 'enter') {
      if (!this.dateManager?.isActive() && this.tryStartDate()) return;
      this.exitBuilding();
    }
    if (action === 'action' && this.localPlayer) {
      if (!this.checkCatInteraction()) this.localPlayer.attemptFistBump();
    }
  }

  exitBuilding() {
    if (this.isExiting) return;
    this.isExiting = true;

    // Return to previous scene
    const exitX = this.returnX;
    const exitY = 900; // Force ground level to avoid sky-spawning

    if (this.localPlayer) {
      window.networkClient.exitBuilding(exitX, exitY, this.returnScene);
    } else {
      window.networkClient.exitBuilding(exitX, exitY, this.returnScene);
    }

    // Switch scene
    const sceneMap = {
      'beach': 'BeachScene',
      'city': 'CityScene',
      'bar': 'BarScene',
      'hotel': 'HotelScene'
    };
    const sceneKey = sceneMap[this.returnScene] || 'BeachScene';

    // Pass player data back
    let playerData = this.localPlayer ? this.localPlayer.playerData : {};
    playerData.x = exitX;
    playerData.y = exitY;
    playerData.scene = this.returnScene;

    this.scene.start(sceneKey, {
      returnX: exitX,
      returnY: exitY,
      player: playerData
    });
  }


  setupNetworkEvents() {
    const networkClient = window.networkClient;
    if (!networkClient) return;

    this.networkHandlers = {
      playerJoined: (player) => {
        // In building, we only care if they are in the same building type/id
        // But currently server only tracks 'scene'. 
        // The server sets scene='bar' or 'hotel'.
        if (player.scene === this.buildingType && player.id !== networkClient.getPlayerId()) {
          this.addRemotePlayer(player);
        }
      },
      playerJoinedScene: (player) => {
        console.log(`[BuildingInterior] playerJoinedScene: ${player.id} joined scene ${player.scene} (local: ${this.buildingType})`);
        if (player.scene === this.buildingType && player.id !== networkClient.getPlayerId()) {
          this.addRemotePlayer(player);
        }
      },
      playerLeft: (data) => {
        this.removeRemotePlayer(data.id);
      },
      playerLeftScene: (data) => {
        console.log(`[BuildingInterior] playerLeftScene: ${data.id} left scene`);
        this.removeRemotePlayer(data.id);
      },
      sceneState: (data) => {
        console.log(`[BuildingInterior] sceneState: received ${data.players?.length || 0} players`);
        if (data.players) {
          this.addRemotePlayers(data.players.filter(p => p.id !== networkClient.getPlayerId()));
        }
      },
      playerUpdate: (player) => {
        if (player.scene === this.buildingType && player.id !== networkClient.getPlayerId()) {
          this.updateRemotePlayer(player);
        }
      },
      sceneSync: (data) => {
        if (data.players) {
          this.syncPlayers(data.players);
        }
      },
      fistBumpAnimation: (data) => {
        this.handleFistBumpAnimation(data);
      }
    };

    Object.entries(this.networkHandlers).forEach(([event, handler]) => {
      networkClient.on(event, handler);
    });
  }

  cleanupNetworkEvents() {
    if (!this.networkHandlers) return;
    const networkClient = window.networkClient;
    if (networkClient) {
      Object.entries(this.networkHandlers).forEach(([event, handler]) => {
        networkClient.off(event, handler);
      });
    }
    this.networkHandlers = null;
  }

  getPlayerNameById(id) {
    if (this.localPlayer && this.localPlayer.playerData.id === id) {
      return this.localPlayer.playerData.name;
    }
    const remote = this.remotePlayers.find(p => p.playerData.id === id);
    return remote ? remote.playerData.name : null;
  }

  addRemotePlayer(playerData) {
    const existing = this.remotePlayers.find(p => p.playerData.id === playerData.id);
    if (existing) {
      existing.updateFromNetwork(playerData);
      return;
    }

    // For interior, we might need to adjust coordinates if they are global?
    // Server sends global coordinates. 
    // If players are in the same building, they should have valid coordinates for that building.
    const remotePlayer = new RemotePlayer(this, playerData.x, playerData.y, playerData);
    this.remotePlayers.push(remotePlayer);
  }

  addRemotePlayers(players) {
    players.forEach(player => {
      if (player.scene === this.buildingType) {
        this.addRemotePlayer(player);
      }
    });
  }

  removeRemotePlayer(playerId) {
    const index = this.remotePlayers.findIndex(p => p.playerData.id === playerId);
    if (index !== -1) {
      this.remotePlayers[index].destroy();
      this.remotePlayers.splice(index, 1);
    }
  }

  updateRemotePlayer(playerData) {
    const remotePlayer = this.remotePlayers.find(p => p.playerData.id === playerData.id);
    if (remotePlayer) {
      remotePlayer.updateFromNetwork(playerData);
    }
  }

  syncPlayers(players) {
    const networkClient = window.networkClient;
    const localPlayerId = networkClient.getPlayerId();

    // Filter for players in this building type
    const relevantPlayers = players.filter(p => p.scene === this.buildingType);

    relevantPlayers.forEach(player => {
      if (player.id !== localPlayerId) {
        this.updateRemotePlayer(player);
        // If not found, add it
        if (!this.remotePlayers.find(p => p.playerData.id === player.id)) {
          this.addRemotePlayer(player);
        }
      }
    });

    // Remove missing
    const activeIds = relevantPlayers.map(p => p.id);
    this.remotePlayers.forEach(rp => {
      if (rp.playerData.id !== localPlayerId && !activeIds.includes(rp.playerData.id)) {
        this.removeRemotePlayer(rp.playerData.id);
      }
    });
  }

  handleFistBumpAnimation(data) {
    if (this.localPlayer && this.localPlayer.playerData.id === data.player1Id) {
      this.localPlayer.triggerFistBump();
    }
    if (this.localPlayer && this.localPlayer.playerData.id === data.player2Id) {
      this.localPlayer.triggerFistBump();
    }

    const player1 = this.remotePlayers.find(p => p.playerData.id === data.player1Id);
    const player2 = this.remotePlayers.find(p => p.playerData.id === data.player2Id);

    if (player1) player1.triggerFistBump();
    if (player2) player2.triggerFistBump();
  }
}
