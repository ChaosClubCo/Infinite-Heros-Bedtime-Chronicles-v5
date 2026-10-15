import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppSettings, AmbientSoundTrack, VisualizerColorTheme } from '../types';
import {
  Moon,
  X,
  SunDim,
  Volume2,
  Volume1,
  VolumeX,
  Play,
  Pause,
  Square,
  Sliders,
  Waves,
  Sparkles,
  Palette,
  Check,
  Wind,
  Clock,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { ambientSoundEngine } from '../services/audioNarration';
import { WindDownAudioVisualizer } from './WindDownAudioVisualizer';
import { VISUALIZER_COLOR_THEMES, getVisualizerThemeById } from '../data/visualizerThemes';

export const AMBIENT_SOUND_TRACKS: { id: AmbientSoundTrack; name: string; description: string }[] = [
  { id: 'ocean', name: 'Ocean Waves', description: 'Gentle rhythmic shore waves (ocean.wav)' },
  { id: 'rain', name: 'Gentle Rain', description: 'Warm soothing rain on leaves (rain.wav)' },
  { id: 'wind', name: 'Starry Wind', description: 'Quiet celestial night breeze (wind.wav)' },
  { id: 'crickets', name: 'Night Crickets', description: 'Gentle meadow lullaby (crickets.wav)' },
  { id: 'fire', name: 'Cozy Hearth', description: 'Warm comforting embers (fire.wav)' },
  { id: 'sleep', name: 'Sleep Lullaby', description: 'Dreamy ambient sleep music (sleep.mp3)' },
  { id: 'classic', name: 'Classic Theme', description: 'Celestial adventure harp (classic.mp3)' },
  { id: 'madlibs', name: 'Mad Libs Melody', description: 'Playful pizzicato music box (madlibs.mp3)' },
  { id: 'forest', name: 'Night Forest', description: 'Crickets & whispering breeze' },
  { id: 'lullaby', name: 'Lullaby Chimes', description: 'Soft sine chime melodies' },
  { id: 'whitenoise', name: 'Cosmic Drift', description: 'Warm pink noise blanket' },
  { id: 'train', name: 'Starlight Express', description: 'Distant gentle rhythm' },
  { id: 'none', name: 'Silent Night', description: 'No background audio' },
];

const VOLUME_PRESETS = [
  { label: 'Mute', value: 0 },
  { label: 'Whisper', value: 0.15 },
  { label: 'Cozy', value: 0.35 },
  { label: 'Balanced', value: 0.6 },
  { label: 'Deep', value: 0.85 },
];

const AUTO_FADE_PRESETS = [
  { label: '15s', seconds: 15 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
];

function formatFadeDurationLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return remSecs === 0 ? `${mins} min${mins > 1 ? 's' : ''} (${seconds}s)` : `${mins}m ${remSecs}s`;
}

interface WindDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenGuidedBreathing?: () => void;
}

export const WindDownModal: React.FC<WindDownModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenGuidedBreathing,
}) => {
  const [selectedSound, setSelectedSound] = useState<AmbientSoundTrack>(settings.ambientSound || 'ocean');
  const [volume, setVolume] = useState<number>(settings.ambientVolume ?? 0.35);
  const [previousNonZeroVolume, setPreviousNonZeroVolume] = useState<number>(settings.ambientVolume > 0 ? settings.ambientVolume : 0.35);
  const [colorTheme, setColorTheme] = useState<VisualizerColorTheme>(settings.visualizerColorTheme || 'soundscape');
  const [minutes, setMinutes] = useState<number>(settings.sleepTimerMinutes || 20);
  const [remainingSeconds, setRemainingSeconds] = useState<number>((settings.sleepTimerMinutes || 20) * 60);
  const [totalCountdownSeconds, setTotalCountdownSeconds] = useState<number>((settings.sleepTimerMinutes || 20) * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [gradualFadeOut, setGradualFadeOut] = useState<boolean>(settings.autoFadeToAmbient ?? true);
  const [fadeDurationSeconds, setFadeDurationSeconds] = useState<number>(settings.autoFadeDurationSeconds ?? 60);
  const [autoDim, setAutoDim] = useState<boolean>(true);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  // Synchronize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSound(settings.ambientSound || 'ocean');
      const initialVol = settings.ambientVolume ?? 0.35;
      setVolume(initialVol);
      if (initialVol > 0) {
        setPreviousNonZeroVolume(initialVol);
      }
      setColorTheme(settings.visualizerColorTheme || 'soundscape');
      const initMins = settings.sleepTimerMinutes || 20;
      setMinutes(initMins);
      setRemainingSeconds(initMins * 60);
      setTotalCountdownSeconds(initMins * 60);
      setGradualFadeOut(settings.autoFadeToAmbient ?? true);
      setFadeDurationSeconds(settings.autoFadeDurationSeconds ?? 60);
      setIsTimerRunning(false);
      setIsPreviewPlaying(false);
    } else {
      // Ensure audio preview and timer are stopped when modal closes
      ambientSoundEngine.stopAmbient();
      setIsPreviewPlaying(false);
      setIsTimerRunning(false);
    }
  }, [isOpen, settings]);

  const handleStopPreview = useCallback(() => {
    ambientSoundEngine.stopAmbient();
    setIsPreviewPlaying(false);
    setIsTimerRunning(false);
  }, []);

  // Effective fade window in seconds (capped at total countdown duration)
  const effectiveFadeWindowSeconds = useMemo(() => {
    return Math.min(fadeDurationSeconds, Math.max(15, totalCountdownSeconds));
  }, [fadeDurationSeconds, totalCountdownSeconds]);

  // Live 1-second countdown interval for active ambient soundscape
  useEffect(() => {
    if (!isOpen || !isTimerRunning || selectedSound === 'none') return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          ambientSoundEngine.stopAmbient();
          setIsPreviewPlaying(false);
          setIsTimerRunning(false);
          return 0;
        }
        const next = prev - 1;
        // Apply gentle volume fade-out during the configured Auto-Fade window
        if (gradualFadeOut && isPreviewPlaying && volume > 0) {
          if (next <= effectiveFadeWindowSeconds) {
            const fadeFactor = Math.max(0.03, next / effectiveFadeWindowSeconds);
            ambientSoundEngine.setVolume(volume * fadeFactor);
          }
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning, selectedSound, gradualFadeOut, isPreviewPlaying, volume, effectiveFadeWindowSeconds]);

  // Update live audio volume if preview is currently playing
  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.min(Math.max(newVolume, 0), 1);
    setVolume(clamped);
    if (clamped > 0) {
      setPreviousNonZeroVolume(clamped);
      if (selectedSound === 'none') {
        setSelectedSound('ocean');
      }
    }
    if (isPreviewPlaying) {
      if (clamped === 0) {
        ambientSoundEngine.stopAmbient();
      } else {
        ambientSoundEngine.setVolume(clamped);
      }
    }
  };

  const handleToggleMute = () => {
    if (volume > 0) {
      setPreviousNonZeroVolume(volume);
      setVolume(0);
      if (isPreviewPlaying) {
        ambientSoundEngine.stopAmbient();
      }
    } else {
      const restored = previousNonZeroVolume > 0 ? previousNonZeroVolume : 0.35;
      setVolume(restored);
      if (selectedSound === 'none') {
        setSelectedSound('ocean');
      }
      if (isPreviewPlaying) {
        const soundToPlay = selectedSound === 'none' ? 'ocean' : selectedSound;
        ambientSoundEngine.playAmbient(soundToPlay, restored);
      }
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewPlaying) {
      handleStopPreview();
    } else {
      if (selectedSound === 'none') {
        setSelectedSound('ocean');
      }
      const activeSound = selectedSound === 'none' ? 'ocean' : selectedSound;
      const activeVolume = volume === 0 ? 0.35 : volume;
      if (volume === 0) {
        setVolume(0.35);
      }
      if (remainingSeconds <= 0) {
        setRemainingSeconds(minutes * 60);
        setTotalCountdownSeconds(minutes * 60);
      }
      ambientSoundEngine.playAmbient(activeSound, activeVolume);
      setIsPreviewPlaying(true);
      setIsTimerRunning(true);
    }
  };

  const handleSelectSound = (soundId: AmbientSoundTrack) => {
    setSelectedSound(soundId);
    if (soundId === 'none') {
      if (isPreviewPlaying) {
        handleStopPreview();
      }
    } else if (isPreviewPlaying) {
      ambientSoundEngine.playAmbient(soundId, volume > 0 ? volume : 0.35);
      setIsTimerRunning(true);
    }
  };

  const handleDurationChange = (newMinutes: number) => {
    const clamped = Math.min(Math.max(newMinutes, 5), 90);
    setMinutes(clamped);
    setRemainingSeconds(clamped * 60);
    setTotalCountdownSeconds(clamped * 60);
    if (isPreviewPlaying && volume > 0) {
      ambientSoundEngine.setVolume(volume);
    }
  };

  const handleAddCountdownMinutes = (extraMins: number) => {
    const addedSeconds = extraMins * 60;
    setRemainingSeconds((prev) => {
      const next = prev + addedSeconds;
      setTotalCountdownSeconds((tot) => Math.max(tot + addedSeconds, next));
      setMinutes(Math.min(90, Math.ceil(next / 60)));
      return next;
    });
    if (isPreviewPlaying && volume > 0) {
      ambientSoundEngine.setVolume(volume);
    }
  };

  const handleResetCountdown = () => {
    const resetSecs = minutes * 60;
    setRemainingSeconds(resetSecs);
    setTotalCountdownSeconds(resetSecs);
    if (isPreviewPlaying && volume > 0) {
      ambientSoundEngine.setVolume(volume);
    }
  };

  const handleToggleCountdownRunning = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      ambientSoundEngine.stopAmbient();
      setIsPreviewPlaying(false);
    } else {
      if (selectedSound === 'none') {
        setSelectedSound('ocean');
      }
      const soundToPlay = selectedSound === 'none' ? 'ocean' : selectedSound;
      const volToPlay = volume === 0 ? 0.35 : volume;
      if (volume === 0) {
        setVolume(0.35);
      }
      if (remainingSeconds <= 0) {
        setRemainingSeconds(minutes * 60);
        setTotalCountdownSeconds(minutes * 60);
      }
      ambientSoundEngine.playAmbient(soundToPlay, volToPlay);
      setIsPreviewPlaying(true);
      setIsTimerRunning(true);
    }
  };

  const handleClose = () => {
    handleStopPreview();
    onClose();
  };

  const handleSave = () => {
    handleStopPreview();
    onSaveSettings({
      ...settings,
      ambientSound: selectedSound,
      ambientVolume: volume,
      sleepTimerMinutes: minutes,
      visualizerColorTheme: colorTheme,
      autoFadeToAmbient: gradualFadeOut,
      autoFadeDurationSeconds: fadeDurationSeconds,
    });
    onClose();
  };

  const formattedRemainingTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const countdownProgressPercent = useMemo(() => {
    if (totalCountdownSeconds <= 0) return 0;
    return Math.min(100, Math.max(0, (remainingSeconds / totalCountdownSeconds) * 100));
  }, [remainingSeconds, totalCountdownSeconds]);

  const projectedEndTimeLabel = useMemo(() => {
    if (selectedSound === 'none' || remainingSeconds <= 0) return 'Off';
    const endDate = new Date(Date.now() + remainingSeconds * 1000);
    return endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [selectedSound, remainingSeconds]);

  if (!isOpen) return null;

  const isMuted = volume === 0 || selectedSound === 'none';
  const activeThemeOption = getVisualizerThemeById(colorTheme);
  const activeSoundTrackInfo = AMBIENT_SOUND_TRACKS.find((t) => t.id === selectedSound) || AMBIENT_SOUND_TRACKS[0];
  const isFadingOutNow =
    isTimerRunning &&
    gradualFadeOut &&
    remainingSeconds > 0 &&
    remainingSeconds <= effectiveFadeWindowSeconds;
  const fadeZonePercent =
    totalCountdownSeconds > 0
      ? Math.min(100, Math.max(4, (effectiveFadeWindowSeconds / totalCountdownSeconds) * 100))
      : 10;

  return (
    <div
      id="wind-down-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wind-down-modal-title"
    >
      <div
        id="wind-down-modal-card"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a081e] border border-indigo-900/60 shadow-2xl shadow-indigo-950/80 text-slate-100 p-5 sm:p-6 space-y-5 custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950/80 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300 shadow-inner">
              <Moon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 id="wind-down-modal-title" className="text-lg sm:text-xl font-playfair font-bold text-white flex items-center gap-2">
                Wind Down Mode
              </h2>
              <p className="text-xs text-slate-400">Dim screens & soothing ambient soundscapes</p>
            </div>
          </div>

          <button
            id="wind-down-close-btn"
            onClick={handleClose}
            aria-label="Close wind down settings"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Soundscape Selection */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
              Choose Sleep Soundscape
            </label>
            <span className="text-[11px] text-indigo-300/80 font-medium">
              {AMBIENT_SOUND_TRACKS.find((t) => t.id === selectedSound)?.name || 'Ocean Waves'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
            {AMBIENT_SOUND_TRACKS.map((track) => {
              const isSelected = selectedSound === track.id;
              return (
                <button
                  key={track.id}
                  id={`soundscape-option-${track.id}`}
                  type="button"
                  onClick={() => handleSelectSound(track.id)}
                  className={`p-2.5 rounded-2xl border text-xs text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-950/90 border-amber-400/80 text-white shadow-md ring-1 ring-amber-400/40'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  <div className="font-bold truncate pr-2">{track.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{track.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Interactive Audio Visualizer */}
        <WindDownAudioVisualizer
          ambientSound={selectedSound}
          ambientVolume={isMuted ? 0 : volume}
          colorTheme={colorTheme}
          isPreviewPlaying={isPreviewPlaying}
          onTogglePreview={handleTogglePreview}
          onVolumeChange={handleVolumeChange}
          remainingSeconds={remainingSeconds}
          totalSeconds={totalCountdownSeconds}
          isTimerRunning={isTimerRunning}
        />

        {/* Ambient Glow / Color Theme Selector */}
        <div
          id="wind-down-color-theme-section"
          className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-2.5 shadow-inner"
        >
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {settings.childName
                  ? `${settings.childName}'s Ambient Glow Color`
                  : 'Ambient Glow Color Theme'}
              </span>
            </label>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/80 border border-indigo-700/40 text-[11px]">
              <span>{activeThemeOption.emoji}</span>
              <span className="font-semibold text-amber-300">{activeThemeOption.name}</span>
            </div>
          </div>

          <p className="text-[10.5px] text-indigo-200/70">
            Personalize the visualizer nightlight glow and starlight aura to your favorite color
          </p>

          {/* Color Swatches Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 pt-0.5">
            {VISUALIZER_COLOR_THEMES.map((theme) => {
              const isSelected = colorTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  id={`color-theme-${theme.id}`}
                  type="button"
                  onClick={() => setColorTheme(theme.id)}
                  title={`${theme.name}: ${theme.description}`}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-indigo-900/80 border-amber-400 text-white shadow-md ring-1 ring-amber-400/50 scale-[1.02]'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Glowing Color Dot / Swatch Preview */}
                  <div
                    className={`w-5 h-5 rounded-full mb-1 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${theme.badgeBg}`}
                    style={{
                      boxShadow: isSelected ? `0 0 10px ${theme.primaryColor}` : 'none',
                    }}
                  >
                    {isSelected ? (
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    ) : (
                      <span className="text-[9px]">{theme.emoji}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                    {theme.id === 'soundscape' ? 'Auto Aura' : theme.name.replace('Cosmic ', '').replace('Dreamy ', '').replace('Magic ', '').replace('Rose ', '').replace('Cozy ', '').replace('Moonlit ', '')}
                  </span>
                  <span className="text-[8.5px] text-slate-400 truncate max-w-full leading-tight mt-0.5">
                    {theme.colorName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Ambient Volume Slider Container */}
        <div
          id="wind-down-ambient-volume-panel"
          className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-3 shadow-inner"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                id="wind-down-volume-mute-toggle"
                type="button"
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
                aria-label={isMuted ? 'Unmute Ambient Sound' : 'Mute Ambient Sound'}
                className="p-1.5 rounded-xl bg-slate-900/80 border border-indigo-700/40 text-slate-300 hover:text-white hover:border-indigo-500 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.4 ? (
                  <Volume1 className="w-4 h-4 text-amber-300" />
                ) : (
                  <Volume2 className="w-4 h-4 text-indigo-300" />
                )}
              </button>
              <div>
                <label
                  htmlFor="winddown-ambient-volume-slider"
                  className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Ambient Sounds Volume
                </label>
                <div className="text-[10px] text-indigo-200/70 font-medium">
                  Independent of narrator voice volume
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Preview Button */}
              {selectedSound !== 'none' && (
                <button
                  id="wind-down-sound-preview-btn"
                  type="button"
                  onClick={handleTogglePreview}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    isPreviewPlaying
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm shadow-amber-400/30'
                      : 'bg-slate-900/90 text-indigo-300 border-indigo-700/50 hover:bg-indigo-900/60'
                  }`}
                  title={isPreviewPlaying ? 'Stop audio preview' : 'Test soundscape at this volume'}
                >
                  {isPreviewPlaying ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>Test Audio</span>
                    </>
                  )}
                </button>
              )}

              {/* Volume Percentage Badge */}
              <span
                id="wind-down-volume-badge"
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${
                  isMuted
                    ? 'bg-rose-950/50 border-rose-800/50 text-rose-300'
                    : 'bg-indigo-900/70 border-indigo-600/50 text-amber-300 shadow-sm'
                }`}
              >
                {isMuted ? 'Muted' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="space-y-1.5">
            <input
              id="winddown-ambient-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted && selectedSound === 'none' ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              aria-label="Ambient background sound volume slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              aria-valuetext={`${Math.round(volume * 100)} percent intensity`}
              className="w-full h-2.5 rounded-lg bg-slate-900 appearance-none cursor-pointer accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all"
              style={{
                background: `linear-gradient(to right, #818cf8 0%, #fbbf24 ${Math.round(
                  volume * 100
                )}%, #1e1b4b ${Math.round(volume * 100)}%, #1e1b4b 100%)`,
              }}
            />

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
              <span>0% (Silent)</span>
              <span>50%</span>
              <span>100% (Full)</span>
            </div>
          </div>

          {/* Quick Bedtime Presets */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Bedtime Intensity:
            </span>
            <div className="flex items-center gap-1">
              {VOLUME_PRESETS.map((preset) => {
                const isActive =
                  preset.value === 0
                    ? volume === 0 || selectedSound === 'none'
                    : Math.abs(volume - preset.value) < 0.05 && selectedSound !== 'none';
                return (
                  <button
                    key={preset.label}
                    id={`volume-preset-${preset.label.toLowerCase()}`}
                    type="button"
                    onClick={() => handleVolumeChange(preset.value)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual Countdown Timer for Active Ambient Soundscape */}
        <div
          id="winddown-visual-countdown-card"
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-purple-950/40 border border-indigo-700/50 space-y-4 shadow-xl"
        >
          {/* Top Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Clock className={`w-4 h-4 ${isTimerRunning ? 'animate-pulse text-amber-400' : 'text-amber-300'}`} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Soundscape Playback Countdown</span>
                  {isTimerRunning && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ACTIVE
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-indigo-200/75">
                  {selectedSound === 'none'
                    ? 'Select a soundscape above to start the sleep timer'
                    : `Playing ${activeSoundTrackInfo.name} • Auto-stops at ${projectedEndTimeLabel}`}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-amber-400/30">
              {minutes} min
            </span>
          </div>

          {/* Center Visual Ring + Countdown Readout & Quick Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-900/60">
            {/* Circular SVG Progress Ring + Digital Readout */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="33"
                    fill="transparent"
                    stroke="rgba(30, 27, 75, 0.9)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="33"
                    fill="transparent"
                    stroke={isFadingOutNow ? '#f59e0b' : isTimerRunning ? '#fbbf24' : '#818cf8'}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 33}
                    strokeDashoffset={
                      2 * Math.PI * 33 * (1 - (selectedSound === 'none' ? 0 : countdownProgressPercent / 100))
                    }
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span
                    id="winddown-countdown-digital-readout"
                    className="text-sm font-mono font-extrabold text-white tracking-tight"
                  >
                    {selectedSound === 'none' ? '00:00' : formattedRemainingTime}
                  </span>
                  <span className="text-[8.5px] uppercase tracking-wider font-semibold text-indigo-300/90">
                    {isFadingOutNow
                      ? 'Fading'
                      : isTimerRunning
                      ? 'Left'
                      : remainingSeconds === 0
                      ? 'Done'
                      : 'Ready'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <span>{activeSoundTrackInfo.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedSound === 'none' ? (
                    'Silent Night mode selected'
                  ) : isFadingOutNow ? (
                    <span className="text-amber-300 font-medium">
                      Gently fading volume to sleep...
                    </span>
                  ) : isTimerRunning ? (
                    <span>
                      Calming audio will play for{' '}
                      <strong className="text-amber-300 font-mono">{formattedRemainingTime}</strong>
                    </span>
                  ) : (
                    <span>
                      Configured for <strong className="text-indigo-300">{minutes} minutes</strong> of calm
                    </span>
                  )}
                </div>
                {selectedSound !== 'none' && (
                  <div className="text-[10px] text-indigo-300/80 flex items-center gap-2 pt-0.5">
                    <span> End time: <strong className="text-white">{projectedEndTimeLabel}</strong></span>
                    <span>•</span>
                    <span>{Math.round(countdownProgressPercent)}% remaining</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Timer Action Buttons */}
            <div className="flex items-center gap-1.5 self-stretch sm:self-center justify-end">
              <button
                id="winddown-countdown-start-pause-btn"
                type="button"
                onClick={handleToggleCountdownRunning}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                }`}
                title={isTimerRunning ? 'Pause countdown & soundscape' : 'Start soundscape with countdown timer'}
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer</span>
                  </>
                )}
              </button>

              <button
                id="winddown-countdown-add-5m-btn"
                type="button"
                onClick={() => handleAddCountdownMinutes(5)}
                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-200 hover:text-white border border-indigo-800/60 text-[11px] font-bold transition-colors flex items-center gap-0.5"
                title="Add 5 minutes to playback timer"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>5m</span>
              </button>

              <button
                id="winddown-countdown-reset-btn"
                type="button"
                onClick={handleResetCountdown}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Reset countdown to full duration"
                aria-label="Reset countdown timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Linear Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-slate-950 border border-indigo-950 overflow-hidden p-0.5">
              <div
                id="winddown-countdown-progress-bar"
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${selectedSound === 'none' ? 0 : countdownProgressPercent}%`,
                  background: isFadingOutNow
                    ? 'linear-gradient(to right, #f59e0b, #fb7185)'
                    : 'linear-gradient(to right, #6366f1, #a855f7, #fbbf24)',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>0 min</span>
              <span className="text-indigo-300 font-medium">
                {isTimerRunning
                  ? `Playing "${activeSoundTrackInfo.name}" — ${formattedRemainingTime} left`
                  : `Set duration below (${minutes} min)`}
              </span>
              <span>{minutes} min</span>
            </div>
          </div>

          {/* Quick Duration Preset Buttons */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Duration Presets:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {[5, 10, 15, 20, 30, 45, 60].map((presetMin) => {
                const isSelectedPreset = minutes === presetMin;
                return (
                  <button
                    key={presetMin}
                    id={`winddown-duration-preset-${presetMin}`}
                    type="button"
                    onClick={() => handleDurationChange(presetMin)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                      isSelectedPreset
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {presetMin}m
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fine-grained Sleep Timer Slider */}
          <div className="space-y-1.5 pt-1">
            <input
              id="winddown-timer-slider"
              type="range"
              min={5}
              max={60}
              step={5}
              value={minutes > 60 ? 60 : minutes}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              aria-label="Bedtime sleep timer minutes"
              className="w-full h-2 rounded-lg bg-slate-950 accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Dedicated Auto-Fade Toggle & Duration Slider Card */}
          <div
            id="winddown-autofade-controls-panel"
            className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
              gradualFadeOut
                ? 'bg-indigo-950/50 border-indigo-700/60 shadow-inner'
                : 'bg-slate-950/50 border-slate-800/80 opacity-85'
            }`}
          >
            {/* Header Row with Toggle Switch */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-colors ${
                    gradualFadeOut
                      ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Auto-Fade Out Duration</span>
                    <span
                      id="winddown-autofade-duration-badge"
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        gradualFadeOut
                          ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {gradualFadeOut ? formatFadeDurationLabel(fadeDurationSeconds) : 'Off'}
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-200/70">
                    {gradualFadeOut
                      ? `Gently lowers ambient volume over the final ${formatFadeDurationLabel(
                          effectiveFadeWindowSeconds
                        )} before stopping`
                      : 'Soundscape stops immediately when sleep timer reaches 00:00'}
                  </p>
                </div>
              </div>

              <button
                id="winddown-gradual-fade-toggle"
                type="button"
                role="switch"
                aria-checked={gradualFadeOut}
                aria-label="Toggle gradual auto-fade out"
                onClick={() => {
                  const next = !gradualFadeOut;
                  setGradualFadeOut(next);
                  if (!next && isPreviewPlaying && volume > 0) {
                    ambientSoundEngine.setVolume(volume);
                  }
                }}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  gradualFadeOut ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    gradualFadeOut ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Fade Duration Slider & Presets (visible when Auto-Fade is enabled) */}
            {gradualFadeOut && (
              <div className="space-y-2.5 pt-1 border-t border-indigo-900/40 animate-fadeIn">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <label
                      htmlFor="winddown-autofade-duration-slider"
                      className="font-semibold text-indigo-200 cursor-pointer"
                    >
                      Customize Fade-Out Window
                    </label>
                    <span className="font-mono text-amber-300 font-bold">
                      {fadeDurationSeconds} seconds ({Math.round(fadeZonePercent)}% of timer)
                    </span>
                  </div>

                  <input
                    id="winddown-autofade-duration-slider"
                    type="range"
                    min={15}
                    max={300}
                    step={15}
                    value={fadeDurationSeconds}
                    onChange={(e) => setFadeDurationSeconds(Number(e.target.value))}
                    aria-label="Auto-Fade duration in seconds"
                    aria-valuemin={15}
                    aria-valuemax={300}
                    aria-valuenow={fadeDurationSeconds}
                    aria-valuetext={formatFadeDurationLabel(fadeDurationSeconds)}
                    className="w-full h-2 rounded-lg bg-slate-950 appearance-none cursor-pointer accent-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    style={{
                      background: `linear-gradient(to right, #818cf8 0%, #fbbf24 ${Math.round(
                        ((fadeDurationSeconds - 15) / (300 - 15)) * 100
                      )}%, #0f172a ${Math.round(
                        ((fadeDurationSeconds - 15) / (300 - 15)) * 100
                      )}%, #0f172a 100%)`,
                    }}
                  />

                  <div className="flex items-center justify-between text-[9.5px] text-slate-400 px-0.5">
                    <span>15s (Quick Fade)</span>
                    <span>2m 30s (Medium)</span>
                    <span>5m (Gradual Drift)</span>
                  </div>
                </div>

                {/* Quick Auto-Fade Duration Presets */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                    Fade Speed:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {AUTO_FADE_PRESETS.map((preset) => {
                      const isSelected = fadeDurationSeconds === preset.seconds;
                      return (
                        <button
                          key={preset.seconds}
                          id={`winddown-autofade-preset-${preset.seconds}`}
                          type="button"
                          onClick={() => setFadeDurationSeconds(preset.seconds)}
                          className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Screen Dimming Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <SunDim className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Auto-Dimming Starlight Mode</div>
              <div className="text-[10px] text-slate-400">Softens contrast to protect melatonin before sleep</div>
            </div>
          </div>
          <button
            id="winddown-auto-dim-toggle"
            type="button"
            onClick={() => setAutoDim(!autoDim)}
            aria-label="Toggle auto-dimming starlight mode"
            className={`w-11 h-6 rounded-full transition-colors relative ${
              autoDim ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                autoDim ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-indigo-950/80">
          {onOpenGuidedBreathing ? (
            <button
              id="winddown-guided-breathing-btn"
              type="button"
              onClick={() => {
                handleClose();
                onOpenGuidedBreathing();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/40 transition-colors"
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Guided Breathing Orb</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            <button
              id="winddown-cancel-btn"
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              id="winddown-save-btn"
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all active:scale-95"
            >
              Activate Wind Down
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

