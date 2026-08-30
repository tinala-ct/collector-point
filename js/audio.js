/**
 * Classroom Lucky Wheel - Audio Synthesizer (Web Audio API)
 * Generates all sounds procedurally without requiring external mp3/wav files!
 */

class SoundController {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.volume = 0.6;
    this.initAudioContext();
  }

  initAudioContext() {
    // Lazy initialize on first user gesture
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
  }

  ensureContextActive() {
    if (!this.audioCtx) {
      this.initAudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
  }

  // Quick mechanical tick sound when wheel segment passes pointer
  playTick(frequency = 600) {
    if (this.isMuted) return;
    this.ensureContextActive();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.audioCtx.currentTime + 0.035);

      gain.gain.setValueAtTime(this.volume * 0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.035);
    } catch (e) {
      // Ignore audio glitches
    }
  }

  // Celebratory winner selection chime
  playWinner() {
    if (this.isMuted) return;
    this.ensureContextActive();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      setTimeout(() => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.5, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.4);
        } catch (e) {}
      }, index * 90);
    });
  }

  // Correct answer sound - uplifting melodic chime
  playCorrect() {
    if (this.isMuted) return;
    this.ensureContextActive();
    if (!this.audioCtx) return;

    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.6, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.35);
        } catch (e) {}
      }, idx * 70);
    });
  }

  // Wrong answer sound - gentle playful descending boop
  playWrong() {
    if (this.isMuted) return;
    this.ensureContextActive();
    if (!this.audioCtx) return;

    const notes = [330, 260];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.3, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 0.25);
        } catch (e) {}
      }, idx * 130);
    });
  }

  // Grand fanfare for end-of-game podium
  playFanfare() {
    if (this.isMuted) return;
    this.ensureContextActive();
    if (!this.audioCtx) return;

    const melody = [
      { freq: 523.25, time: 0, dur: 0.15 },
      { freq: 523.25, time: 0.16, dur: 0.15 },
      { freq: 523.25, time: 0.32, dur: 0.15 },
      { freq: 659.25, time: 0.48, dur: 0.35 },
      { freq: 587.33, time: 0.85, dur: 0.15 },
      { freq: 659.25, time: 1.02, dur: 0.15 },
      { freq: 783.99, time: 1.20, dur: 0.60 },
      { freq: 1046.50, time: 1.85, dur: 0.80 }
    ];

    melody.forEach(item => {
      setTimeout(() => {
        try {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.freq, this.audioCtx.currentTime);

          gain.gain.setValueAtTime(this.volume * 0.55, this.audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + item.dur);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start();
          osc.stop(this.audioCtx.currentTime + item.dur);
        } catch (e) {}
      }, item.time * 1000);
    });
  }
}

export const sounds = new SoundController();
