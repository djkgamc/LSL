import { MainScene } from './MainScene.js';

export class BarScene extends MainScene {
  constructor() {
    super('BarScene', 'bar', '#1a0b2e');
  }

  create() {
    super.create();
    window.musicManager.playSceneMusic('bar');
  }

  createBackground() {
    super.createBackground();
    // Darker, club vibe
  }

  createBuildings() {
    super.createBuildings();

    // The Club
    this.addDetailedBuilding(960, 750, 300, 200, 'main_bar', 'bar', 'THE CLUB', 'easy');

    // Side Hotel
    this.addDetailedBuilding(300, 780, 180, 220, 'bar_hotel', 'hotel', 'MOTEL', 'medium');
  }
}
