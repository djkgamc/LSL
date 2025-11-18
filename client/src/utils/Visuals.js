export const PALETTE = {
  // Sky gradients
  skyTop: 0x2c1e4a,      // Deep Purple
  skyBottom: 0xbd4f6c,   // Sunset Pink
  
  // Sun
  sunTop: 0xffe600,      // Bright Yellow
  sunBottom: 0xff0055,   // Hot Pink
  
  // Grid/Ground
  gridLine: 0x00f3ff,    // Cyan Neon
  gridFill: 0x241734,    // Dark Purple ground
  
  // Buildings
  buildingBody: 0x0f0b21, // Dark Blue/Black
  buildingRim: 0xff00ff,  // Magenta Neon
  windowLit: 0xfff700,    // Yellow light
  windowDark: 0x1a1a3a,   // Dark window
  
  // Player (Leisure Suit style)
  suitWhite: 0xffffff,
  suitShade: 0xcccccc,
  shirtBlue: 0x00aaff,
  skinTone: 0xffccaa,
  hair: 0x331100
};

export const createGradientTexture = (scene, key, width, height, topColor, bottomColor) => {
  if (scene.textures.exists(key)) return;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const grd = ctx.createLinearGradient(0, 0, 0, height);
  grd.addColorStop(0, `#${topColor.toString(16).padStart(6, '0')}`);
  grd.addColorStop(1, `#${bottomColor.toString(16).padStart(6, '0')}`);

  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, width, height);

  scene.textures.addCanvas(key, canvas);
};

