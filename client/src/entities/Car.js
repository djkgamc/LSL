import { PALETTE } from '../utils/Visuals.js';

export class Car extends Phaser.GameObjects.Container {
  constructor(scene, x, y, direction = 'right') {
    super(scene, x, y);
    
    this.direction = direction;
    this.speed = 400;
    this.scene = scene;
    
    // Visuals
    this.createVisuals();
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.body.setSize(160, 60);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    
    // Interaction prompt
    this.interactionText = scene.add.text(0, -80, 'Ride (E)', {
      fontSize: '14px',
      fontFamily: 'Courier New',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 4 }
    });
    this.interactionText.setOrigin(0.5);
    this.interactionText.setVisible(false);
    this.add(this.interactionText);

    this.hasPlayer = false;
    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  createVisuals() {
    // Sports Car Design (Sleek & Low)
    const dir = this.direction === 'right' ? 1 : -1;
    const bodyColor = 0xff0033; // Sporty Red
    const windowColor = 0x87ceeb;
    const tireColor = 0x1a1a1a;
    const rimColor = 0xcccccc;

    // Chassis (Custom Shape)
    const chassis = this.scene.add.graphics();
    chassis.fillStyle(bodyColor);
    chassis.lineStyle(2, 0xffffff); // White outline for style

    chassis.beginPath();
    // Start at rear bottom
    chassis.moveTo(-75 * dir, 15);
    // Rear bumper
    chassis.lineTo(-80 * dir, 0);
    // Spoiler base
    chassis.lineTo(-80 * dir, -15);
    // Rear window slope
    chassis.lineTo(-40 * dir, -25);
    // Roof
    chassis.lineTo(10 * dir, -25);
    // Windshield slope
    chassis.lineTo(40 * dir, -15);
    // Hood
    chassis.lineTo(75 * dir, -5);
    // Front nose
    chassis.lineTo(85 * dir, 10);
    // Front underbumper
    chassis.lineTo(75 * dir, 15);
    // Close shape
    chassis.lineTo(-75 * dir, 15);
    chassis.closePath();
    chassis.fillPath();
    chassis.strokePath();
    this.add(chassis);

    // Spoiler Wing
    const spoiler = this.scene.add.rectangle(-78 * dir, -20, 20, 4, bodyColor);
    spoiler.setStrokeStyle(1, 0xffffff);
    this.add(spoiler);

    // Cabin/Windows
    const cabin = this.scene.add.graphics();
    cabin.fillStyle(windowColor);
    cabin.beginPath();
    cabin.moveTo(-35 * dir, -22);
    cabin.lineTo(5 * dir, -22);
    cabin.lineTo(35 * dir, -15);
    cabin.lineTo(-40 * dir, -15);
    cabin.closePath();
    cabin.fillPath();
    this.add(cabin);

    // Racing Stripe (Optional, maybe just simple)
    
    // Wheels (Mag wheels)
    const createWheel = (x) => {
        const tire = this.scene.add.circle(x * dir, 15, 16, tireColor);
        const rim = this.scene.add.circle(x * dir, 15, 9, rimColor);
        const nut = this.scene.add.circle(x * dir, 15, 2, 0x333333);
        this.add(tire);
        this.add(rim);
        this.add(nut);
    };

    createWheel(-55);
    createWheel(55);
    
    // Headlights (Pop-up style or sleek wedge)
    const headlight = this.scene.add.triangle(
        82 * dir, 5,  // Tip
        75 * dir, 0,
        75 * dir, 10,
        0xffffcc // Pale yellow
    );
    this.add(headlight);

    // Taillights
    const taillight = this.scene.add.rectangle(-80 * dir, 5, 4, 8, 0xff0000);
    taillight.setStrokeStyle(1, 0xcc0000);
    this.add(taillight);
  }

  update(time, delta) {
    if (!this.scene) return;

    // Move
    if (this.direction === 'right') {
        this.x += (this.speed * delta) / 1000;
    } else {
        this.x -= (this.speed * delta) / 1000;
    }

    // Check if out of bounds
    if (this.x > 2200 || this.x < -200) {
        if (this.hasPlayer) {
            this.scene.handleCarExit(this);
        } else {
            this.destroy();
        }
        return; // Stop update after destroy/exit
    }

    // Check for player interaction
    if (!this.hasPlayer && this.scene && this.scene.localPlayer && this.scene.localPlayer.active) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.scene.localPlayer.x, this.scene.localPlayer.y);
        if (dist < 150) {
            this.interactionText.setVisible(true);
            
            // Check keyboard
            if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
                this.scene.enterCar(this);
            }
            // Check virtual input (mobile)
            // We need to access the scene's virtualInput state, but we don't have a direct "E" state persistence 
            // other than the event handler in MainScene which calls enterBuilding directly.
            // We need MainScene to handle the car entry via the generic action or "E" button.
            // MainScene's setupMobileControls handles "E" by calling tryEnterBuilding().
            // We should update MainScene to also check for nearby cars when "E" is pressed.
        } else {
            this.interactionText.setVisible(false);
        }
    } else {
        this.interactionText.setVisible(false);
    }
  }
}

