// Audio synthesis engine for ambient soundscapes and speech narration

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentSound: string = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playAmbient(sound: string, volume: number = 0.3) {
    this.stopAmbient();
    if (sound === 'none') {
      this.currentSound = 'none';
      return;
    }

    try {
      this.initContext();
      if (!this.ctx) return;

      this.currentSound = sound;
      this.isPlaying = true;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1) * 0.25, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);

      // Synthesize soothing ambient audio using procedural audio nodes
      if (sound === 'rain' || sound === 'ocean' || sound === 'wind') {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink/Brown noise filter
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * (sound === 'wind' ? 2.5 : 3.5);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        if (sound === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        } else if (sound === 'ocean') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(400, this.ctx.currentTime);
          filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
          
          // LFO for wave surging
          const lfo = this.ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);
          const lfoGain = this.ctx.createGain();
          lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
        } else if (sound === 'wind') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, this.ctx.currentTime);
        }

        noise.connect(filter);
        filter.connect(this.gainNode);
        noise.start();
        this.noiseNode = noise;
      } else if (sound === 'crickets' || sound === 'train' || sound === 'fire') {
        // Multi-oscillator warm harmonic soundscape
        const osc = this.ctx.createOscillator();
        osc.type = sound === 'crickets' ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(sound === 'crickets' ? 4200 : sound === 'train' ? 110 : 85, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(sound === 'crickets' ? 7 : sound === 'train' ? 1.5 : 3, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

        lfo.connect(lfoGain.gain);
        osc.connect(this.gainNode);
        osc.start();
        lfo.start();
        this.noiseNode = osc;
      }
    } catch (e) {
      console.warn('Ambient audio initialization deferred:', e);
    }
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1) * 0.25, this.ctx.currentTime);
    }
  }

  public stopAmbient() {
    try {
      if (this.noiseNode) {
        (this.noiseNode as AudioScheduledSourceNode).stop?.();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.isPlaying = false;
    } catch {
      // Ignored
    }
  }

  public playCelebrationChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Celestial harmonic major chord arpeggio with warm bell harmonics
      // Notes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50), E6 (1318.51)
      const frequencies = [523.25, 659.25, 783.99, 987.77, 1046.50, 1318.51];
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.24, now);
      masterGain.connect(this.ctx.destination);

      frequencies.forEach((freq, index) => {
        if (!this.ctx) return;
        const noteStart = now + index * 0.09;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = index === frequencies.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        // Gentle exponential decay for chime bell feel
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 1.6);
      });

      // Warm underlying root tone (C4: 261.63 Hz)
      const rootOsc = this.ctx.createOscillator();
      const rootGain = this.ctx.createGain();
      rootOsc.type = 'sine';
      rootOsc.frequency.setValueAtTime(261.63, now + 0.05);
      rootGain.gain.setValueAtTime(0.0001, now + 0.05);
      rootGain.gain.exponentialRampToValueAtTime(0.18, now + 0.15);
      rootGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

      rootOsc.connect(rootGain);
      rootGain.connect(masterGain);
      rootOsc.start(now + 0.05);
      rootOsc.stop(now + 2.1);
    } catch (e) {
      console.warn('Celebration chime synthesis bypassed:', e);
    }
  }

  public playStarTwinkle(pitchMultiplier: number = 1.0) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High delicate starlight sparkle chime (G5, C6, E6)
      const baseFreqs = [783.99, 1046.50, 1318.51, 1567.98];
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.16, now);
      masterGain.connect(this.ctx.destination);

      baseFreqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * pitchMultiplier, noteStart);

        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.22, noteStart + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.85);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 0.9);
      });
    } catch (e) {
      console.warn('Star twinkle sound bypassed:', e);
    }
  }
}

export const ambientSoundEngine = new AmbientSoundEngine();

// Speech Synthesis wrapper with gentle cadence and callbacks
export class VoiceNarrator {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static speak(
    text: string,
    options: {
      speedRate?: number;
      volume?: number;
      voiceId?: string;
      onStart?: () => void;
      onBoundary?: (charIndex: number, charLength?: number) => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ): boolean {
    if (!this.synth) return false;
    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.speedRate || 0.85; // Calming bedtime pace
      utterance.pitch = 1.0;
      if (options.volume !== undefined) {
        utterance.volume = Math.max(0, Math.min(1, options.volume));
      }

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        // Pick a soothing English voice if available
        const selected = voices.find(v => 
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Serena'))
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (selected) utterance.voice = selected;
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        options.onBoundary?.(event.charIndex, event.charLength);
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        options.onError?.();
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      options.onError?.();
      return false;
    }
  }

  public static pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public static resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  public static stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static isSpeaking(): boolean {
    return !!(this.synth && (this.synth.speaking || this.synth.pending));
  }
}
