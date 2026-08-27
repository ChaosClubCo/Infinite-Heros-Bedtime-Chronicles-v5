import React, { useState } from 'react';
import { AppSettings, AmbientSoundTrack } from '../types';
import { Moon, X, SunDim, Sparkles } from 'lucide-react';

export const AMBIENT_SOUND_TRACKS: { id: AmbientSoundTrack; name: string; description: string }[] = [
  { id: 'ocean', name: 'Ocean Waves', description: 'Gentle rhythmic shore waves' },
  { id: 'rain', name: 'Gentle Rain', description: 'Warm soothing rain on leaves' },
  { id: 'forest', name: 'Night Forest', description: 'Crickets & whispering breeze' },
  { id: 'wind', name: 'Starry Wind', description: 'Quiet celestial night breeze' },
  { id: 'lullaby', name: 'Lullaby Chimes', description: 'Soft sine chime melodies' },
  { id: 'whitenoise', name: 'Cosmic Drift', description: 'Warm pink noise blanket' },
  { id: 'none', name: 'Silent Night', description: 'No background audio' },
];

interface WindDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenNightlight?: () => void;
}

export const WindDownModal: React.FC<WindDownModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenNightlight,
}) => {
  const [selectedSound, setSelectedSound] = useState<AmbientSoundTrack>(settings.ambientSound);
  const [volume, setVolume] = useState<number>(settings.ambientVolume);
  const [minutes, setMinutes] = useState<number>(settings.sleepTimerMinutes);
  const [autoDim, setAutoDim] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      ambientSound: selectedSound,
      ambientVolume: volume,
      sleepTimerMinutes: minutes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0a081e] border border-indigo-900/60 shadow-2xl shadow-indigo-950/80 overflow-hidden text-slate-100 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-indigo-950 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-bold text-white">Wind Down Mode</h2>
              <p className="text-xs text-slate-400">Dim screens & gentle nature soundscapes</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Soundscape Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Choose Sleep Soundscape
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AMBIENT_SOUND_TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => setSelectedSound(track.id)}
                className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                  selectedSound === track.id
                    ? 'bg-indigo-950/90 border-amber-400/80 text-white shadow-md'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">{track.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{track.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sleep Timer Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Bedtime Horizon Timer</span>
            <span className="text-amber-300 font-mono font-bold">{minutes} minutes</span>
          </div>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-slate-900 accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Screen Dimming Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2.5">
            <SunDim className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Auto-Dimming Starlight Mode</div>
              <div className="text-[10px] text-slate-400">Softens contrast to protect melatonin before sleep</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAutoDim(!autoDim)}
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

        {/* Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Soundscape Volume</span>
            <span className="text-slate-400 font-mono">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-slate-900 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-indigo-950">
          <div>
            {onOpenNightlight && (
              <button
                type="button"
                id="wind-down-launch-nightlight-btn"
                onClick={() => {
                  onClose();
                  onOpenNightlight();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-500/30 hover:bg-amber-900/60 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Nightlight</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all"
            >
              Activate Wind Down
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
