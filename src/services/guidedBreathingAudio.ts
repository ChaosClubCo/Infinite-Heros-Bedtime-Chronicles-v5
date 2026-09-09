/**
 * Audio synthesis engine for Guided Breathing bedtime sessions.
 * Provides soothing ambient drones, procedural soundscapes, and synchronized
 * melodic frequency glides that rise on inhale and softly descend on exhale.
 */

export type BreathingSoundscape = 'celestial-hum' | 'ocean-waves' | 'night-breeze' | 'starlight-chimes' | 'warm-rain' | 'silent';

export class GuidedBreathingAudioEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private breathToneGain: GainNode | null = null;
  private breathOsc: OscillatorNode | null = null;
  private isAmbientPlaying = false;
  private currentSoundscape: BreathingSoundscape = 'celestial-hum';

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (err) {
      console.warn('[GuidedBreathingAudio] Context init failed:', err);
      return null;
    }
  }

  /**
   * Start procedural calm ambient audio for the breathing session
   */
  public startAmbient(soundscape: BreathingSoundscape = 'celestial-hum', volume: number = 0.3): void {
    this.stopAmbient();
    if (soundscape === 'silent') {
      this.currentSoundscape = 'silent';
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    try {
      this.currentSoundscape = soundscape;
      this.isAmbientPlaying = true;

      // Master ambient gain node
      this.ambientGain = ctx.createGain();
      const safeVolume = Math.min(Math.max(volume, 0), 1) * 0.28;
      this.ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(Math.max(safeVolume, 0.001), ctx.currentTime + 1.2);
      this.ambientGain.connect(ctx.destination);

      if (soundscape === 'celestial-hum') {
        // Soothing warm harmonic chord drone (Root: D3 = 146.83Hz, A3 = 220Hz, F#4 = 369.99Hz)
        // Tuned for deeply relaxing sleep frequencies
        const masterOscGroup = ctx.createGain();
        const baseFreqs = [146.83, 220.0, 293.66, 369.99];

        baseFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Subtle detune for warm shimmer
          osc.detune.setValueAtTime((idx - 1.5) * 3, ctx.currentTime);

          const layerVolume = 0.25 / baseFreqs.length;
          oscGain.gain.setValueAtTime(layerVolume, ctx.currentTime);

          osc.connect(oscGain);
          oscGain.connect(masterOscGroup);
          osc.start();
        });

        // Slow warm filter sweeping
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow 12s cycle
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(120, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();

        masterOscGroup.connect(filter);
        filter.connect(this.ambientGain);

        this.ambientSource = masterOscGroup;
        this.lfoNode = lfo;

      } else if (soundscape === 'ocean-waves' || soundscape === 'warm-rain' || soundscape === 'night-breeze') {
        // Procedural filtered pink noise
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0; let b1 = 0; let b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.4;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        if (soundscape === 'ocean-waves') {
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(320, ctx.currentTime);
          filter.Q.setValueAtTime(1.8, ctx.currentTime);

          // Ocean wave surging LFO
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 sec wave
          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(200, ctx.currentTime);
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          this.lfoNode = lfo;
        } else if (soundscape === 'warm-rain') {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(700, ctx.currentTime);
        } else {
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(260, ctx.currentTime);
        }

        noise.connect(filter);
        filter.connect(this.ambientGain);
        noise.start();
        this.ambientSource = noise;

      } else if (soundscape === 'starlight-chimes') {
        // Pentatonic gentle ambient chime pulse
        const chimeGroup = ctx.createGain();
        chimeGroup.gain.setValueAtTime(0.2, ctx.currentTime);

        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(110, ctx.currentTime);
        subOsc.connect(chimeGroup);
        subOsc.start();

        chimeGroup.connect(this.ambientGain);
        this.ambientSource = chimeGroup;
      }
    } catch (err) {
      console.warn('[GuidedBreathingAudio] Failed to start ambient:', err);
    }
  }

  /**
   * Set ambient volume smoothly
   */
  public setVolume(volume: number): void {
    if (this.ambientGain && this.ctx) {
      const safeVolume = Math.min(Math.max(volume, 0), 1) * 0.28;
      this.ambientGain.gain.setTargetAtTime(safeVolume, this.ctx.currentTime, 0.15);
    }
  }

  /**
   * Stop ambient audio smoothly
   */
  public stopAmbient(): void {
    try {
      if (this.lfoNode) {
        this.lfoNode.stop();
        this.lfoNode.disconnect();
        this.lfoNode = null;
      }
      if (this.ambientSource) {
        if ('stop' in this.ambientSource && typeof (this.ambientSource as AudioScheduledSourceNode).stop === 'function') {
          (this.ambientSource as AudioScheduledSourceNode).stop();
        }
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.ambientGain.disconnect();
        this.ambientGain = null;
      }
      this.isAmbientPlaying = false;
    } catch {
      // safe ignore
    }
  }

  /**
   * Play a synchronized gentle breath cue tone.
   * Rises in frequency on 'inhale', holds softly on 'hold', descends on 'exhale', and quiets on 'rest'.
   */
  public playPhaseTone(
    phase: 'inhale' | 'hold' | 'exhale' | 'rest',
    durationSeconds: number,
    enabled: boolean = true,
    volume: number = 0.25
  ): void {
    if (!enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // Clean up any ongoing breath tone
      this.stopBreathTone();

      const now = ctx.currentTime;
      const safeDur = Math.max(durationSeconds, 0.5);
      const toneGain = ctx.createGain();
      const osc = ctx.createOscillator();
      osc.type = 'sine';

      const peakVolume = Math.min(Math.max(volume, 0), 1) * 0.14;

      if (phase === 'inhale') {
        // Frequency gently glides upward from 220Hz (A3) to 329.63Hz (E4)
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(329.63, now + safeDur * 0.95);

        // Volume swells smoothly with the inhale
        toneGain.gain.setValueAtTime(0.001, now);
        toneGain.gain.exponentialRampToValueAtTime(peakVolume, now + safeDur * 0.7);
        toneGain.gain.exponentialRampToValueAtTime(peakVolume * 0.8, now + safeDur);

      } else if (phase === 'hold') {
        // Warm sustained peaceful tone at 329.63Hz (E4) with soft vibrato
        osc.frequency.setValueAtTime(329.63, now);
        toneGain.gain.setValueAtTime(peakVolume * 0.8, now);
        toneGain.gain.exponentialRampToValueAtTime(peakVolume * 0.6, now + safeDur);

      } else if (phase === 'exhale') {
        // Frequency glides gently downward from 329.63Hz down to 196Hz (G3) - sigh of relief
        osc.frequency.setValueAtTime(329.63, now);
        osc.frequency.exponentialRampToValueAtTime(196, now + safeDur * 0.9);

        // Volume fades out softly as lungs empty
        toneGain.gain.setValueAtTime(peakVolume * 0.7, now);
        toneGain.gain.exponentialRampToValueAtTime(0.001, now + safeDur);

      } else {
        // Rest: Very quiet resting tone
        osc.frequency.setValueAtTime(196, now);
        toneGain.gain.setValueAtTime(0.001, now);
      }

      osc.connect(toneGain);
      toneGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + safeDur);

      this.breathOsc = osc;
      this.breathToneGain = toneGain;
    } catch (err) {
      console.warn('[GuidedBreathingAudio] Phase tone error:', err);
    }
  }

  public stopBreathTone(): void {
    try {
      if (this.breathOsc) {
        this.breathOsc.stop();
        this.breathOsc.disconnect();
        this.breathOsc = null;
      }
      if (this.breathToneGain) {
        this.breathToneGain.disconnect();
        this.breathToneGain = null;
      }
    } catch {
      // safe ignore
    }
  }

  /**
   * Play celestial celebration chimes when target breaths are completed
   */
  public playCompletionChime(): void {
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Warm pentatonic chord: C5, E5, G5, B5, D6, G6
      const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.14);

        const startTime = now + i * 0.14;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 2.3);
      });
    } catch (err) {
      console.warn('[GuidedBreathingAudio] Chime error:', err);
    }
  }

  public cleanup(): void {
    this.stopBreathTone();
    this.stopAmbient();
  }
}

export const guidedBreathingAudio = new GuidedBreathingAudioEngine();
