import { MainScene } from './MainScene.js';
import { PALETTE } from '../utils/Visuals.js';

export class BeachScene extends MainScene {
  constructor() {
    super('BeachScene', 'beach', '#87CEEB');
  }

  create() {
    super.create();
    
    // Play beach music
    window.musicManager.playSceneMusic('beach');

    // Create animated waves on the right
    this.createWaves();
  }

  createWaves() {
    // Add wave animations on the right side of the screen (the "end" of the beach)
    // Just some simple sine wave graphics or scaling sprites
    
    for (let i = 0; i < 5; i++) {
        const wave = this.add.circle(1850 + i * 20, 950 + i * 10, 30, 0xffffff, 0.5);
        wave.setDepth(-45);
        
        this.tweens.add({
            targets: wave,
            x: wave.x - 50,
            alpha: { from: 0.5, to: 0 },
            scale: { from: 1, to: 1.5 },
            duration: 2000 + i * 200,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }
    
    // Deep water block
    const deepWater = this.add.rectangle(1920, 980, 100, 200, 0x000088);
    deepWater.setOrigin(1, 0.5); // Right aligned
    deepWater.setDepth(-46);
  }


  createBackground() {
    // Custom beach background
    super.createBackground();
    
    // Add Palm Trees
    const graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1); // Silhouette
    
    for (let i = 0; i < 8; i++) {
      const x = 100 + i * 250 + Math.random() * 50;
      const height = 150 + Math.random() * 100;
      
      // Trunk
      graphics.fillRect(x, 1080 - 200 - height, 10, height);
      
      // Leaves (simple circles/ellipses for silhouette)
      graphics.fillCircle(x + 5, 1080 - 200 - height, 40);
    }
    graphics.setDepth(-95);
    graphics.setScrollFactor(0.5);
  }
  
  createGround() {
    // Pink Sand ground
    const ground = this.add.rectangle(960, 980, 1920, 200, 0xff69b4); // Hot pink sand
    this.physics.add.existing(ground, true);
    ground.body.setSize(1920, 200);
    ground.setDepth(-50);
    
    // Ocean in background
    const ocean = this.add.rectangle(960, 880, 1920, 100, PALETTE.gridLine);
    ocean.setDepth(-51);
  }

  createBuildings() {
    super.createBuildings();

    // Beach Bar (Tiki style)
    this.addDetailedBuilding(400, 800, 160, 150, 'beach_bar', 'bar', 'TIKI BAR');

    // Beach Hotel
    this.addDetailedBuilding(1500, 780, 200, 250, 'beach_hotel', 'hotel', 'SUNSET INN');

    // Boss hideout overlooking the surf
    this.addDetailedBuilding(950, 760, 220, 240, 'beach_boss', 'boss', 'BOSS PENTHOUSE');
  }
}
