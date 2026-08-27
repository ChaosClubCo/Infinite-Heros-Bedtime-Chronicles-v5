import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Moon,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  Sparkles,
  Heart,
  Clock,
  Sliders,
  Eye,
  EyeOff,
  Waves,
  Flame,
  Radio,
} from 'lucide-react';

export type NightlightThemeId = 'lavender' | 'amber' | 'aurora' | 'rose' | 'ocean';
export type VisualPatternId = 'halo' | 'stars' | 'waves' | 'candle';

interface NightlightTheme {
  id: NightlightThemeId;
  name: string;
  subtitle: string;
  bgDark: string;
  primaryGlow: string;
  secondaryGlow: string;
  accentGlow: string;
  textColor: string;
  borderBadge: string;
  badgeBg: string;
}

export const NIGHTLIGHT_THEMES: NightlightTheme[] = [
  {
    id: 'lavender',
    name: 'Moonlit Lavender',
    subtitle: 'Deep indigo & starry violet haze',
    bgDark: '#0a061c',
    primaryGlow: 'rgba(99, 102, 241, 0.45)',
    secondaryGlow: 'rgba(168, 85, 247, 0.35)',
    accentGlow: '#c084fc',
    textColor: 'text-indigo-200',
    borderBadge: 'border-indigo-500/40',
    badgeBg: 'bg-indigo-950/80',
  },
  {
    id: 'amber',
    name: 'Warm Amber Hearth',
    subtitle: 'Cozy golden ember & peach twilight',
    bgDark: '#170c04',
    primaryGlow: 'rgba(245, 158, 11, 0.45)',
    secondaryGlow: 'rgba(251, 146, 60, 0.35)',
    accentGlow: '#fde68a',
    textColor: 'text-amber-200',
    borderBadge: 'border-amber-500/40',
    badgeBg: 'bg-amber-950/80',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    subtitle: 'Cosmic emerald & soothing cyan glow',
    bgDark: '#031414',
    primaryGlow: 'rgba(16, 185, 129, 0.40)',
    secondaryGlow: 'rgba(6, 182, 212, 0.35)',
    accentGlow: '#67e8f9',
    textColor: 'text-emerald-200',
    borderBadge: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-950/80',
  },
  {
    id: 'rose',
    name: 'Rose Quartz Sunset',
    subtitle: 'Gentle dusk mauve & soft blush glow',
    bgDark: '#180712',
    primaryGlow: 'rgba(236, 72, 153, 0.40)',
    secondaryGlow: 'rgba(244, 63, 94, 0.35)',
    accentGlow: '#fda4af',
    textColor: 'text-rose-200',
    borderBadge: 'border-rose-500/40',
    badgeBg: 'bg-rose-950/80',
  },
  {
    id: 'ocean',
    name: 'Deep Dream Ocean',
    subtitle: 'Midnight sapphire & bioluminescent sea',
    bgDark: '#031024',
    primaryGlow: 'rgba(14, 165, 233, 0.45)',
    secondaryGlow: 'rgba(56, 189, 248, 0.35)',
    accentGlow: '#7dd3fc',
    textColor: 'text-sky-200',
    borderBadge: 'border-sky-500/40',
    badgeBg: 'bg-sky-950/80',
  },
];

interface SoundReactiveNightlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName?: string;
}

export const SoundReactiveNightlightModal: React.FC<SoundReactiveNightlightModalProps> = ({
  isOpen,
  onClose,
  childName = 'Little Explorer',
}) => {
  // Theme & Visual State
  const [selectedTheme, setSelectedTheme] = useState<NightlightThemeId>('lavender');
  const [selectedPattern, setSelectedPattern] = useState<VisualPatternId>('halo');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [isBreathingGuideActive, setIsBreathingGuideActive] = useState(true);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');

  // Microphone & Sound Detection State
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [ambientLevel, setAmbientLevel] = useState<number>(0.15); // 0.0 to 1.0 smoothed
  const [sensitivity, setSensitivity] = useState<number>(1.5); // 0.5 to 3.0
  const [minBrightness, setMinBrightness] = useState<number>(0.2); // 0.1 to 0.5
  const [maxBrightness, setMaxBrightness] = useState<number>(0.95); // 0.6 to 1.0

  // Sleep Timer
  const [timerMinutes, setTimerMinutes] = useState<number>(0); // 0 = off, 15, 30, 45, 60
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Audio Synth Companion State
  const [audioCompanion, setAudioCompanion] = useState<'none' | 'pinknoise' | 'rain' | 'lullabyChimes'>('none');
  const [synthVolume, setSynthVolume] = useState<number>(0.3);

  // Refs for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const synthNodesRef = useRef<{ source?: AudioNode; gainNode?: GainNode } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothedLevelRef = useRef<number>(0.2);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTheme = NIGHTLIGHT_THEMES.find((t) => t.id === selectedTheme) || NIGHTLIGHT_THEMES[0];

  // 1. Microphone Setup & Audio Stream Analysis
  const startMicrophone = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicPermissionState('unsupported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      microphoneStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicPermissionState('granted');
      setIsMicEnabled(true);
    } catch (err) {
      console.warn('[Nightlight] Microphone permission denied or unavailable, switching to soothing ambient simulator:', err);
      setMicPermissionState('denied');
      setIsMicEnabled(false);
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsMicEnabled(false);
  }, []);

  // 2. Continuous Loop for Ambient Level and Canvas Rendering
  useEffect(() => {
    if (!isOpen) return;

    if (isMicEnabled && micPermissionState === 'prompt') {
      startMicrophone();
    }

    let time = 0;
    const dataArray = new Uint8Array(128);

    const updateLoop = () => {
      time += 0.03;
      let rawLevel = 0;

      if (isMicEnabled && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        // Calculate RMS of lower-to-mid voice/breath frequencies (bins 2 to 40)
        let sum = 0;
        const usefulBins = 38;
        for (let i = 2; i < 40; i++) {
          sum += (dataArray[i] / 255) ** 2;
        }
        const rms = Math.sqrt(sum / usefulBins);
        rawLevel = Math.min(1.0, rms * sensitivity);
      } else {
        // Natural gentle sine-wave breath simulation (4-7-8 rhythm ~ 19 second loop)
        const breathCycle = (Math.sin(time * 0.4) + 1) / 2; // 0 to 1
        rawLevel = 0.15 + breathCycle * 0.45;
      }

      // Smooth exponential decay / lerp
      smoothedLevelRef.current += (rawLevel - smoothedLevelRef.current) * 0.12;
      const currentSmoothed = Math.max(0.05, Math.min(1.0, smoothedLevelRef.current));
      setAmbientLevel(currentSmoothed);

      // Render Canvas pattern
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const centerX = width / 2;
          const centerY = height / 2;
          const baseRadius = Math.min(width, height) * 0.28;
          const dynamicRadius = baseRadius + currentSmoothed * (baseRadius * 0.6);

          if (selectedPattern === 'halo') {
            // Radiant Multi-layer Celestial Halo
            const glowGradient = ctx.createRadialGradient(
              centerX,
              centerY,
              dynamicRadius * 0.2,
              centerX,
              centerY,
              dynamicRadius * 1.6
            );
            glowGradient.addColorStop(0, currentTheme.accentGlow);
            glowGradient.addColorStop(0.4, currentTheme.primaryGlow);
            glowGradient.addColorStop(0.8, currentTheme.secondaryGlow);
            glowGradient.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, dynamicRadius * 1.6, 0, Math.PI * 2);
            ctx.fill();

            // Inner core sphere
            ctx.beginPath();
            ctx.arc(centerX, centerY, dynamicRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.15 + currentSmoothed * 0.35) + ')';
            ctx.fill();
          } else if (selectedPattern === 'stars') {
            // Twinkling Starlight Dust Particles
            const particleCount = 65;
            for (let i = 0; i < particleCount; i++) {
              const seed = i * 47.123;
              const px = (Math.sin(seed + time * 0.1) * 0.45 + 0.5) * width;
              const py = (Math.cos(seed * 1.3 + time * 0.08) * 0.45 + 0.5) * height;
              const pSize = (Math.sin(seed * 3 + time * 1.5) + 1.2) * (1.5 + currentSmoothed * 3.5);

              ctx.beginPath();
              ctx.arc(px, py, pSize, 0, Math.PI * 2);
              ctx.fillStyle = i % 3 === 0 ? currentTheme.accentGlow : 'rgba(255,255,255,0.7)';
              ctx.fill();
            }
          } else if (selectedPattern === 'waves') {
            // Harmonic Calming Waves
            ctx.lineWidth = 3;
            for (let w = 0; w < 4; w++) {
              ctx.beginPath();
              const waveAlpha = 0.2 + (w / 4) * 0.3 + currentSmoothed * 0.25;
              ctx.strokeStyle = w % 2 === 0 ? currentTheme.accentGlow : currentTheme.primaryGlow;
              ctx.globalAlpha = waveAlpha;

              const yOffset = centerY + (w - 1.5) * 35;
              for (let x = 0; x < width; x += 10) {
                const y =
                  yOffset +
                  Math.sin(x * 0.008 + time + w) * (15 + currentSmoothed * 40) +
                  Math.cos(x * 0.004 - time * 0.5) * 10;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
          } else if (selectedPattern === 'candle') {
            // Warm Soothing Candlelight Glow
            const flameHeight = dynamicRadius * 1.3;
            const candleGrad = ctx.createRadialGradient(
              centerX,
              centerY + 20,
              dynamicRadius * 0.1,
              centerX,
              centerY,
              flameHeight
            );
            candleGrad.addColorStop(0, '#fff');
            candleGrad.addColorStop(0.3, currentTheme.accentGlow);
            candleGrad.addColorStop(0.7, currentTheme.primaryGlow);
            candleGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = candleGrad;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, dynamicRadius * 0.8, flameHeight * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isMicEnabled, micPermissionState, sensitivity, selectedPattern, selectedTheme, currentTheme, startMicrophone]);

  // 3. Paced Breathing Guide Rhythm (4s Inhale, 7s Hold, 8s Exhale)
  useEffect(() => {
    if (!isOpen || !isBreathingGuideActive) return;

    let timer: NodeJS.Timeout;
    const cycle = () => {
      setBreathingPhase('Inhale');
      timer = setTimeout(() => {
        setBreathingPhase('Hold');
        timer = setTimeout(() => {
          setBreathingPhase('Exhale');
          timer = setTimeout(() => {
            cycle();
          }, 8000); // 8s Exhale
        }, 7000); // 7s Hold
      }, 4000); // 4s Inhale
    };

    cycle();
    return () => clearTimeout(timer);
  }, [isOpen, isBreathingGuideActive]);

  // 4. Sleep Countdown Timer
  useEffect(() => {
    if (!isOpen || timerMinutes <= 0) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(timerMinutes * 60);

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose(); // Automatically close nightlight when timer finishes
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timerMinutes, onClose]);

  // 5. Sound Companion Synthesizer
  useEffect(() => {
    if (!isOpen || audioCompanion === 'none') {
      if (synthNodesRef.current?.gainNode) {
        synthNodesRef.current.gainNode.gain.linearRampToValueAtTime(
          0.001,
          audioContextRef.current ? audioContextRef.current.currentTime + 0.8 : 1
        );
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(synthVolume * 0.25, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (audioCompanion === 'pinknoise') {
        // Generate continuous pink noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Low-pass filter for cozy sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        synthNodesRef.current = { source: whiteNoise, gainNode: masterGain };
      } else if (audioCompanion === 'lullabyChimes') {
        // Harmonic Sine Drone (432Hz & 528Hz celestial peaceful frequencies)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(216, ctx.currentTime); // Low soothing drone
        osc2.frequency.setValueAtTime(432, ctx.currentTime); // Gentle harmonic 5th

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();

        synthNodesRef.current = { source: osc1, gainNode: masterGain };
      }
    } catch (err) {
      console.warn('[Nightlight Synth] Error starting ambient drone:', err);
    }

    return () => {
      if (synthNodesRef.current?.gainNode && audioContextRef.current) {
        try {
          synthNodesRef.current.gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        } catch {}
      }
    };
  }, [audioCompanion, isOpen, synthVolume]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Auto-hide controls when user is resting in bedside mode
  const handleUserActivity = () => {
    if (hideControls) setHideControls(false);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setHideControls(true);
    }, 6000);
  };

  const calculatedLuminescence = minBrightness + ambientLevel * (maxBrightness - minBrightness);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      id="sound-reactive-nightlight-container"
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={hideControls ? () => setHideControls(false) : undefined}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors duration-1000 ease-out"
      style={{
        backgroundColor: currentTheme.bgDark,
      }}
    >
      {/* Background Luminescence Radial Glow that pulses dynamically with ambient room sound */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out"
        style={{
          opacity: calculatedLuminescence,
          background: `radial-gradient(circle at 50% 50%, ${currentTheme.primaryGlow} 0%, ${currentTheme.secondaryGlow} 45%, rgba(0,0,0,0) 80%)`,
        }}
      />

      {/* Dynamic Visualizer Canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth || 800}
        height={window.innerHeight || 600}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Central Breathing Guide & Affirmation */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AnimatePresence mode="wait">
          {isBreathingGuideActive && (
            <motion.div
              key={breathingPhase}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: breathingPhase === 'Inhale' ? 1.15 : breathingPhase === 'Exhale' ? 0.9 : 1.05, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: breathingPhase === 'Inhale' ? 4 : breathingPhase === 'Exhale' ? 8 : 7, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-3 cursor-pointer"
              onClick={() => setIsBreathingGuideActive(!isBreathingGuideActive)}
            >
              <div
                className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-white/20 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm transition-all duration-700"
                style={{
                  boxShadow: `0 0 ${30 + ambientLevel * 50}px ${currentTheme.accentGlow}66`,
                  borderColor: currentTheme.accentGlow,
                }}
              >
                <span className="text-xs uppercase tracking-widest text-slate-300 font-medium">Breathe</span>
                <span className="text-2xl sm:text-3xl font-playfair font-bold text-white tracking-wide">
                  {breathingPhase}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-mono">
                  {breathingPhase === 'Inhale' ? '4s' : breathingPhase === 'Hold' ? '7s' : '8s'}
                </span>
              </div>
              <p className="text-xs text-slate-300/80 max-w-xs font-light">
                {breathingPhase === 'Inhale' && `Gentle breath in through your nose, ${childName}...`}
                {breathingPhase === 'Hold' && 'Feel peaceful warmth settling in your chest...'}
                {breathingPhase === 'Exhale' && 'Slowly let go of your thoughts into the stars...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient Sound Decibel / Breath Visual Indicator */}
        <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
          {isMicEnabled ? (
            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : (
            <Radio className="w-3.5 h-3.5 text-amber-400" />
          )}
          <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${Math.min(100, ambientLevel * 100)}%`,
                backgroundColor: currentTheme.accentGlow,
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-300">
            {isMicEnabled ? 'Listening' : 'Pacing'}
          </span>
        </div>
      </div>

      {/* Top Floating Control Bar (Autohides during bedside sleep) */}
      <AnimatePresence>
        {!hideControls && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 inset-x-0 z-30 p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-sm"
          >
            {/* Title & Child Welcome */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: currentTheme.bgDark, border: `1px solid ${currentTheme.accentGlow}66` }}
              >
                <Moon className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-playfair font-bold text-white flex items-center gap-2">
                  <span>Bedside Sound Nightlight</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTheme.borderBadge} ${currentTheme.badgeBg} ${currentTheme.textColor}`}>
                    {currentTheme.name}
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  {isMicEnabled ? 'Pulses gently with ambient bedroom sounds & breathing' : 'Pacing with soothing 4-7-8 breathing loop'}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Mic Toggle Button */}
              <button
                type="button"
                id="nightlight-mic-toggle-btn"
                onClick={isMicEnabled ? stopMicrophone : startMicrophone}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isMicEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title={isMicEnabled ? 'Microphone Active' : 'Enable Microphone'}
              >
                {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isMicEnabled ? 'Mic Active' : 'Mic Off'}</span>
              </button>

              {/* Breathing Guide Toggle */}
              <button
                type="button"
                id="nightlight-breathing-toggle-btn"
                onClick={() => setIsBreathingGuideActive(!isBreathingGuideActive)}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isBreathingGuideActive
                    ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Toggle Paced Breathing Ring"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Guide</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                id="nightlight-fullscreen-btn"
                onClick={toggleFullscreen}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Fullscreen Nightlight"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Hide Controls Pill */}
              <button
                type="button"
                id="nightlight-hide-controls-btn"
                onClick={() => setHideControls(true)}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Dim Controls for Bedside"
              >
                <EyeOff className="w-4 h-4" />
              </button>

              {/* Close Modal */}
              <button
                type="button"
                id="nightlight-close-btn"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-red-950/40 hover:border-red-500/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Bottom Floating Settings & Customizer Drawer */}
      <AnimatePresence>
        {!hideControls && (
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent backdrop-blur-md border-t border-white/10 space-y-4"
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Palette Theme Selector */}
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Color Theme</span>
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {NIGHTLIGHT_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      id={`nightlight-theme-${theme.id}`}
                      type="button"
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedTheme === theme.id
                          ? 'border-white bg-white/15 text-white shadow-md'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/30"
                        style={{ backgroundColor: theme.accentGlow }}
                      />
                      <span>{theme.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Pattern Selector */}
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Visual Pattern</span>
                </span>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'halo', label: 'Halo Orb', icon: Moon },
                    { id: 'stars', label: 'Starlight', icon: Sparkles },
                    { id: 'waves', label: 'Dream Waves', icon: Waves },
                    { id: 'candle', label: 'Candlelight', icon: Flame },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isPatternActive = selectedPattern === p.id;
                    return (
                      <button
                        key={p.id}
                        id={`nightlight-pattern-${p.id}`}
                        type="button"
                        onClick={() => setSelectedPattern(p.id as VisualPatternId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isPatternActive
                            ? 'border-indigo-400 bg-indigo-950/70 text-indigo-200'
                            : 'border-white/10 bg-black/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sleep Timer Preset */}
              <div className="flex flex-col gap-1.5 w-full md:w-auto">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-300" />
                  <span>Sleep Timer</span>
                  {remainingSeconds > 0 && (
                    <span className="text-amber-300 font-mono font-bold text-[10px]">
                      ({Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s)
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { mins: 0, label: 'Off' },
                    { mins: 15, label: '15m' },
                    { mins: 30, label: '30m' },
                    { mins: 45, label: '45m' },
                    { mins: 60, label: '60m' },
                  ].map((t) => (
                    <button
                      key={t.mins}
                      id={`nightlight-timer-${t.mins}`}
                      type="button"
                      onClick={() => setTimerMinutes(t.mins)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        timerMinutes === t.mins
                          ? 'border-sky-400 bg-sky-950/70 text-sky-200'
                          : 'border-white/10 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Fine Tuning Sliders Bar: Sensitivity & Audio Companion */}
            <div className="max-w-4xl mx-auto pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
              
              {/* Mic Sensitivity Slider */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Mic Sensitivity:</span>
                <input
                  type="range"
                  id="nightlight-sensitivity-slider"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-24 accent-indigo-400 cursor-pointer"
                />
                <span className="font-mono text-[11px] text-indigo-300 font-bold">{sensitivity.toFixed(1)}x</span>
              </div>

              {/* Minimum & Peak Brightness Bounds */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Glow Range:</span>
                <input
                  type="range"
                  id="nightlight-min-bright-slider"
                  min="0.1"
                  max="0.4"
                  step="0.05"
                  value={minBrightness}
                  onChange={(e) => setMinBrightness(parseFloat(e.target.value))}
                  className="w-20 accent-amber-400 cursor-pointer"
                  title="Darkest baseline glow"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="range"
                  id="nightlight-max-bright-slider"
                  min="0.6"
                  max="1.0"
                  step="0.05"
                  value={maxBrightness}
                  onChange={(e) => setMaxBrightness(parseFloat(e.target.value))}
                  className="w-20 accent-amber-400 cursor-pointer"
                  title="Peak sound reactive glow"
                />
              </div>

              {/* Ambient Audio Drone Companion */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Audio Drone:</span>
                <select
                  id="nightlight-audio-companion-select"
                  value={audioCompanion}
                  onChange={(e) => setAudioCompanion(e.target.value as 'none' | 'pinknoise' | 'lullabyChimes')}
                  className="bg-black/50 border border-white/15 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-indigo-400"
                >
                  <option value="none">Silent Night</option>
                  <option value="pinknoise">Pink Noise Drift</option>
                  <option value="lullabyChimes">432Hz Celestial Drone</option>
                </select>
                {audioCompanion !== 'none' && (
                  <input
                    type="range"
                    id="nightlight-synth-volume-slider"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={synthVolume}
                    onChange={(e) => setSynthVolume(parseFloat(e.target.value))}
                    className="w-16 accent-sky-400 cursor-pointer ml-1"
                    title="Audio Drone Volume"
                  />
                )}
              </div>

            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Floating Unhide Button when controls are hidden */}
      <AnimatePresence>
        {hideControls && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            whileHover={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setHideControls(false)}
            className="absolute bottom-6 right-6 z-40 p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-2xl flex items-center gap-2 text-xs"
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span className="text-[11px] font-medium">Show Controls</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
