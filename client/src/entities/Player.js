import { PALETTE } from '../utils/Visuals.js';

export class Player extends Phaser.GameObjects.Container {
  constructor(scene, x, y, playerData) {
    super(scene, x, y);
    
    this.playerData = playerData;
    this.speed = 200;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Create composite sprite
    this.createCharacterVisuals(scene);
    
    // Create name label
    this.nameLabel = scene.add.text(0, -50, playerData.name || 'Player', {
      fontSize: '12px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.nameLabel.setOrigin(0.5, 0.5);
    this.add(this.nameLabel);
    
    // Chat bubble
    this.chatBubble = scene.add.text(0, -80, '', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 6, y: 4 },
      wordWrap: { width: 200 }
    });
    this.chatBubble.setOrigin(0.5);
    this.chatBubble.setVisible(false);
    this.add(this.chatBubble);
    this.chatTimer = null;
    
    // Animation state
    this.facing = 'right';
    this.animState = 'idle';
    this.isLocal = playerData.isLocal || false;
    this.animTimer = 0;
    
    // Fist bump state
    this.fistBumpTimer = 0;
    this.fistBumpDuration = 500;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(32, 56);
    // Disable world bounds so player can walk off-screen for scene transitions
    this.body.setCollideWorldBounds(false);
    
    // Set initial position
    this.setPosition(x, y);
  }

  createCharacterVisuals(scene) {
    // Legs (White Pants)
    this.legs = scene.add.rectangle(0, 16, 16, 24, PALETTE.suitWhite);
    this.add(this.legs);
    
    // Body (White Suit Jacket)
    this.bodySprite = scene.add.rectangle(0, -4, 24, 28, PALETTE.suitWhite);
    this.add(this.bodySprite);
    
    // Shirt (Blue)
    this.shirt = scene.add.rectangle(0, -4, 8, 24, PALETTE.shirtBlue);
    this.add(this.shirt);
    
    // Head
    this.head = scene.add.rectangle(0, -24, 20, 20, PALETTE.skinTone);
    this.add(this.head);
    
    // Hair (Balding/Comb-over suggestion)
    this.hair = scene.add.rectangle(0, -32, 20, 6, PALETTE.hair);
    this.add(this.hair);
    
    // Store parts for animation
    this.parts = [this.legs, this.bodySprite, this.shirt, this.head, this.hair];
  }

  update(time, delta) {
    if (!this.isLocal) return; // Remote players are updated via network
    
    let moved = false;
    let newFacing = this.facing;
    let newAnimState = 'idle';
    
    // Handle movement
    if (this.cursors.left.isDown) {
      this.body.setVelocityX(-this.speed);
      newFacing = 'left';
      newAnimState = 'walk';
      moved = true;
    } else if (this.cursors.right.isDown) {
      this.body.setVelocityX(this.speed);
      newFacing = 'right';
      newAnimState = 'walk';
      moved = true;
    } else {
      this.body.setVelocityX(0);
      newAnimState = 'idle';
    }
    
    // Update facing and animation state
    if (newFacing !== this.facing || newAnimState !== this.animState) {
      this.facing = newFacing;
      this.animState = newAnimState;
    }
    
    this.updateVisuals(time);
    
    // Update player data
    this.playerData.x = this.x;
    this.playerData.y = this.y;
    this.playerData.facing = this.facing;
    this.playerData.animState = this.animState;
    
    // Send movement update to server
    if (moved || this.animState !== 'idle') {
      window.networkClient.sendPlayerMove({
        x: this.x,
        y: this.y,
        facing: this.facing,
        animState: this.animState
      });
    }
    
    // Handle fist bump
    // Scene handles input if needed (e.g. cats), otherwise player handles it
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      // Check if scene wants to consume the input first
      if (this.scene.handlePlayerInput) {
          if (this.scene.handlePlayerInput('space')) {
              return;
          }
      }
      this.attemptFistBump();
    }
    
    // Update fist bump animation
    if (this.fistBumpTimer > 0) {
      this.fistBumpTimer -= delta;
    }
  }

  updateVisuals(time) {
    // Scale X for facing direction (affects all children in container)
    // Note: Container scale affects physics body offset, so we scale children instead?
    // No, container scale is tricky. Let's scale visuals manually or iterate.
    // Actually, for simple flipping, we can just flip the 'x' offset of children relative to center if needed,
    // but here everything is centered.
    
    // Simple bobbing animation for walk
    if (this.animState === 'walk') {
      const bob = Math.sin(time / 100) * 2;
      this.head.y = -24 + bob;
      this.hair.y = -32 + bob;
      this.bodySprite.y = -4 + bob * 0.5;
      this.shirt.y = -4 + bob * 0.5;
    } else {
      this.head.y = -24;
      this.hair.y = -32;
      this.bodySprite.y = -4;
      this.shirt.y = -4;
    }
    
    // Color effect for fist bump
    if (this.fistBumpTimer > 0) {
      const color = (Math.floor(time / 100) % 2 === 0) ? 0xffffff : 0xff00ff;
      this.bodySprite.setFillStyle(color);
    } else {
      this.bodySprite.setFillStyle(PALETTE.suitWhite);
    }
  }

  attemptFistBump() {
    // Find nearby players
    const scene = this.scene;
    if (!scene.remotePlayers) return; // Safety check

    const nearbyPlayers = scene.remotePlayers.filter(p => {
      if (!p.active) return false;
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 100;
    });
    
    if (nearbyPlayers.length > 0) {
      // Fist bump the first nearby player
      const target = nearbyPlayers[0];
      window.networkClient.fistBump(target.playerData.id);
      this.triggerFistBump();
    }
  }

  triggerFistBump() {
    this.fistBumpTimer = this.fistBumpDuration;
    this.updateVisuals();
  }

  showChatBubble(message) {
    this.chatBubble.setText(message);
    this.chatBubble.setVisible(true);
    
    if (this.chatTimer) clearTimeout(this.chatTimer);
    this.chatTimer = setTimeout(() => {
      this.chatBubble.setVisible(false);
    }, 5000);
  }

  updateFromNetwork(playerData) {
    this.playerData = { ...this.playerData, ...playerData };
    this.setPosition(playerData.x, playerData.y);
    this.facing = playerData.facing || 'right';
    this.animState = playerData.animState || 'idle';
    this.updateVisuals();
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.nameLabel) this.nameLabel.destroy();
    super.destroy();
  }
}

