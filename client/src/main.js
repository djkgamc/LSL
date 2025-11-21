import { BeachScene } from './scenes/BeachScene.js';
import { CityScene } from './scenes/CityScene.js';
import { BarScene } from './scenes/BarScene.js';
import { HotelScene } from './scenes/HotelScene.js';
import { BuildingInterior } from './scenes/BuildingInterior.js';
import { NetworkClient } from './network/NetworkClient.js';
import { MusicManager } from './utils/MusicManager.js';
import { getStyleTierFromScore } from './utils/styleTier.js';

const config = {
  type: Phaser.AUTO,
  width: 1920,
  height: 1080,
  parent: 'phaser-game',
  backgroundColor: '#87ceeb',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BeachScene, CityScene, BarScene, HotelScene, BuildingInterior],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  pixelArt: true,
  antialias: false,
  autoFocus: true
};

// Game state
let game = null;
let playerName = 'Larry';
let socialPlatform = null;
let socialHandle = null;
let onlinePlayers = [];

const applyStyleTierToPlayerData = (player) => {
  if (!player) return player;
  const existingTier = typeof player.styleTier === 'number' ? player.styleTier : null;
  const computedTier = getStyleTierFromScore(player.score);
  return { ...player, styleTier: existingTier !== null ? existingTier : computedTier };
};

const applyStyleTierToPlayerList = (players = []) => players.map(applyStyleTierToPlayerData);

// Initialize music manager (audio context needs user interaction)
window.musicManager = new MusicManager();

// UI Elements
const loginScreen = document.getElementById('login-screen');
const joinBtn = document.getElementById('join-btn');
const nameInput = document.getElementById('player-name-input');
const chatContainer = document.getElementById('chat-container');
const onlinePlayersEl = document.getElementById('online-players');
const statusEl = document.getElementById('connection-status');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatToggle = document.getElementById('chat-toggle');
const leaderboardToggle = document.getElementById('leaderboard-toggle');
const scoreEl = document.getElementById('score-display');
const leaderboardEl = document.getElementById('leaderboard');
const leaderboardContent = document.getElementById('leaderboard-content');
const rotationIcon = document.getElementById('rotation-icon');

// Handle Login
joinBtn.addEventListener('click', startGame);
nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

// Toggle Leaderboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (leaderboardEl) {
      leaderboardEl.style.display = leaderboardEl.style.display === 'flex' ? 'none' : 'flex';
    }
  }
});

// Handle Chat
if (chatToggle) {
  chatToggle.addEventListener('click', () => {
    chatContainer.classList.toggle('visible');
  });
}

// Handle Mobile Leaderboard Toggle
if (leaderboardToggle) {
  leaderboardToggle.addEventListener('click', () => {
    if (leaderboardEl) {
      leaderboardEl.style.display = leaderboardEl.style.display === 'flex' ? 'none' : 'flex';
    }
  });
}

// Handle Rotation Icon Click
if (rotationIcon) {
  rotationIcon.addEventListener('click', () => {
    alert("we can't rotate ur phone for you, you have to turn turn your hand physically");
  });
}

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

if (chatSendBtn) {
  chatSendBtn.addEventListener('click', sendMessage);
}

function sendMessage() {
  if (window.networkClient) {
    const message = chatInput.value.trim();
    if (message) {
      window.networkClient.sendChat(message);
      chatInput.value = '';
      chatInput.blur(); // Force blur to return focus to game
    }
  }
}

// Handle chat keyboard enable/disable with window focus fallback
chatInput.addEventListener('focus', () => {
  if (window.game) {
    window.game.input.keyboard.enabled = false;
    window.game.input.mouse.enabled = false;
  }
});

chatInput.addEventListener('blur', () => {
  if (window.game) {
    window.game.input.keyboard.enabled = true;
    window.game.input.mouse.enabled = true;
    // Force focus back to canvas
    window.game.canvas.focus();
  }
});

// Ensure game regains focus if clicked
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'CANVAS' && window.game) {
    window.game.input.keyboard.enabled = true;
    window.game.input.mouse.enabled = true;
  }
});

function addChatMessage(name, message, isSelf = false) {
  const msgDiv = document.createElement('div');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'chat-name';
  nameSpan.textContent = name + ': ';
  if (isSelf) nameSpan.style.color = '#ff00ff';

  msgDiv.appendChild(nameSpan);
  msgDiv.appendChild(document.createTextNode(message));
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateOnlinePlayersUI() {
  if (!onlinePlayersEl) return;

  const count = onlinePlayers.length;
  const maxDisplay = 3;

  // Sort to put self first, then alphabetical
  const sortedPlayers = [...onlinePlayers].sort((a, b) => {
    if (window.networkClient && a.id === window.networkClient.getPlayerId()) return -1;
    if (window.networkClient && b.id === window.networkClient.getPlayerId()) return 1;
    return a.name.localeCompare(b.name);
  });

  let text = `Online (${count}): `;
  const names = sortedPlayers.slice(0, maxDisplay).map(p => p.name);
  text += names.join(', ');

  if (count > maxDisplay) {
    text += `, and ${count - maxDisplay} others`;
  }

  onlinePlayersEl.textContent = text;
}

function renderLeaderboard(data) {
  if (!leaderboardContent) return;
  leaderboardContent.innerHTML = '';
  data.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'leaderboard-entry';
    if (window.networkClient && entry.id === window.networkClient.getPlayerId()) {
      div.classList.add('is-me');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = entry.name;

    // Add social icon if available
    if (entry.socialPlatform && entry.socialHandle) {
      const socialLink = document.createElement('a');
      socialLink.target = '_blank';
      socialLink.rel = 'noopener noreferrer';

      let iconCode = '';
      let urlPrefix = '';

      switch (entry.socialPlatform) {
        case 'twitter':
          iconCode = '\uf099'; // fa-twitter
          urlPrefix = 'https://twitter.com/';
          break;
        case 'instagram':
          iconCode = '\uf16d'; // fa-instagram
          urlPrefix = 'https://instagram.com/';
          break;
        case 'facebook':
          iconCode = '\uf09a'; // fa-facebook
          urlPrefix = 'https://facebook.com/';
          break;
        case 'tiktok':
          iconCode = '\ue07b'; // fa-tiktok
          urlPrefix = 'https://tiktok.com/@';
          break;
        case 'threads':
          iconCode = '\ue618'; // fa-threads (approximate, using generic if needed or specific font awesome)
          // FontAwesome 6.4.2 has threads icon. If not rendering, fallback to link.
          // Let's assume 6.4.0+ has it.
          urlPrefix = 'https://www.threads.net/@';
          break;
      }

      socialLink.href = urlPrefix + entry.socialHandle.replace('@', '');

      const iconMap = {
        twitter: 'fa-brands fa-x-twitter',
        instagram: 'fa-brands fa-instagram',
        facebook: 'fa-brands fa-facebook',
        tiktok: 'fa-brands fa-tiktok',
        threads: 'fa-brands fa-threads'
      };

      const icon = document.createElement('i');
      icon.className = iconMap[entry.socialPlatform] || `fa-brands fa-${entry.socialPlatform}`;

      socialLink.appendChild(icon);
      socialLink.title = `${entry.socialPlatform}: ${entry.socialHandle}`; // Tooltip
      nameSpan.appendChild(socialLink);
    }

    const scoreSpan = document.createElement('span');
    scoreSpan.textContent = entry.score;

    div.appendChild(nameSpan);
    div.appendChild(scoreSpan);
    leaderboardContent.appendChild(div);
  });
}

// Global Mobile Input State
window.mobileInput = { left: false, right: false };

function setupGlobalMobileControls() {
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnAction = document.getElementById('btn-action');
  const btnEnter = document.getElementById('btn-enter');

  if (!btnLeft) return;

  const addBtnHandler = (element, onDown, onUp) => {
    const preventDefault = (e) => {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    };

    const downHandler = (e) => {
      preventDefault(e);
      onDown();
    };

    const upHandler = (e) => {
      preventDefault(e);
      onUp();
    };

    // Touch events
    element.addEventListener('touchstart', downHandler, { passive: false });
    element.addEventListener('touchend', upHandler);
    element.addEventListener('touchcancel', upHandler);

    // Mouse events
    element.addEventListener('mousedown', downHandler);
    element.addEventListener('mouseup', upHandler);
    element.addEventListener('mouseleave', upHandler);
  };

  // Movement
  addBtnHandler(btnLeft,
    () => window.mobileInput.left = true,
    () => window.mobileInput.left = false
  );

  addBtnHandler(btnRight,
    () => window.mobileInput.right = true,
    () => window.mobileInput.right = false
  );

  // Actions (One-shot)
  const triggerSceneAction = (actionType) => {
    if (!window.game) return;
    const activeScenes = window.game.scene.getScenes(true);
    activeScenes.forEach(scene => {
      if (scene.onMobileAction) {
        scene.onMobileAction(actionType);
      }
    });
  };

  const addActionHandler = (element, actionType) => {
    const handler = (e) => {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      // Debounce/Throttle? The game logic usually handles debounce.
      // We just trigger the action.
      triggerSceneAction(actionType);
    };

    element.addEventListener('touchstart', handler, { passive: false });
    element.addEventListener('mousedown', handler);
  };

  addActionHandler(btnEnter, 'enter');
  addActionHandler(btnAction, 'action');
}

function startGame() {
  const name = nameInput.value.trim();
  const handle = document.getElementById('social-handle').value.trim();
  const platform = document.getElementById('social-platform').value;

  if (name) {
    playerName = name;
    if (handle) {
      socialHandle = handle;
      socialPlatform = platform;
    }
    loginScreen.style.display = 'none';
    chatContainer.style.display = 'flex';

    // Initialize Audio
    window.musicManager.initAudio();

    // Initialize Network
    initializeNetwork();

    // Start Game
    game = new Phaser.Game(config);
    window.game = game;

    // Setup Mobile Controls (Global)
    setupGlobalMobileControls();
  }
}

function initializeNetwork() {
  // Initialize network client with name
  const serverUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://lsl-production-0181.up.railway.app';
  window.networkClient = new NetworkClient(serverUrl, playerName, socialPlatform, socialHandle);

  // Update connection status UI
  window.networkClient.on('connected', () => {
    if (statusEl) {
      statusEl.textContent = 'Connected';
      statusEl.style.color = '#0f0';
    }
  });
  window.networkClient.on('disconnected', () => {
    if (statusEl) {
      statusEl.textContent = 'Disconnected';
      statusEl.style.color = '#f00';
    }
  });
  window.networkClient.on('connect_error', () => {
    if (statusEl) {
      statusEl.textContent = 'Connection Error';
      statusEl.style.color = '#f00';
    }
  });

  window.networkClient.on('playerJoined', (player) => {
    const styledPlayer = applyStyleTierToPlayerData(player);
    if (!onlinePlayers.find(p => p.id === styledPlayer.id)) {
      onlinePlayers.push(styledPlayer);
      updateOnlinePlayersUI();
    }
  });

  window.networkClient.on('playerLeft', (data) => {
    onlinePlayers = onlinePlayers.filter(p => p.id !== data.id);
    updateOnlinePlayersUI();
  });

  window.networkClient.on('playerUpdate', (player) => {
    const styledPlayer = applyStyleTierToPlayerData(player);
    // Update local player data if needed (e.g. name change, though not currently supported)
    const idx = onlinePlayers.findIndex(p => p.id === styledPlayer.id);
    if (idx !== -1) {
      onlinePlayers[idx] = { ...onlinePlayers[idx], ...styledPlayer };
      // Only update UI if name changed (optimization)
      // updateOnlinePlayersUI();
    }
  });

  // Handle score update
  window.networkClient.on('scoreUpdate', (data) => {
    if (scoreEl) scoreEl.textContent = `Score: ${data.score}`;

    const newStyleTier = getStyleTierFromScore(data.score);
    const playerId = window.networkClient?.getPlayerId();
    onlinePlayers = onlinePlayers.map(p => p.id === playerId ? { ...p, score: data.score, styleTier: newStyleTier } : p);
    const activeScenes = game?.scene.getScenes(true) || [];
    let localPlayerSnapshot = null;
    activeScenes.forEach(scene => {
      if (scene.localPlayer) {
        scene.localPlayer.playerData.score = data.score;
        scene.localPlayer.updateStyleTier(newStyleTier);
        localPlayerSnapshot = scene.localPlayer;
      }
    });

    if (localPlayerSnapshot && window.networkClient) {
      window.networkClient.sendPlayerMove({
        x: localPlayerSnapshot.x,
        y: localPlayerSnapshot.y,
        facing: localPlayerSnapshot.facing,
        animState: localPlayerSnapshot.animState,
        styleTier: localPlayerSnapshot.playerData.styleTier
      });
    }
  });

  // Handle leaderboard update
  window.networkClient.on('leaderboardUpdate', (data) => {
    renderLeaderboard(data);
  });

  // Handle chat messages
  window.networkClient.on('chatMessage', (data) => {
    addChatMessage(data.name, data.message, data.id === window.networkClient.getPlayerId());

    // Play sound
    if (window.musicManager) {
      window.musicManager.playChatSound();
    }

    // Also show bubble on player
    const activeScenes = game.scene.getScenes(true);
    activeScenes.forEach(scene => {
      if (scene.localPlayer && data.id === window.networkClient.getPlayerId()) {
        scene.localPlayer.showChatBubble(data.message);
      } else if (scene.remotePlayers) {
        const remotePlayer = scene.remotePlayers.find(p => p.playerData.id === data.id);
        if (remotePlayer) {
          remotePlayer.showChatBubble(data.message);
        }
      }
    });
  });

  // Handle chat history
  window.networkClient.on('chatHistory', (history) => {
    history.forEach(msg => {
      // For history, we don't know the ID easily to check isSelf without more data, 
      // but we can check name. Ideally server sends ID too.
      // For now, we'll just assume false for isSelf or check name match if unique enough.
      // Better: Server sends ID in history query.
      // Let's check if msg.name matches our name.
      const isSelf = msg.name === playerName;
      addChatMessage(msg.name, msg.message, isSelf);
    });
  });

  // Handle initial scene selection based on server spawn
  let initialSceneSet = false;
  window.networkClient.on('gameState', (data) => {
    if (data.allPlayers) {
      onlinePlayers = applyStyleTierToPlayerList(data.allPlayers);
      updateOnlinePlayersUI();
    }
    if (data.leaderboard) renderLeaderboard(data.leaderboard);
    if (data.player && data.player.score !== undefined && scoreEl) {
      scoreEl.textContent = `Score: ${data.player.score}`;
    }

    if (data.player && data.player.scene && !initialSceneSet) {
      const sceneMap = {
        'beach': 'BeachScene',
        'city': 'CityScene',
        'bar': 'BarScene',
        'hotel': 'HotelScene'
      };
      const sceneKey = sceneMap[data.player.scene] || 'BeachScene';
      const currentScene = game.scene.getScenes(true)[0];

      const styledPlayer = applyStyleTierToPlayerData(data.player);

      // Only switch if we're not already in the correct scene
      if (currentScene && currentScene.scene.key !== sceneKey) {
        game.scene.start(sceneKey, { player: styledPlayer, allPlayers: onlinePlayers });
      } else if (!currentScene) {
        game.scene.start(sceneKey, { player: styledPlayer, allPlayers: onlinePlayers });
      }
      initialSceneSet = true;
    }
  });
}
