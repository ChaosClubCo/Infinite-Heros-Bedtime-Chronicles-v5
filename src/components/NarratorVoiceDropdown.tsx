import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  Volume2,
  Square,
  Check,
  Sparkles,
  Music,
} from 'lucide-react';
import { VoiceNarrator } from '../services/audioNarration';

export interface NarratorVoiceOption {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  iconEmoji: string;
  badge: string;
  narratorId: string;
  samplePhrase: string;
  color: string;
  borderColor: string;
  bgActive: string;
}

export const NARRATOR_VOICE_OPTIONS: NarratorVoiceOption[] = [
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    subtitle: 'Celestial Whisperer',
    description: 'Soft, ethereal, and melodic bedtime whisper tuned to soothe busy minds into gentle, restful sleep.',
    iconEmoji: '🌙',
    badge: 'Soft Whisper',
    narratorId: 'luna',
    samplePhrase: 'Close your eyes, little dreamer. The velvet night sky wraps you in gentle starlight.',
    color: '#818cf8',
    borderColor: 'border-indigo-400',
    bgActive: 'bg-indigo-950/80',
  },
  {
    id: 'starlight-guide',
    name: 'Starlight Guide',
    subtitle: 'Nurturing Maternal Melody',
    description: 'Warm, loving bedtime storyteller filled with radiant peace, kindness, and reassuring pauses.',
    iconEmoji: '✨',
    badge: 'Warm Reassurance',
    narratorId: 'stella',
    samplePhrase: 'Every little star is shining just for you tonight. Rest your head and drift into sweet wonder.',
    color: '#ec4899',
    borderColor: 'border-pink-400',
    bgActive: 'bg-pink-950/80',
  },
  {
    id: 'forest-whisperer',
    name: 'Forest Whisperer',
    subtitle: 'Whispering Woods & Breeze',
    description: 'Delicate, calm nature cadence reminiscent of rustling leaves and a quiet woodland sanctuary.',
    iconEmoji: '🍃',
    badge: 'Gentle Breeze',
    narratorId: 'zephyr',
    samplePhrase: 'A gentle evening breeze carries peace across the hills, breathing calmness into your dreams.',
    color: '#06b6d4',
    borderColor: 'border-cyan-400',
    bgActive: 'bg-cyan-950/80',
  },
  {
    id: 'cozy-hearth',
    name: 'Cozy Hearthside',
    subtitle: 'Deep Reassuring Baritone',
    description: 'A comforting, grounded hearthside rumble like a crackling fire and a warm bedtime blanket.',
    iconEmoji: '🐻',
    badge: 'Cozy Protector',
    narratorId: 'orion',
    samplePhrase: 'You did such a wonderful job today. You are completely safe, cozy, and ready to rest.',
    color: '#f59e0b',
    borderColor: 'border-amber-400',
    bgActive: 'bg-amber-950/80',
  },
  {
    id: 'wise-hearth',
    name: 'Wise Hearth Owl',
    subtitle: 'Enchanted Storybook Scholar',
    description: 'Slow, soothing bedtime cadence with thoughtful pauses from an ancient enchanted library.',
    iconEmoji: '🦉',
    badge: 'Wise Hearth',
    narratorId: 'barnaby',
    samplePhrase: 'Hoo-hoo... The forest has settled for the night. Let every worry drift away like autumn leaves.',
    color: '#10b981',
    borderColor: 'border-emerald-400',
    bgActive: 'bg-emerald-950/80',
  },
  {
    id: 'playful-dreamer',
    name: 'Playful Dreamer',
    subtitle: 'Cuddly Bedtime Buddy',
    description: 'Sweet, gentle, and friendly companion voice ideal for toddlers and imaginative young dreamers.',
    iconEmoji: '🐰',
    badge: 'Cuddle Buddy',
    narratorId: 'pip',
    samplePhrase: 'Snuggle under your cozy blanket, little bunny! The stars are smiling down on you.',
    color: '#a855f7',
    borderColor: 'border-purple-400',
    bgActive: 'bg-purple-950/80',
  },
];

export function getNarratorVoiceProfile(voiceId?: string): NarratorVoiceOption {
  if (!voiceId) return NARRATOR_VOICE_OPTIONS[0];
  const normalized = voiceId.toLowerCase().trim();
  if (normalized === 'luna' || normalized === 'voice-moonbeam' || normalized === 'moonbeam') {
    return NARRATOR_VOICE_OPTIONS[0];
  }
  if (normalized === 'stella' || normalized === 'starlight-guide') {
    return NARRATOR_VOICE_OPTIONS[1];
  }
  if (normalized === 'zephyr' || normalized === 'forest-whisperer') {
    return NARRATOR_VOICE_OPTIONS[2];
  }
  if (normalized === 'orion' || normalized === 'cozy-hearth') {
    return NARRATOR_VOICE_OPTIONS[3];
  }
  if (normalized === 'barnaby' || normalized === 'wise-hearth') {
    return NARRATOR_VOICE_OPTIONS[4];
  }
  if (normalized === 'pip' || normalized === 'playful-dreamer') {
    return NARRATOR_VOICE_OPTIONS[5];
  }
  return (
    NARRATOR_VOICE_OPTIONS.find((v) => v.id === normalized || v.narratorId === normalized) ||
    NARRATOR_VOICE_OPTIONS[0]
  );
}

export interface NarratorVoiceDropdownProps {
  value: string;
  onChange: (voiceId: string) => void;
  className?: string;
  id?: string;
}

export const NarratorVoiceDropdown: React.FC<NarratorVoiceDropdownProps> = ({
  value,
  onChange,
  className = '',
  id = 'narrator-voice-dropdown',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [savedBadgeVisible, setSavedBadgeVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedVoice = getNarratorVoiceProfile(value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Stop voice preview when closing or unmounting
  useEffect(() => {
    return () => {
      VoiceNarrator.stop();
    };
  }, []);

  const handleSelect = (voiceOption: NarratorVoiceOption) => {
    VoiceNarrator.stop();
    setPreviewingId(null);
    onChange(voiceOption.id);
    setIsOpen(false);
    setSavedBadgeVisible(true);
    setTimeout(() => {
      setSavedBadgeVisible(false);
    }, 2400);
  };

  const handleTogglePreview = (voiceOption: NarratorVoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewingId === voiceOption.id) {
      VoiceNarrator.stop();
      setPreviewingId(null);
      return;
    }

    VoiceNarrator.stop();
    setPreviewingId(voiceOption.id);

    VoiceNarrator.speak(voiceOption.samplePhrase, {
      voiceId: voiceOption.narratorId,
      speedRate: 0.86,
      onEnd: () => setPreviewingId(null),
      onError: () => setPreviewingId(null),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  return (
    <div id={id} ref={dropdownRef} className={`relative space-y-2 ${className}`}>
      {/* Label and Saved Badge */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={`${id}-trigger`}
          className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Default Bedtime Story Narrator</span>
        </label>

        <AnimatePresence>
          {savedBadgeVisible && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full"
            >
              <Check className="w-3 h-3" />
              <span>Saved</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Main Trigger Button */}
      <button
        id={`${id}-trigger`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select narrator voice profile. Current: ${selectedVoice.name}`}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all text-left bg-slate-950/80 ${
          isOpen
            ? 'border-amber-400/80 shadow-lg shadow-amber-400/10'
            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
        }`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-inner"
            style={{
              backgroundColor: `${selectedVoice.color}20`,
              borderColor: `${selectedVoice.color}50`,
            }}
          >
            {selectedVoice.iconEmoji}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm sm:text-base truncate">
                {selectedVoice.name}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{
                  backgroundColor: `${selectedVoice.color}25`,
                  color: selectedVoice.color,
                  border: `1px solid ${selectedVoice.color}40`,
                }}
              >
                {selectedVoice.badge}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5 font-light">
              {selectedVoice.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Quick Preview Button directly on the trigger */}
          <button
            type="button"
            onClick={(e) => handleTogglePreview(selectedVoice, e)}
            className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
              previewingId === selectedVoice.id
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
            }`}
            title={previewingId === selectedVoice.id ? 'Stop sample preview' : 'Listen to voice sample'}
            aria-label={previewingId === selectedVoice.id ? 'Stop voice sample' : 'Listen to voice sample'}
          >
            {previewingId === selectedVoice.id ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            aria-label="Narrator voice options"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1 p-2.5 rounded-2xl bg-[#0d0f1f]/95 border border-slate-800 shadow-2xl backdrop-blur-2xl space-y-2 max-h-96 overflow-y-auto"
          >
            <div className="px-2 pt-1 pb-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <Music className="w-3 h-3 text-amber-400" />
                <span>Select Bedtime Narrator Voice</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {NARRATOR_VOICE_OPTIONS.length} Voice Profiles
              </span>
            </div>

            <div className="space-y-1.5">
              {NARRATOR_VOICE_OPTIONS.map((voiceOption) => {
                const isSelected = selectedVoice.id === voiceOption.id;
                const isPreviewing = previewingId === voiceOption.id;

                return (
                  <div
                    key={voiceOption.id}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => handleSelect(voiceOption)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(voiceOption);
                      }
                    }}
                    className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? `${voiceOption.bgActive} ${voiceOption.borderColor} shadow-md shadow-black/40`
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border"
                          style={{
                            backgroundColor: `${voiceOption.color}20`,
                            borderColor: `${voiceOption.color}40`,
                          }}
                        >
                          {voiceOption.iconEmoji}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm truncate">
                              {voiceOption.name}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0"
                              style={{
                                backgroundColor: `${voiceOption.color}20`,
                                color: voiceOption.color,
                                border: `1px solid ${voiceOption.color}35`,
                              }}
                            >
                              {voiceOption.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {voiceOption.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Audio Preview Button */}
                        <button
                          type="button"
                          onClick={(e) => handleTogglePreview(voiceOption, e)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                            isPreviewing
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-slate-900/90 text-slate-400 hover:text-amber-300 border-slate-800 hover:border-slate-700'
                          }`}
                          title={isPreviewing ? 'Stop audio sample' : 'Listen to voice sample'}
                          aria-label={`Listen to ${voiceOption.name} sample`}
                        >
                          {isPreviewing ? (
                            <Square className="w-3 h-3 fill-current" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Voice Description & Sample Phrase */}
                    <div className="text-[11px] text-slate-300/90 font-light leading-relaxed pl-12 pr-2">
                      {voiceOption.description}
                    </div>

                    <div className="text-[10px] text-indigo-300/80 italic pl-12 pr-2 flex items-center gap-1">
                      <span>&ldquo;{voiceOption.samplePhrase}&rdquo;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
