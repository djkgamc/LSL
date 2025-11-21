import { getRandomDateScript } from './dateDialogues.js';

const STYLE_TIER_REQUIREMENTS = {
  easy: 0,
  medium: 1,
  hard: 2,
  boss: 3
};

export class DateManager {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.overlay = document.getElementById('date-overlay') || this.createOverlay();
    this.promptEl = this.overlay.querySelector('#date-dialogue');
    this.optionsEl = this.overlay.querySelector('#date-options');
    this.partnerEl = this.overlay.querySelector('#date-partner');
    this.partnerVisualEl = this.overlay.querySelector('#date-partner-visual');
    this.resultEl = this.overlay.querySelector('#date-result');
    this.toastEl = this.overlay.querySelector('#date-toast');
    this.heartsEl = this.overlay.querySelector('#date-heart-fog');
    this.locked = false;

    this.handleKeyBlock = (event) => {
      if (!this.active) return;
      if (event.code === 'Space') {
        // Prevent accidental scene interactions while date UI is open
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', this.handleKeyBlock, true);

    this.scene.events.on('shutdown', () => {
      window.removeEventListener('keydown', this.handleKeyBlock, true);
      this.cleanupNetworkHook();
    });
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'date-overlay';
    overlay.innerHTML = `
      <div id="date-heart-fog"></div>
      <div id="date-panel">
        <div id="date-partner-visual" aria-hidden="true"></div>
        <div id="date-partner"></div>
        <div id="date-dialogue"></div>
        <div id="date-options"></div>
        <div id="date-toast" class="hidden"></div>
        <div id="date-result" class="hidden"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  isActive() {
    return this.active;
  }

  startDate(buildingType = 'bar', difficulty = 'easy') {
    if (this.active) return;

    const requiredTier = STYLE_TIER_REQUIREMENTS[difficulty] ?? STYLE_TIER_REQUIREMENTS.easy;
    const playerTier = this.scene?.localPlayer?.styleTier ?? 0;

    this.script = getRandomDateScript(buildingType, difficulty);
    this.currentNodeId = this.script?.startId;

    if (playerTier < requiredTier) {
      this.active = true;
      this.scene.inputLocked = true;
      this.overlay.classList.add('visible');
      this.resultEl.classList.add('hidden');
      this.heartsEl.classList.remove('success', 'fail', 'rejected');
      this.toastEl.classList.add('hidden');
      const rejectionLine = this.buildStyleRejection(requiredTier, playerTier);
      this.showResult('rejected', rejectionLine);
      return;
    }

    if (!this.script || !this.currentNodeId) return;

    this.active = true;
    this.scene.inputLocked = true;
    this.overlay.classList.add('visible');
    this.resultEl.classList.add('hidden');
    this.heartsEl.classList.remove('success', 'fail', 'rejected');
    this.toastEl.classList.add('hidden');
    this.renderNode();
    this.attachNetworkHook();
  }

  buildStyleRejection(requiredTier, playerTier) {
    const partner = this.script?.partnerName || 'Your date';

    if (requiredTier === 1) {
      return `${partner} taps their head. "No hat? Medium nights need a brim."`;
    }

    if (requiredTier === 2) {
      const line = playerTier === 0
        ? 'No hat at all? Hard nights ask for a tall crown.'
        : 'Cute cap, but that brim is tiny. Hard nights want a bigger silhouette.';
      return `${partner} squints at your outfit. "${line}"`;
    }

    if (requiredTier === 3) {
      const shadeLine = playerTier >= 2
        ? 'Those shades are training wheels; boss booths want statement lenses.'
        : 'Boss booths only vibe with legends in mirrored shades.';
      return `${partner} lowers their own lenses. "${shadeLine}"`;
    }

    return `${partner} shrugs. "Come back with a sharper look."`;
  }

  renderNode() {
    const node = this.script.nodes[this.currentNodeId];
    if (!node) return;

    const vibeClass = this.script.vibe ? `vibe-${this.script.vibe}` : '';
    this.partnerVisualEl.className = `glam-silhouette ${vibeClass}`;
    this.partnerEl.innerHTML = `
      <span class="partner-name">${this.script.partnerName}</span>
      <span class="partner-accent">🔥 sultry + stylish 🔥</span>
      <span class="partner-vibe">${this.script.vibe.toUpperCase()} DATE</span>
    `;
    this.promptEl.textContent = node.prompt;
    this.optionsEl.innerHTML = '';

    node.options.forEach(option => {
      const btn = document.createElement('button');
      btn.textContent = option.text;
      btn.className = 'date-option';
      btn.addEventListener('click', () => this.chooseOption(option));
      this.optionsEl.appendChild(btn);
    });
  }

  chooseOption(option) {
    if (option.next) {
      this.currentNodeId = option.next;
      this.renderNode();
      return;
    }

    if (option.result === 'success') {
      this.showResult('success', this.script.successMessage);
    } else {
      this.showResult('fail', this.script.failureMessage);
    }
  }

  showResult(outcome, message) {
    const isSuccess = outcome === 'success';
    const isRejected = outcome === 'rejected';
    const points = isSuccess ? 100 : isRejected ? 0 : 10;
    const partnerLabel = isSuccess
      ? `${this.script?.partnerName || 'Date partner'} is in!`
      : isRejected
        ? `${this.script?.partnerName || 'Date partner'} isn\'t feeling your look.`
        : `${this.script?.partnerName || 'Date partner'} isn\'t convinced.`;

    this.optionsEl.innerHTML = '';
    this.promptEl.textContent = '';
    this.partnerEl.textContent = partnerLabel;
    this.resultEl.textContent = `${message} (${points} pts)`;
    this.resultEl.classList.remove('hidden');
    this.heartsEl.classList.remove('success', 'fail', 'rejected');
    this.heartsEl.classList.add(isSuccess ? 'success' : isRejected ? 'rejected' : 'fail');

    if (window.networkClient && window.networkClient.sendDateResult) {
      window.networkClient.sendDateResult({ outcome, points });
    }

    setTimeout(() => this.endDate(), 1600);
  }

  endDate() {
    this.active = false;
    this.scene.inputLocked = false;
    this.overlay.classList.remove('visible');
    this.toastEl.classList.add('hidden');
    this.cleanupNetworkHook();
  }

  showWingmanToast(helperName) {
    this.toastEl.textContent = `${helperName} throws you a fist bump!`; 
    this.toastEl.classList.remove('hidden');
    this.toastEl.classList.add('visible');
    setTimeout(() => this.toastEl.classList.add('hidden'), 1200);
  }

  attachNetworkHook() {
    if (this.networkHandler) return;
    const networkClient = window.networkClient;
    if (!networkClient) return;

    this.networkHandler = (data) => {
      if (!this.active || !this.scene.localPlayer) return;
      const localId = this.scene.localPlayer.playerData.id;
      const involvesLocal = data.player1Id === localId || data.player2Id === localId;
      if (!involvesLocal) return;

      const helperId = data.player1Id === localId ? data.player2Id : data.player1Id;
      const helperName = this.scene.getPlayerNameById(helperId) || 'A stranger';
      this.showWingmanToast(helperName);
    };

    networkClient.on('fistBumpAnimation', this.networkHandler);
  }

  cleanupNetworkHook() {
    if (!this.networkHandler) return;
    const networkClient = window.networkClient;
    if (networkClient) {
      networkClient.off('fistBumpAnimation', this.networkHandler);
    }
    this.networkHandler = null;
  }
}
