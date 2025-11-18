import { Player } from './Player.js';

export class RemotePlayer extends Player {
  constructor(scene, x, y, playerData) {
    super(scene, x, y, { ...playerData, isLocal: false });
    this.isLocal = false;
  }

  update(time, delta) {
    // Remote players don't handle input, just update visuals
    this.updateVisuals(time);
    
    if (this.fistBumpTimer > 0) {
      this.fistBumpTimer -= delta;
    }
  }

  triggerFistBump() {
    this.fistBumpTimer = this.fistBumpDuration;
    // updateVisuals is called in update loop
  }
}
