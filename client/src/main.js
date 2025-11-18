import { BeachScene } from './scenes/BeachScene.js';
import { CityScene } from './scenes/CityScene.js';
import { BarScene } from './scenes/BarScene.js';
import { HotelScene } from './scenes/HotelScene.js';
import { BuildingInterior } from './scenes/BuildingInterior.js';
import { NetworkClient } from './network/NetworkClient.js';
import { MusicManager } from './utils/MusicManager.js';

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

// Initialize music manager (audio context needs user interaction)
window.musicManager = new MusicManager();

// UI Elements
const loginScreen = document.getElementById('login-screen');
const joinBtn = document.getElementById('join-btn');
const nameInput = document.getElementById('player-name-input');
const chatContainer = document.getElementById('chat-container');
const statusEl = document.getElementById('connection-status');

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatToggle = document.getElementById('chat-toggle');

// Handle Login
joinBtn.addEventListener('click', startGame);
nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

// Handle Chat
if (chatToggle) {
    chatToggle.addEventListener('click', () => {
        chatContainer.classList.toggle('visible');
    });
}

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && window.networkClient) {
    const message = chatInput.value.trim();
    if (message) {
      window.networkClient.sendChat(message);
      chatInput.value = '';
    }
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

function startGame() {
  const name = nameInput.value.trim();
  if (name) {
    playerName = name;
    loginScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // Initialize Audio
    window.musicManager.initAudio();
    
    // Initialize Network
    initializeNetwork();
    
    // Start Game
    game = new Phaser.Game(config);
    window.game = game;
  }
}

function initializeNetwork() {
  // Initialize network client with name
  window.networkClient = new NetworkClient('http://localhost:3000', playerName);

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

  // Handle chat messages
  window.networkClient.on('chatMessage', (data) => {
    addChatMessage(data.name, data.message, data.id === window.networkClient.getPlayerId());
    
    // Also show bubble on player
    const currentScene = game.scene.getScenes(true)[0];
    if (currentScene) {
        if (data.id === window.networkClient.getPlayerId() && currentScene.localPlayer) {
            currentScene.localPlayer.showChatBubble(data.message);
        } else {
            const remotePlayer = currentScene.remotePlayers.find(p => p.playerData.id === data.id);
            if (remotePlayer) {
                remotePlayer.showChatBubble(data.message);
            }
        }
    }
  });

  // Handle initial scene selection based on server spawn
  let initialSceneSet = false;
  window.networkClient.on('gameState', (data) => {
    if (data.player && data.player.scene && !initialSceneSet) {
      const sceneMap = {
        'beach': 'BeachScene',
        'city': 'CityScene',
        'bar': 'BarScene',
        'hotel': 'HotelScene'
      };
      const sceneKey = sceneMap[data.player.scene] || 'BeachScene';
      const currentScene = game.scene.getScenes(true)[0];
      
      // Only switch if we're not already in the correct scene
      if (currentScene && currentScene.scene.key !== sceneKey) {
        game.scene.start(sceneKey, { player: data.player, allPlayers: data.allPlayers });
      } else if (!currentScene) {
          game.scene.start(sceneKey, { player: data.player, allPlayers: data.allPlayers });
      }
      initialSceneSet = true;
    }
  });
}
