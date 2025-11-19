export class MusicManager {
  constructor() {
    this.currentTrack = null;
    this.isPlaying = false;
    this.volume = 0.4;
    this.audioContext = null;
    this.tempo = 100; // BPM
    
    this.scales = {
      minorPentatonic: [0, 3, 5, 7, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      techno: [0, 3, 5, 7, 10] // Minor Pentatonic
    };
    
    this.themes = {
      beach: { scale: 'dorian', baseNote: 58, type: 'pad', speed: 4, tempo: 100 }, // Bb Dorian
      city: { scale: 'minorPentatonic', baseNote: 48, type: 'bass', speed: 2, tempo: 110 }, // C Minor
      bar: { scale: 'phrygian', baseNote: 53, type: 'jazz', speed: 3, tempo: 100 }, // F Phrygian
      hotel: { scale: 'dorian', baseNote: 60, type: 'pad', speed: 4, tempo: 90 }, // C Dorian
      building: { scale: 'techno', baseNote: 45, type: 'techno', speed: 1, tempo: 135 } // A Minor Techno
    };

    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  playSceneMusic(sceneName) {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const theme = this.themes[sceneName] || this.themes.city;
    
    // Don't restart if same theme
    if (this.currentTrack && this.currentTrack.name === sceneName) return;
    
    this.stopMusic();
    this.startProceduralTrack(sceneName, theme);
  }

  stopMusic() {
    if (this.currentTrack) {
      this.currentTrack.oscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      });
      if (this.currentTrack.timer) {
        clearInterval(this.currentTrack.timer);
      }
      this.currentTrack = null;
    }
  }

  startProceduralTrack(name, theme) {
    const scale = this.scales[theme.scale];
    const baseFreq = this.midiToFreq(theme.baseNote);
    const tempo = theme.tempo || this.tempo;
    
    this.currentTrack = {
      name: name,
      oscillators: [],
      timer: null
    };

    // Start loop
    const stepTime = (60 / tempo) * 1000 / 4; // 16th notes
    let step = 0;

    // Create initial drone/pad (except for techno)
    if (theme.type !== 'techno') {
        this.playChord(theme.baseNote, scale, 'pad');
    }

    this.currentTrack.timer = setInterval(() => {
      step++;
      
      if (theme.type === 'techno') {
          // 4/4 Kick
          if (step % 4 === 0) {
              this.playKick();
          }
          
          // Hi-hat
          if ((step + 2) % 4 === 0) {
              this.playHiHat();
          }
          
          // Bass Arp
          const noteIndex = Math.floor(Math.random() * scale.length);
          const note = theme.baseNote + scale[step % scale.length] - 12;
          this.playNote(note, 0.1, 'bass');
          
          // Lead (sparse)
          if (step % 16 === 0 && Math.random() > 0.5) {
              const melodyNote = theme.baseNote + scale[Math.floor(Math.random() * scale.length)] + 12;
              this.playNote(melodyNote, 0.2, 'lead');
          }
      } else {
          // Original logic for ambient/jazz
          // Play melody note occasionally
          if (step % (theme.speed * 4) === 0) {
            const noteIndex = Math.floor(Math.random() * scale.length);
            const octave = Math.random() > 0.7 ? 1 : 0;
            const note = theme.baseNote + scale[noteIndex] + (octave * 12);
            this.playNote(note, 0.5, 'lead');
          }
          
          // Change chord every 64 steps (4 bars)
          if (step % 64 === 0) {
            const progressions = [0, 7, 5, 0]; 
            const rootOffset = progressions[(step / 64) % 4];
            this.playChord(theme.baseNote + rootOffset, scale, 'pad');
          }
      }
      
    }, stepTime);
  }

  playKick() {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      gain.gain.setValueAtTime(this.volume * 0.8, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.5);
  }

  playHiHat() {
      const bufferSize = this.audioContext.sampleRate * 0.05; // 50ms
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);
      
      noise.start();
  }

  playNote(midiNote, duration, type) {
    const freq = this.midiToFreq(midiNote);
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    osc.frequency.value = freq;
    
    if (type === 'lead') {
      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      filter.Q.value = 5;
      
      // Envelope
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    } else if (type === 'bass') {
      osc.type = 'square';
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      gain.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + duration);
  }

  playChord(root, scale, type) {
    // Stop previous pad oscillators if they exist (simulate chord change)
    // Ideally we'd crossfade, but for now let's just layer or simple stop
    
    // Play triad
    const notes = [root, root + 3, root + 7]; // Minorish
    
    notes.forEach(note => {
      const freq = this.midiToFreq(note);
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = type === 'pad' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      
      // Detune for chorus effect
      osc.detune.value = (Math.random() - 0.5) * 10;
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.1, this.audioContext.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 4); // Fade out over 4s
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 4);
    });
  }

  playChatSound() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // High pitch "ping" (retro square)
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  midiToFreq(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}
