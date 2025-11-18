import { Player } from '../entities/Player.js';
import { RemotePlayer } from '../entities/RemotePlayer.js';
import { Car } from '../entities/Car.js';
import { PALETTE, createGradientTexture } from '../utils/Visuals.js';

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
    this.virtualInput = { left: false, right: false };
    this.setupMobileControls();
    
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
    
    // Interaction input
    this.input.keyboard.on('keydown-E', () => {
        this.handleInteraction();
    });

    // Setup network events
    this.setupNetworkEvents();
    
    // Cleanup on shutdown
    this.events.on('shutdown', this.cleanupNetworkEvents, this);
    
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

  setupMobileControls() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnAction = document.getElementById('btn-action');
    const btnEnter = document.getElementById('btn-enter');

    if (!btnLeft) return;

    const addTouchHandlers = (element, onStart, onEnd) => {
        element.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); });
        element.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(); });
        
        if (onEnd) {
            element.addEventListener('touchend', (e) => { e.preventDefault(); onEnd(); });
            element.addEventListener('mouseup', (e) => { e.preventDefault(); onEnd(); });
            element.addEventListener('mouseleave', (e) => { e.preventDefault(); onEnd(); });
        }
    };

    // Movement
    addTouchHandlers(btnLeft, 
        () => this.virtualInput.left = true, 
        () => this.virtualInput.left = false
    );
    
    addTouchHandlers(btnRight, 
        () => this.virtualInput.right = true, 
        () => this.virtualInput.right = false
    );

    // Actions
    addTouchHandlers(btnAction, () => {
        if (this.localPlayer) this.localPlayer.attemptFistBump();
    });

    addTouchHandlers(btnEnter, () => {
        this.handleInteraction();
    });
  }

  handleInteraction() {
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
  
  addDetailedBuilding(x, y, width, height, buildingId, buildingType, name) {
    const building = { x, y, width, height, buildingId, buildingType };
    
    // Main body (dark)
    const body = this.add.rectangle(x, y, width, height, PALETTE.buildingBody);
    body.setDepth(-10);
    body.setStrokeStyle(2, PALETTE.buildingRim); // Neon outline
    
    // Windows
    const windowCols = Math.floor(width / 30);
    const windowRows = Math.floor(height / 40);
    
    for (let r = 0; r < windowRows; r++) {
      for (let c = 0; c < windowCols; c++) {
        const wx = x - width/2 + 15 + c * 30;
        const wy = y - height/2 + 20 + r * 40;
        // Randomly lit windows
        const isLit = Math.random() > 0.7;
        const color = isLit ? PALETTE.windowLit : PALETTE.windowDark;
        const win = this.add.rectangle(wx, wy, 16, 24, color);
        win.setDepth(-9);
      }
    }
    
    // Neon Sign
    const signText = this.add.text(x, y - height/2 - 30, name, {
      fontSize: '20px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      stroke: '#ff00ff',
      strokeThickness: 4,
      shadow: { blur: 10, color: '#ff00ff', fill: true }
    });
    signText.setOrigin(0.5);
    signText.setDepth(-8);
    
    // Entry Highlight
    const entry = this.add.rectangle(x, y + height/2 - 30, 40, 60, 0x000000, 0.5);
    entry.setStrokeStyle(2, 0x00ffff); // Cyan entry
    entry.setDepth(-9);
    
    this.buildings.push(building);
  }

  setupNetworkEvents() {
    const networkClient = window.networkClient;
    
    // Store handlers so we can remove them later
    this.networkHandlers = {
        gameState: (data) => {
            if (data.player.scene === this.sceneName) {
                this.createLocalPlayer(data.player);
                this.addRemotePlayers(data.allPlayers.filter(p => p.id !== data.player.id && p.scene === this.sceneName));
            }
        },
        playerJoined: (player) => {
            if (player.scene === this.sceneName && player.id !== networkClient.getPlayerId()) {
                this.addRemotePlayer(player);
            }
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
                const localPlayerId = networkClient.getPlayerId();
                const localPlayerInScene = data.players.find(p => p.id === localPlayerId && p.scene === this.sceneName);
                if (localPlayerInScene || this.scene.isActive()) {
                    this.syncPlayers(data.players);
                }
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
            if (data.scene === this.sceneName || !this.localPlayer) {
                console.log('Entering building...');
                this.enterBuilding(data);
            } else {
                console.log('buildingEntered ignored: scene mismatch', data.scene, this.sceneName);
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
      returnScene: this.sceneName,
      returnX: this.localPlayer ? this.localPlayer.x : 100,
      returnY: this.localPlayer ? this.localPlayer.y : 900
    });
  }

  update(time, delta) {
    // Update car
    if (this.car && this.car.active) {
      this.car.update(time, delta);
      
      // Sync player if in car
      if (this.car.hasPlayer && this.localPlayer) {
        this.localPlayer.setPosition(this.car.x, this.car.y);
        // Send position update so other players see us moving
        window.networkClient.sendPlayerMove({
            x: this.localPlayer.x,
            y: this.localPlayer.y,
            facing: this.car.direction,
            animState: 'idle'
        });
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
    
    this.buildings.forEach(building => {
      const margin = 50;
      const playerX = this.localPlayer.x;
      const left = building.x - building.width/2 - margin;
      const right = building.x + building.width/2 + margin;
      
      if (playerX > left && playerX < right) {
        console.log('E pressed (event), sending enterBuilding');
        window.networkClient.enterBuilding(building.buildingId, building.buildingType);
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
      const left = building.x - building.width/2 - margin;
      const right = building.x + building.width/2 + margin;
      
      // Ignore Y distance since player is on fixed ground plane (900) and buildings are at ~800
      if (playerX > left && playerX < right) {
        canInteract = true;
        
        // Show prompt
        this.interactionText.setPosition(building.x, building.y - building.height/2 - 60);
        this.interactionText.setVisible(true);
        this.interactionText.setText(`Enter ${building.buildingType === 'bar' ? 'Bar' : 'Hotel'} (E)`);
      }
    });
    
    if (!canInteract) {
      this.interactionText.setVisible(false);
    }
  }
}
