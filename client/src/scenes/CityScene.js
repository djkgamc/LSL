import { MainScene } from './MainScene.js';

export class CityScene extends MainScene {
  constructor() {
    super('CityScene', 'city', '#2c1e4a');
  }

  create() {
    super.create();
    window.musicManager.playSceneMusic('city');
    
    // Create Highway on the left
    this.createHighway();
  }

  createHighway() {
    // Highway road surface
    const road = this.add.rectangle(0, 900, 100, 1080, 0x111111);
    road.setOrigin(0, 0.5); // Left aligned, centered vertically relative to ground? 
    // Actually ground is at y=980, height 200. So y=900 is slightly above ground?
    // Let's make it a vertical strip on the left edge.
    road.setPosition(0, 540);
    road.setSize(100, 1080);
    road.setDepth(-48); // On top of ground? Ground is -50.
    
    // Road markings
    const graphics = this.add.graphics();
    graphics.lineStyle(4, 0xffff00, 1); // Yellow line
    graphics.lineBetween(90, 0, 90, 1080); // Divider
    graphics.setDepth(-47);
    
    // Traffic animation
    this.time.addEvent({
      delay: 200,
      callback: () => {
        this.spawnHighwayCar();
      },
      loop: true
    });
    
    // Sign
    const sign = this.add.text(50, 800, 'HIGHWAY\nNO PEDESTRIANS', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ff0000',
      backgroundColor: '#000000',
      align: 'center'
    });
    sign.setOrigin(0.5);
    sign.setRotation(-Math.PI / 2);
    sign.setDepth(-45);
  }

  spawnHighwayCar() {
    const y = Math.random() * 1080;
    // Fast moving car particles
    const car = this.add.rectangle(20, y, 10, 30, 0xffffff);
    car.setDepth(-46);
    
    // Speed depends on "lane" (randomized slightly)
    const speed = 800 + Math.random() * 400;
    
    this.tweens.add({
      targets: car,
      y: y + (Math.random() > 0.5 ? 1200 : -1200), // Move up or down
      duration: 1000,
      onComplete: () => {
        car.destroy();
      }
    });
  }

  // Use default MainScene background/ground for the "Neon Grid" city look

  createBuildings() {
    super.createBuildings();

    // Cyber Bar
    this.addDetailedBuilding(500, 800, 180, 160, 'city_bar', 'bar', 'CYBER BAR');

    // Neon Hotel
    this.addDetailedBuilding(1400, 750, 220, 300, 'city_hotel', 'hotel', 'NEON SUITES');

    // Extra background buildings
    this.addDetailedBuilding(960, 700, 140, 400, 'skyscraper', 'none', 'CORP');
  }
}
