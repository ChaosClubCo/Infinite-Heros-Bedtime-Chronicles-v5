import React, { useState } from 'react';
import { StoryVoiceProfile, VoiceProfileCategory } from '../types';
import {
  STORY_VOICE_PROFILES,
  VOICE_PROFILE_CATEGORIES,
  getVoiceProfileById,
} from '../data/voiceProfiles';
import { PRELOADED_NARRATORS, VoiceNarrator } from '../services/audioNarration';
import {
  Sliders,
  Volume2,
  VolumeX,
  Sparkles,
  Moon,
  Bot,
  Check,
  X,
  Gauge,
  Music,
  ShieldCheck,
  Play,
  Square,
  Flame,
  Info,
} from 'lucide-react';

interface VoiceProfilesSubMenuProps {
  isOpen: boolean;
  onClose: () => void;
  storyTitle: string;
  activeProfileId: string;
  onSelectProfile: (
    profile: StoryVoiceProfile,
    customPitch?: number,
    customRate?: number,
    whisperMode?: boolean
  ) => void;
  currentPitch?: number;
  currentRate?: number;
  whisperModeActive?: boolean;
  onSaveAsDefault?: (profileId: string) => void;
}

export const VoiceProfilesSubMenu: React.FC<VoiceProfilesSubMenuProps> = ({
  isOpen,
  onClose,
  storyTitle,
  activeProfileId,
  onSelectProfile,
  currentPitch,
  currentRate,
  whisperModeActive = false,
  onSaveAsDefault,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VoiceProfileCategory | 'all'>('all');
  const [previewingProfileId, setPreviewingProfileId] = useState<string | null>(null);
  const [customPitch, setCustomPitch] = useState<number>(currentPitch ?? 1.0);
  const [customRate, setCustomRate] = useState<number>(currentRate ?? 0.88);
  const [whisperMode, setWhisperMode] = useState<boolean>(whisperModeActive);
  const [showSaveNotice, setShowSaveNotice] = useState<boolean>(false);
  const [savedDefaultNotice, setSavedDefaultNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const activeProfile = getVoiceProfileById(activeProfileId);

  const filteredProfiles = selectedCategory === 'all'
    ? STORY_VOICE_PROFILES
    : STORY_VOICE_PROFILES.filter((p) => p.category === selectedCategory);

  const handlePreview = (profile: StoryVoiceProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (previewingProfileId === profile.id) {
      VoiceNarrator.stop();
      setPreviewingProfileId(null);
      return;
    }

    VoiceNarrator.stop();
    setPreviewingProfileId(profile.id);

    const targetPitch = customPitch !== 1.0 ? customPitch : profile.defaultPitch;
    const targetRate = whisperMode ? Math.min(customRate, 0.82) : (customRate !== 0.88 ? customRate : profile.defaultRate);

    VoiceNarrator.speak(profile.samplePhrase, {
      voiceId: profile.defaultNarratorId,
      pitch: targetPitch,
      speedRate: targetRate,
      volume: whisperMode ? 0.75 : 0.95,
      onEnd: () => setPreviewingProfileId(null),
      onError: () => setPreviewingProfileId(null),
    });
  };

  const handleApplyProfile = (profile: StoryVoiceProfile) => {
    VoiceNarrator.stop();
    setPreviewingProfileId(null);
    setCustomPitch(profile.defaultPitch);
    setCustomRate(profile.defaultRate);
    onSelectProfile(profile, profile.defaultPitch, profile.defaultRate, whisperMode);
    setShowSaveNotice(true);
    setTimeout(() => setShowSaveNotice(false), 2500);
  };

  const handleApplyCustomTuning = () => {
    onSelectProfile(activeProfile, customPitch, customRate, whisperMode);
    setShowSaveNotice(true);
    setTimeout(() => setShowSaveNotice(false), 2000);
  };

  const handleSetDefault = () => {
    if (onSaveAsDefault) {
      onSaveAsDefault(activeProfile.id);
      setSavedDefaultNotice(true);
      setTimeout(() => setSavedDefaultNotice(false), 2500);
    }
  };

  return (
    <div
      id="voice-profiles-submenu-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-profiles-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in"
    >
      <div className="max-w-2xl w-full max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="voice-profiles-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Story Voice Profiles
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800/60 text-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Parent Controls
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                Active Story: <span className="text-indigo-200 font-medium">{storyTitle}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              VoiceNarrator.stop();
              onClose();
            }}
            id="close-voice-profiles-submenu-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close voice profiles menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
          {VOICE_PROFILE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`voice-category-tab-${cat.id}`}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-750'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Active Story Profile Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                {activeProfile.iconEmoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Current Bedtime Profile:</span>
                  <span className="text-xs font-extrabold text-indigo-300">{activeProfile.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {activeProfile.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => handlePreview(activeProfile, e)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  previewingProfileId === activeProfile.id
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                    : 'bg-indigo-900/60 border-indigo-700/80 text-indigo-200 hover:bg-indigo-800'
                }`}
                title="Preview active profile voice"
              >
                {previewingProfileId === activeProfile.id ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sample</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Profile Cards Grid */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                Select Voice Profile for This Story
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredProfiles.length} Profiles
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProfiles.map((profile) => {
                const isActive = activeProfileId === profile.id;
                const isPreviewing = previewingProfileId === profile.id;

                return (
                  <div
                    key={profile.id}
                    id={`voice-profile-card-${profile.id}`}
                    onClick={() => handleApplyProfile(profile)}
                    className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      isActive
                        ? `${profile.accentBg} ${profile.borderActive} shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-400/40`
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top row: Avatar + Name + Active badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                            {profile.iconEmoji}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                                {profile.name}
                              </h5>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-300">
                              {profile.categoryLabel}
                            </span>
                          </div>
                        </div>

                        {isActive ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-600/40 border border-indigo-400 text-indigo-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                            {profile.bedtimeSuitability === 'sleep' ? 'Bedtime Sleep' : profile.bedtimeSuitability === 'winddown' ? 'Wind-Down' : 'Animated'}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                        {profile.description}
                      </p>

                      {/* Sample phrase quote */}
                      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px] text-slate-400 italic mb-3">
                        &ldquo;{profile.samplePhrase}&rdquo;
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60 mt-auto">
                      <button
                        type="button"
                        id={`preview-profile-btn-${profile.id}`}
                        onClick={(e) => handlePreview(profile, e)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                          isPreviewing
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300 animate-pulse'
                            : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                        title="Listen to sample"
                      >
                        {isPreviewing ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-indigo-400" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyProfile(profile)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white'
                        }`}
                      >
                        {isActive ? 'Selected' : 'Use for Story'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Fine-Tuning & Bedtime Adjustments */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                Voice Fine-Tuning (Active Story)
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomPitch(activeProfile.defaultPitch);
                  setCustomRate(activeProfile.defaultRate);
                  setWhisperMode(false);
                  onSelectProfile(activeProfile, activeProfile.defaultPitch, activeProfile.defaultRate, false);
                }}
                className="text-[10px] text-slate-400 hover:text-indigo-300 underline font-medium"
              >
                Reset to Profile Defaults
              </button>
            </div>

            {/* Reading Speed / Tempo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Narration Cadence & Pace</span>
                <span className="text-indigo-300 font-mono font-bold">{customRate.toFixed(2)}x</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Sleepy (0.80x)', val: 0.8 },
                  { label: 'Gentle (0.88x)', val: 0.88 },
                  { label: 'Animated (1.05x)', val: 1.05 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCustomRate(preset.val);
                      onSelectProfile(activeProfile, customPitch, preset.val, whisperMode);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                      Math.abs(customRate - preset.val) < 0.04
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Pitch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Pitch & Character Tone</span>
                <span className="text-indigo-300 font-mono font-bold">{customPitch.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Deeper Baritone (0.85)', val: 0.85 },
                  { label: 'Balanced (1.00)', val: 1.0 },
                  { label: 'Higher / Playful (1.18)', val: 1.18 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCustomPitch(preset.val);
                      onSelectProfile(activeProfile, preset.val, customRate, whisperMode);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                      Math.abs(customPitch - preset.val) < 0.04
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Whisper Mode Toggle */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-300">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>Bedtime Whisper Mode</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 font-semibold border border-purple-800/40">
                      Sleep Softener
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Reduces volume peaks and adds comforting micro-pauses between sentences.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  id="whisper-mode-toggle"
                  checked={whisperMode}
                  onChange={(e) => {
                    const active = e.target.checked;
                    setWhisperMode(active);
                    onSelectProfile(activeProfile, customPitch, customRate, active);
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {showSaveNotice && (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                Applied to &ldquo;{storyTitle}&rdquo;!
              </span>
            )}
            {savedDefaultNotice && (
              <span className="text-purple-300 flex items-center gap-1 font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                Saved as default voice profile!
              </span>
            )}
            {!showSaveNotice && !savedDefaultNotice && (
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                Settings apply instantly to current narration.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onSaveAsDefault && (
              <button
                type="button"
                id="save-voice-as-default-btn"
                onClick={handleSetDefault}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                title="Save this voice profile as default for all bedtime stories"
              >
                Set as Default
              </button>
            )}

            <button
              type="button"
              id="confirm-voice-profile-btn"
              onClick={() => {
                VoiceNarrator.stop();
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
