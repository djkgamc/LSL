import { Player } from '../entities/Player.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { Car } from '../entities/Car.js';
import { PALETTE, createGradientTexture } from '../utils/Visuals.js';

const DIFFICULTY_STYLES = {
  easy: {
    bodyColor: 0x0b3c4c,
    rimColor: 0x00ffff,
    signColor: '#00ffff',
    entryColor: 0x00ffff,
    windowLit: 0x8bffff
  },
  medium: {
    bodyColor: 0x3f0b3c,
    rimColor: 0xff00ff,
    signColor: '#ff00ff',
    entryColor: 0xff00ff,
    windowLit: 0xffa9ff
  },
  hard: {
    bodyColor: 0x4a3300,
    rimColor: 0xffd700,
    signColor: '#ffd700',
    entryColor: 0xffd700,
    windowLit: 0xfff2a8
  },
  boss: {
    bodyColor: 0x180b3c,
    rimColor: 0xffffff,
    signColor: '#ffffff',
    entryColor: 0xffd700,
    pulseBetween: [0x7f00ff, 0x00ffff, 0xffd700],
    windowLit: 0xe1d7ff
  }
};

export class MainScene extends Phaser.Scene {
  constructor(key, sceneName, backgroundColor) {
    super({ key });
    this.sceneName = sceneName;
    this.backgroundColor = backgroundColor || '#87ceeb';
  }

  init(data) {
    this.initialData = data;
    // If returning from a building or scene, use that position
    if (data.returnX) {
      this.spawnX = data.returnX;
      this.spawnY = data.returnY || 900;
    }
  }

  create() {
    // Ensure game has focus for keyboard input
    this.input.on('pointerdown', () => {
      this.input.keyboard.enabled = true;
    });

    // Mobile Input State
    // this.virtualInput = { left: false, right: false };
    // this.setupMobileControls();

    // Set background color
    this.cameras.main.setBackgroundColor(this.backgroundColor);

    // World bounds for side-scrolling
    this.physics.world.setBounds(0, 0, 1920, 1080);

    // Create background layers (parallax effect)
    this.createBackground();

    // Create ground/platform
    this.createGround();

    // Create buildings
    this.createBuildings();

    // Initialize player tracking
    this.localPlayer = null;
    this.remotePlayers = [];

    // Interaction prompt text
    this.interactionText = this.add.text(0, 0, 'Press E to Enter', {
      fontSize: '16px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 }
    });
    this.interactionText.setOrigin(0.5);
    this.interactionText.setDepth(100);
    this.interactionText.setVisible(false);

    // Flags
    this.isEnteringBuilding = false;

    // Interaction input handled in update loop
    this.eKey = this.input.keyboard.addKey('E');

    // Force cleanup of any stale listeners
    this.cleanupNetworkEvents();
    // this.cleanupMobileControls();

    // Setup network events
    this.setupNetworkEvents();

    // Cleanup on shutdown
    this.events.on('shutdown', () => {
      this.cleanupNetworkEvents();
      // this.cleanupMobileControls();
    }, this);

    // Handle initial data if provided (fixes race condition)
    if (this.initialData && this.initialData.player) {
      if (this.initialData.player.scene === this.sceneName) {
        // Override position if we have a return position
        if (this.spawnX) {
          this.initialData.player.x = this.spawnX;
          this.initialData.player.y = this.spawnY;
        }
        this.createLocalPlayer(this.initialData.player);
        if (this.initialData.allPlayers) {
          this.addRemotePlayers(this.initialData.allPlayers.filter(p => p.id !== this.initialData.player.id && p.scene === this.sceneName));
        }
      }
    }

    // Setup camera bounds (will follow player once created)
    this.cameras.main.setBounds(0, 0, 1920, 1080);

    // Clean up listeners when scene is shut down
    this.events.once('shutdown', () => {
      this.cleanupNetworkEvents();
    });

    // Car system
    this.car = null;
    this.time.addEvent({
      delay: 1000, //15000
      callback: () => {
        if (!this.car && Math.random() > 0.3) {
          this.spawnCar();
        }
      },
      loop: true
    });
  }

  // setupMobileControls() { ... }
  // cleanupMobileControls() { ... }

  onMobileAction(action) {
    console.log('MainScene onMobileAction:', action);
    if (action === 'enter') this.handleInteraction();
    if (action === 'action' && this.localPlayer) this.localPlayer.attemptFistBump();
  }

  handleInteraction() {
    // Debounce
    if (this.isEnteringBuilding) return;

    // Priority 1: Car (if nearby)
    if (this.car && this.localPlayer && !this.car.hasPlayer) {
      const dist = Phaser.Math.Distance.Between(this.car.x, this.car.y, this.localPlayer.x, this.localPlayer.y);
      if (dist < 150) {
        this.enterCar(this.car);
        return;
      }
    }

    // Priority 2: Building
    this.tryEnterBuilding();
  }

  spawnCar() {
    if (this.sceneName === 'beach') return; // No cars on the beach

    const direction = Math.random() > 0.5 ? 'right' : 'left';
    const y = 950; // On ground
    const x = direction === 'right' ? -200 : 2120;

    this.car = new Car(this, x, y, direction);
    this.car.setDepth(50); // Behind players but in front of buildings

    this.car.on('destroy', () => {
      this.car = null;
    });
  }

  enterCar(car) {
    if (!this.localPlayer) return;

    this.localPlayer.setVisible(false);
    this.localPlayer.body.enable = false;
    car.hasPlayer = true;

    // Lock camera to car
    this.cameras.main.startFollow(car, true, 0.1, 0.1);

    // Force direction to right if we want to go to rightmost screen?
    // User said "drives you all the way to the right most screen".
    // If car is going left, maybe it should turn around?
    // Or just keep going left and "drive around the world"?
    // Let's make it turn around if it was going left.
    if (car.direction === 'left') {
      car.direction = 'right';
      // Flip visuals? Simple car is symmetric enough or we can flip scale
      car.scaleX = -1;
    }
  }

  handleCarExit(car) {
    // Teleport to Beach Scene (Rightmost)
    const nextScene = 'beach';
    const nextX = 100;

    window.networkClient.changeScene(nextScene, nextX, 900);

    const sceneMap = {
      'beach': 'BeachScene',
      'city': 'CityScene',
      'bar': 'BarScene',
      'hotel': 'HotelScene'
    };

    this.scene.start(sceneMap[nextScene], {
      returnX: nextX,
      returnY: 900,
      player: { ...this.localPlayer.playerData, scene: nextScene, x: nextX, y: 900 }
    });
  }

  createBackground() {
    // Create sky gradient
    createGradientTexture(this, 'skyGradient', 1920, 1080, PALETTE.skyTop, PALETTE.skyBottom);
    const bg = this.add.image(960, 540, 'skyGradient');
    bg.setDepth(-100);

    // Add Sun (Synthwave style)
    const sun = this.add.circle(1600, 300, 120, PALETTE.sunTop);
    sun.setDepth(-99);
    // Add sun gradient effect
    const sunGlow = this.add.circle(1600, 300, 140, PALETTE.sunBottom, 0.4);
    sunGlow.setDepth(-100);

    // Add distant skyline silhouette
    this.createSkyline();
  }

  createSkyline() {
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1a0b2e, 1); // Dark silhouette color

    // Random skyline generation
    let x = 0;
    while (x < 1920) {
      const width = 40 + Math.random() * 80;
      const height = 100 + Math.random() * 300;
      graphics.fillRect(x, 1080 - 200 - height, width, height); // Above ground
      x += width;
    }
    graphics.setDepth(-90);
    graphics.setScrollFactor(0.2); // Parallax effect
  }

  createGround() {
    // Ground platform with neon grid effect
    createGradientTexture(this, 'groundGradient', 1920, 200, PALETTE.gridFill, 0x000000);
    const ground = this.add.image(960, 980, 'groundGradient'); // 1080 - 100
    this.physics.add.existing(ground, true);
    ground.body.setSize(1920, 200);
    ground.setDepth(-50);

    // Draw grid lines
    const graphics = this.add.graphics();
    graphics.lineStyle(2, PALETTE.gridLine, 0.3);

    // Horizontal lines (perspective)
    for (let y = 880; y < 1080; y += 40) {
      graphics.lineBetween(0, y, 1920, y);
    }

    // Vertical lines (perspective fan)
    const vanishPointX = 960;
    const vanishPointY = 540;
    for (let x = -1000; x < 3000; x += 200) {
      graphics.lineBetween(vanishPointX, vanishPointY, x, 1080);
    }

    // Mask grid to ground area
    const mask = this.add.rectangle(960, 980, 1920, 200, 0x000000).createGeometryMask();
    graphics.setMask(mask);
    graphics.setDepth(-49);
  }

  createBuildings() {
    // Override in subclasses
    this.buildings = [];
  }

  addDetailedBuilding(x, y, width, height, buildingId, buildingType, name, difficulty = 'easy') {
    const palette = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.easy;
    const building = { x, y, width, height, buildingId, buildingType, name, difficulty };

    // Main body (dark, tinted per difficulty)
    const body = this.add.rectangle(x, y, width, height, palette.bodyColor || PALETTE.buildingBody);
    body.setDepth(-10);
    body.setStrokeStyle(2, palette.rimColor || PALETTE.buildingRim); // Neon outline

    if (palette.pulseBetween && palette.pulseBetween.length >= 2) {
      let fromIndex = 0;
      let toIndex = 1;
      this.tweens.addCounter({
        from: 0,
        to: 100,
        duration: 1800,
        repeat: -1,
        yoyo: true,
        onYoyo: () => {
          fromIndex = (fromIndex + 1) % palette.pulseBetween.length;
          toIndex = (toIndex + 1) % palette.pulseBetween.length;
        },
        onUpdate: (tween) => {
          const value = tween.getValue();
          const fromColor = Phaser.Display.Color.IntegerToColor(palette.pulseBetween[fromIndex]);
          const toColor = Phaser.Display.Color.IntegerToColor(palette.pulseBetween[toIndex]);
          const interpolated = Phaser.Display.Color.Interpolate.ColorWithColor(
            fromColor,
            toColor,
            100,
            value
          );
          const newColor = Phaser.Display.Color.GetColor(interpolated.r, interpolated.g, interpolated.b);
          body.setFillStyle(newColor);
          body.setStrokeStyle(2, palette.rimColor || newColor);
        }
      });
    }

    // Windows
    const windowCols = Math.floor(width / 30);
    const windowRows = Math.floor(height / 40);

    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const wx = x - width / 2 + 15 + c * 30;
        const wy = y - height / 2 + 20 + r * 40;
        // Randomly lit windows
        const isLit = Math.random() > 0.7;
        const color = isLit ? (palette.windowLit || PALETTE.windowLit) : PALETTE.windowDark;
        const win = this.add.rectangle(wx, wy, 16, 24, color);
        win.setDepth(-9);
      }
    }

    // Neon Sign
    const signColor = palette.signColor || '#ffffff';
    const signStrokeColor = palette.signStrokeColor || signColor;
    const signText = this.add.text(x, y - height / 2 - 30, name, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: signColor,
      stroke: signStrokeColor,
      strokeThickness: 4,
      shadow: { blur: 10, color: signStrokeColor, fill: true }
    });
    signText.setOrigin(0.5);
    signText.setDepth(-8);

    // Entry Highlight
    const entry = this.add.rectangle(x, y + height / 2 - 30, 40, 60, 0x000000, 0.5);
    entry.setStrokeStyle(2, palette.entryColor || 0x00ffff);
    entry.setDepth(-9);

    if (buildingType !== 'none') {
      this.buildings.push(building);
    }
  }

  setupNetworkEvents() {
    const networkClient = window.networkClient;

    // Store handlers so we can remove them later
    this.networkHandlers = {
      gameState: (data) => {
        console.log(`[MainScene] gameState: player scene ${data.player.scene}, local scene ${this.sceneName}`);
        if (data.player.scene === this.sceneName) {
          this.createLocalPlayer(data.player);
          this.addRemotePlayers(data.allPlayers.filter(p => p.id !== data.player.id && p.scene === this.sceneName));
        }
      },
      playerJoined: (player) => {
        console.log(`[MainScene] playerJoined: ${player.id} in scene ${player.scene} (local: ${this.sceneName})`);
        if (player.scene === this.sceneName && player.id !== networkClient.getPlayerId()) {
          this.addRemotePlayer(player);
        }
      },
      playerJoinedScene: (player) => {
        console.log(`[MainScene] playerJoinedScene: ${player.id} joined scene ${player.scene} (local: ${this.sceneName})`);
        if (player.scene === this.sceneName && player.id !== networkClient.getPlayerId()) {
          this.addRemotePlayer(player);
        }
      },
      playerLeftScene: (data) => {
        console.log(`[MainScene] playerLeftScene: ${data.id} left scene`);
        this.removeRemotePlayer(data.id);
      },
      playerLeft: (data) => {
        this.removeRemotePlayer(data.id);
      },
      playerUpdate: (player) => {
        if (player.scene === this.sceneName && player.id !== networkClient.getPlayerId()) {
          this.updateRemotePlayer(player);
        }
      },
      sceneSync: (data) => {
        if (data.players) {
          console.log(`[MainScene] sceneSync: ${data.players.length} players`);
          const networkClient = window.networkClient;
          const localPlayerId = networkClient.getPlayerId();

          // Just sync players. syncPlayers will filter by scene.
          this.syncPlayers(data.players);
        }
      },
      sceneState: (data) => {
        if (data.players) {
          this.addRemotePlayers(data.players.filter(p => p.id !== networkClient.getPlayerId()));
        }
      },
      fistBumpAnimation: (data) => {
        this.handleFistBumpAnimation(data);
      },
      buildingEntered: (data) => {
        console.log('Received buildingEntered', data);
        // Trust the server. If we receive this, it means we successfully entered.
        // The server has already updated our scene to the building type (e.g. 'bar'),
        // so data.scene will be 'bar', while this.sceneName might still be 'city'.
        // We should proceed to enter the building.

        if (this.localPlayer) {
          this.enterBuilding(data);
        }
      },
      buildingExited: (data) => {
        if (this.localPlayer) {
          this.localPlayer.setPosition(data.x, data.y);
        }
      }
    };

    // Register all handlers
    Object.entries(this.networkHandlers).forEach(([event, handler]) => {
      networkClient.on(event, handler);
    });
  }

  cleanupNetworkEvents() {
    if (!this.networkHandlers) return;

    const networkClient = window.networkClient;
    Object.entries(this.networkHandlers).forEach(([event, handler]) => {
      networkClient.off(event, handler);
    });
    this.networkHandlers = null;
  }

  createLocalPlayer(playerData) {
    if (this.localPlayer) {
      this.localPlayer.destroy();
    }

    this.localPlayer = new Player(this, playerData.x, playerData.y, {
      ...playerData,
      isLocal: true
    });

    // Camera follows local player (use nextTick to ensure player is fully created)
    this.time.delayedCall(100, () => {
      if (this.localPlayer && this.localPlayer.active) {
        this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
      }
    });
  }

  addRemotePlayer(playerData) {
    const existing = this.remotePlayers.find(p => p.playerData.id === playerData.id);
    if (existing) {
      existing.updateFromNetwork(playerData);
      return;
    }

    const remotePlayer = new RemotePlayer(this, playerData.x, playerData.y, playerData);
    this.remotePlayers.push(remotePlayer);
  }

  addRemotePlayers(players) {
    players.forEach(player => {
      if (player.scene === this.sceneName) {
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

    players.forEach(player => {
      if (player.id === localPlayerId) {
        // Update local player position from server if needed
        if (this.localPlayer && player.scene === this.sceneName) {
          // Server is source of truth for remote players
        }
      } else if (player.scene === this.sceneName) {
        this.updateRemotePlayer(player);
      }
    });

    // Remove players that are no longer in the scene
    const playerIds = players.map(p => p.id);
    this.remotePlayers.forEach(rp => {
      if (!playerIds.includes(rp.playerData.id)) {
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

  enterBuilding(data) {
    // Override in subclasses or handle building entry
    this.scene.start('BuildingInterior', {
      buildingType: data.buildingType,
      buildingId: data.buildingId,
      dateDifficulty: data.dateDifficulty || data.difficulty,
      returnScene: this.sceneName,
      returnX: this.localPlayer ? this.localPlayer.x : 100,
      returnY: this.localPlayer ? this.localPlayer.y : 900
    });
  }

  update(time, delta) {
    // Update car
    if (this.car && this.car.active) {
      this.car.update(time, delta);

      // Check again if car exists (it might have been destroyed in update)
      if (this.car && this.car.active) {
        // Sync player if in car
        if (this.car.hasPlayer && this.localPlayer) {
          this.localPlayer.setPosition(this.car.x, this.car.y);
          // Send position update so other players see us moving
          window.networkClient.sendPlayerMove({
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            facing: this.car.direction,
            animState: 'idle',
            styleTier: this.localPlayer.playerData?.styleTier
          });
        }
      }
    }

    if (this.localPlayer && this.localPlayer.body.enable) {
      this.localPlayer.update(time, delta);

      // Check for scene transitions
      this.checkSceneTransitions();
    }

    this.remotePlayers.forEach(player => {
      if (player && player.active) {
        player.update(time, delta);
      }
    });

    // Check building interactions
    this.checkBuildingInteractions();

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.handleInteraction();
    }
  }

  checkSceneTransitions() {
    if (!this.localPlayer) return;

    const x = this.localPlayer.x;
    let nextScene = null;
    let nextX = 100;

    // Scene order: City -> Bar -> Hotel -> Beach (Linear)
    const scenes = ['city', 'bar', 'hotel', 'beach'];
    const currentIndex = scenes.indexOf(this.sceneName);

    if (x > 1900) {
      // Go right
      if (currentIndex < scenes.length - 1) {
        const nextIndex = currentIndex + 1;
        nextScene = scenes[nextIndex];
        nextX = 50; // Spawn on left side
      } else {
        // End of world (Right side)
        this.localPlayer.x = 1900; // Block movement
      }
    } else if (x < 20) {
      // Go left
      if (currentIndex > 0) {
        const nextIndex = currentIndex - 1;
        nextScene = scenes[nextIndex];
        nextX = 1850; // Spawn on right side
      } else {
        // End of world (Left side)
        this.localPlayer.x = 20; // Block movement
      }
    }

    if (nextScene) {
      window.networkClient.changeScene(nextScene, nextX, 900);

      // Map scene name to key
      const sceneMap = {
        'beach': 'BeachScene',
        'city': 'CityScene',
        'bar': 'BarScene',
        'hotel': 'HotelScene'
      };

      this.scene.start(sceneMap[nextScene], {
        returnX: nextX,
        returnY: 900,
        player: { ...this.localPlayer.playerData, scene: nextScene, x: nextX, y: 900 }
      });
    }
  }

  tryEnterBuilding() {
    if (!this.localPlayer || !this.buildings) return;

    // Debounce entry
    if (this.isEnteringBuilding) return;

    this.buildings.forEach(building => {
      const margin = 50;
      const playerX = this.localPlayer.x;
      const left = building.x - building.width / 2 - margin;
      const right = building.x + building.width / 2 + margin;

      if (playerX > left && playerX < right) {
        console.log('E pressed (event), sending enterBuilding');
        this.isEnteringBuilding = true; // Lock
        window.networkClient.enterBuilding(building.buildingId, building.buildingType, building.difficulty);
        // Unlock after a timeout in case server fails?
        // Better to let scene change handle it, but if it fails, we're stuck.
        // Let's add a safety unlock.
        this.time.delayedCall(2000, () => this.isEnteringBuilding = false);
      }
    });
  }

  checkBuildingInteractions() {
    if (!this.localPlayer || !this.buildings) return;

    let canInteract = false;

    this.buildings.forEach(building => {
      // Simple bounding box check + margin
      const margin = 50;
      const playerX = this.localPlayer.x;

      // Buildings are centered, so calculate bounds
      const left = building.x - building.width / 2 - margin;
      const right = building.x + building.width / 2 + margin;

      // Ignore Y distance since player is on fixed ground plane (900) and buildings are at ~800
      if (playerX > left && playerX < right) {
        canInteract = true;

        // Show prompt
        const difficultyLabel = (building.difficulty || 'easy').toUpperCase();
        const buildingLabel = building.name || (building.buildingType === 'bar' ? 'Bar' : 'Hotel');
        this.interactionText.setPosition(building.x, building.y - building.height / 2 - 60);
        this.interactionText.setVisible(true);
        this.interactionText.setText(`Enter ${buildingLabel} [${difficultyLabel}] (E)`);
      }
    });

    if (!canInteract) {
      this.interactionText.setVisible(false);
    }
  }
}
