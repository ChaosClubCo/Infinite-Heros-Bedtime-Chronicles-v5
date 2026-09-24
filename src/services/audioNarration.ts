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

  public playMorningSunriseChime() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Uplifting Lydian dawn progression: D4, F#4, A4, C#5, E5, F#5, A5
      const dawnNotes = [293.66, 369.99, 440.0, 554.37, 659.25, 739.99, 880.0];
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.22, now);
      masterGain.connect(this.ctx.destination);

      // Warm ambient sunrise pad swell
      const padOsc = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(146.83, now); // D3
      padGain.gain.setValueAtTime(0.0001, now);
      padGain.gain.exponentialRampToValueAtTime(0.18, now + 0.6);
      padGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      padOsc.connect(padGain);
      padGain.connect(masterGain);
      padOsc.start(now);
      padOsc.stop(now + 3.3);

      // Ascending harp / bell notes
      dawnNotes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteStart = now + 0.15 + idx * 0.12;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = idx >= 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.28, noteStart + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.8);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(noteStart);
        osc.stop(noteStart + 1.9);
      });

      // Subtle cheerful morning bird chirp harmonics at the peak of sunrise
      const birdStart = now + 1.2;
      const birdOsc = this.ctx.createOscillator();
      const birdGain = this.ctx.createGain();
      birdOsc.type = 'sine';
      birdOsc.frequency.setValueAtTime(2600, birdStart);
      birdOsc.frequency.exponentialRampToValueAtTime(3200, birdStart + 0.08);
      birdOsc.frequency.exponentialRampToValueAtTime(2800, birdStart + 0.15);

      birdGain.gain.setValueAtTime(0.0001, birdStart);
      birdGain.gain.exponentialRampToValueAtTime(0.12, birdStart + 0.02);
      birdGain.gain.exponentialRampToValueAtTime(0.0001, birdStart + 0.25);

      birdOsc.connect(birdGain);
      birdGain.connect(masterGain);
      birdOsc.start(birdStart);
      birdOsc.stop(birdStart + 0.3);
    } catch (e) {
      console.warn('Sunrise chime synthesis bypassed:', e);
    }
  }
}

export const ambientSoundEngine = new AmbientSoundEngine();

export interface CharacterNarrator {
  id: string;
  name: string;
  characterTitle: string;
  avatarEmoji: string;
  tagline: string;
  description: string;
  role: string;
  pitch: number;
  rateMultiplier: number;
  gender: 'female' | 'male' | 'neutral';
  color: string;
  gradient: string;
  badge: string;
  samplePhrase: string;
}

export const PRELOADED_NARRATORS: CharacterNarrator[] = [
  {
    id: 'luna',
    name: 'Luna the Dreamweaver',
    characterTitle: 'Celestial Whisperer',
    avatarEmoji: '🌙',
    tagline: 'Whispering Starlight & Sweet Dreams',
    description: 'Soft, ethereal, and melodic bedtime voice tuned to soothe busy minds into calm slumber.',
    role: 'Starlight Storyteller',
    pitch: 1.06,
    rateMultiplier: 0.96,
    gender: 'female',
    color: '#818cf8',
    gradient: 'from-indigo-500 to-purple-600',
    badge: 'Celestial',
    samplePhrase: 'Close your eyes, little dreamer. The velvet night sky wraps you in gentle starlight.',
  },
  {
    id: 'orion',
    name: 'Orion the Night Bear',
    characterTitle: 'Deep Cozy Hearth',
    avatarEmoji: '🐻',
    tagline: 'Warm, Grounded & Reassuring Baritone',
    description: 'A comforting, deep hearthside rumble like a warm weighted bedtime blanket.',
    role: 'Cozy Protector',
    pitch: 0.82,
    rateMultiplier: 0.94,
    gender: 'male',
    color: '#f59e0b',
    gradient: 'from-amber-600 to-orange-700',
    badge: 'Protector',
    samplePhrase: 'You did such a wonderful job today. You are completely safe, cozy, and ready to rest.',
  },
  {
    id: 'stella',
    name: 'Stella the Star Guide',
    characterTitle: 'Nurturing Starlight',
    avatarEmoji: '✨',
    tagline: 'Loving, Melodic & Reassuring Tone',
    description: 'Warm maternal bedtime storyteller filled with radiant peace, kindness, and reassurance.',
    role: 'Comforting Guide',
    pitch: 1.14,
    rateMultiplier: 0.98,
    gender: 'female',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    badge: 'Nurturing',
    samplePhrase: 'Every little star is shining just for you tonight. Rest your head and drift into sweet wonder.',
  },
  {
    id: 'barnaby',
    name: 'Barnaby the Sleepy Owl',
    characterTitle: 'Wise Hearthside Scholar',
    avatarEmoji: '🦉',
    tagline: 'Gentle, Wise & Calming Hearthside Tone',
    description: 'Slow, soothing, and rhythmic cadence reminiscent of an old enchanted bedtime library.',
    role: 'Wise Storyteller',
    pitch: 0.88,
    rateMultiplier: 0.90,
    gender: 'male',
    color: '#10b981',
    gradient: 'from-emerald-600 to-teal-700',
    badge: 'Wise Hearth',
    samplePhrase: 'Hoo-hoo... The forest has settled for the night. Let every worry drift away like autumn leaves.',
  },
  {
    id: 'zephyr',
    name: 'Zephyr the Breeze Guide',
    characterTitle: 'Hypnagogic Wind Whisper',
    avatarEmoji: '🍃',
    tagline: 'Featherlight, Peaceful & Calming Flow',
    description: 'Delicate, whisper-soft airiness that rocks weary eyelids gently to sleep.',
    role: 'Soothing Breeze',
    pitch: 1.0,
    rateMultiplier: 0.92,
    gender: 'neutral',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-600',
    badge: 'Gentle Breeze',
    samplePhrase: 'A gentle evening breeze carries peace across the hills, breathing calmness into your dreams.',
  },
  {
    id: 'pip',
    name: 'Pip the Starlight Bunny',
    characterTitle: 'Cuddly Bedtime Buddy',
    avatarEmoji: '🐰',
    tagline: 'Sweet, Cozy & Friendly Companion',
    description: 'Playful yet soft-spoken bedtime companion for younger toddlers and cozy dreamers.',
    role: 'Cozy Companion',
    pitch: 1.22,
    rateMultiplier: 0.96,
    gender: 'female',
    color: '#a855f7',
    gradient: 'from-purple-500 to-indigo-600',
    badge: 'Cuddle Buddy',
    samplePhrase: 'Snuggle under your cozy blanket, little bunny! The stars are smiling down on you.',
  },
];

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
      pitch?: number;
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
      
      const narrator =
        PRELOADED_NARRATORS.find((n) =>
          n.id === options.voiceId ||
          ((options.voiceId === 'moonbeam' || options.voiceId === 'voice-moonbeam') && n.id === 'luna') ||
          (options.voiceId === 'starlight-guide' && n.id === 'stella') ||
          (options.voiceId === 'forest-whisperer' && n.id === 'zephyr') ||
          (options.voiceId === 'cozy-hearth' && n.id === 'orion') ||
          (options.voiceId === 'wise-hearth' && n.id === 'barnaby') ||
          (options.voiceId === 'playful-dreamer' && n.id === 'pip')
        ) ||
        PRELOADED_NARRATORS[0];

      const baseSpeed = options.speedRate || 0.85;
      utterance.rate = baseSpeed * (narrator?.rateMultiplier || 1.0);
      utterance.pitch = options.pitch !== undefined ? options.pitch : (narrator?.pitch || 1.0);

      if (options.volume !== undefined) {
        utterance.volume = Math.max(0, Math.min(1, options.volume));
      }

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        let matchedVoice: SpeechSynthesisVoice | undefined;

        if (narrator?.gender === 'female') {
          matchedVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Samantha') ||
                v.name.includes('Victoria') ||
                v.name.includes('Karen') ||
                v.name.includes('Serena') ||
                v.name.includes('Moira') ||
                v.name.includes('Zira') ||
                v.name.includes('Female') ||
                v.name.includes('Google UK English Female') ||
                v.name.includes('Natural'))
          );
        } else if (narrator?.gender === 'male') {
          matchedVoice = voices.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Daniel') ||
                v.name.includes('Arthur') ||
                v.name.includes('Alex') ||
                v.name.includes('David') ||
                v.name.includes('Oliver') ||
                v.name.includes('Male') ||
                v.name.includes('Google UK English Male') ||
                v.name.includes('George'))
          );
        }

        if (!matchedVoice) {
          matchedVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
            ) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
        }

        if (matchedVoice) utterance.voice = matchedVoice;
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

  public static previewSample(
    narratorId: string,
    callbacks?: { onStart?: () => void; onEnd?: () => void }
  ): boolean {
    const narrator =
      PRELOADED_NARRATORS.find((n) => n.id === narratorId) || PRELOADED_NARRATORS[0];
    return this.speak(narrator.samplePhrase, {
      voiceId: narrator.id,
      speedRate: 0.88,
      volume: 0.95,
      onStart: callbacks?.onStart,
      onEnd: callbacks?.onEnd,
      onError: callbacks?.onEnd,
    });
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
