import { MainScene } from './MainScene.js';

export class HotelScene extends MainScene {
  constructor() {
    super('HotelScene', 'hotel', '#2c1e4a');
  }

  create() {
    super.create();
    window.musicManager.playSceneMusic('hotel');
  }

  createBuildings() {
    super.createBuildings();

    // Grand Hotel
    this.addDetailedBuilding(960, 700, 400, 350, 'grand_hotel', 'hotel', 'GRAND PLAZA');

    // Hotel Bar
    this.addDetailedBuilding(400, 800, 160, 160, 'hotel_lounge', 'lounge', 'SKY LOUNGE');
  }
}
