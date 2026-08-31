import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings, AmbientSoundTrack, VisualizerColorTheme } from '../types';
import { Moon, X, SunDim, Volume2, Volume1, VolumeX, Play, Square, Sliders, Waves, Sparkles, Palette, Check } from 'lucide-react';
import { ambientSoundEngine } from '../services/audioNarration';
import { WindDownAudioVisualizer } from './WindDownAudioVisualizer';
import { VISUALIZER_COLOR_THEMES, getVisualizerThemeById } from '../data/visualizerThemes';

export const AMBIENT_SOUND_TRACKS: { id: AmbientSoundTrack; name: string; description: string }[] = [
  { id: 'ocean', name: 'Ocean Waves', description: 'Gentle rhythmic shore waves' },
  { id: 'rain', name: 'Gentle Rain', description: 'Warm soothing rain on leaves' },
  { id: 'forest', name: 'Night Forest', description: 'Crickets & whispering breeze' },
  { id: 'wind', name: 'Starry Wind', description: 'Quiet celestial night breeze' },
  { id: 'lullaby', name: 'Lullaby Chimes', description: 'Soft sine chime melodies' },
  { id: 'whitenoise', name: 'Cosmic Drift', description: 'Warm pink noise blanket' },
  { id: 'crickets', name: 'Night Crickets', description: 'Gentle meadow lullaby' },
  { id: 'fire', name: 'Cozy Hearth', description: 'Warm comforting embers' },
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

interface WindDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const WindDownModal: React.FC<WindDownModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [selectedSound, setSelectedSound] = useState<AmbientSoundTrack>(settings.ambientSound || 'ocean');
  const [volume, setVolume] = useState<number>(settings.ambientVolume ?? 0.35);
  const [previousNonZeroVolume, setPreviousNonZeroVolume] = useState<number>(settings.ambientVolume > 0 ? settings.ambientVolume : 0.35);
  const [colorTheme, setColorTheme] = useState<VisualizerColorTheme>(settings.visualizerColorTheme || 'soundscape');
  const [minutes, setMinutes] = useState<number>(settings.sleepTimerMinutes || 20);
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
      setMinutes(settings.sleepTimerMinutes || 20);
      setIsPreviewPlaying(false);
    } else {
      // Ensure audio preview is stopped when modal closes
      ambientSoundEngine.stopAmbient();
      setIsPreviewPlaying(false);
    }
  }, [isOpen, settings]);

  const handleStopPreview = useCallback(() => {
    ambientSoundEngine.stopAmbient();
    setIsPreviewPlaying(false);
  }, []);

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
      ambientSoundEngine.playAmbient(activeSound, activeVolume);
      setIsPreviewPlaying(true);
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
    });
    onClose();
  };

  if (!isOpen) return null;

  const isMuted = volume === 0 || selectedSound === 'none';
  const activeThemeOption = getVisualizerThemeById(colorTheme);

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

        {/* Sleep Timer Slider */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Bedtime Horizon Timer
            </span>
            <span className="text-amber-300 font-mono font-bold">{minutes} minutes</span>
          </div>
          <input
            id="winddown-timer-slider"
            type="range"
            min={5}
            max={60}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            aria-label="Bedtime sleep timer minutes"
            className="w-full h-2 rounded-lg bg-slate-950 accent-amber-400 cursor-pointer"
          />
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
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-950/80">
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
  );
};

