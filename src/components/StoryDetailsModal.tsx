import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Story } from '../types';
import { getHeroById } from '../data/heroes';
import { FEATURED_STORIES } from '../data/featuredStories';
import { STORY_SEEDS } from '../data/storySeeds';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import {
  Play,
  Clock,
  X,
  Moon,
  Bookmark,
  Volume2,
  Volume1,
  VolumeX,
  Sparkles,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { VoiceNarrator } from '../services/audioNarration';

interface StoryDetailsModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
  onPlay: (story: Story) => void;
  onToggleSave?: (story: Story) => void;
  isSaved?: boolean;
}

export const StoryDetailsModal: React.FC<StoryDetailsModalProps> = ({
  story: initialStory,
  isOpen,
  onClose,
  onPlay,
  onToggleSave,
  isSaved: initialIsSaved,
}) => {
  // Current active story in the modal (allows browsing recommended stories)
  const [activeModalStory, setActiveModalStory] = useState<Story | null>(initialStory);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewVolume, setPreviewVolume] = useState<number>(0.85); // 0 to 1, independent from ambient audio
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Sync active modal story when initialStory prop changes
  useEffect(() => {
    setActiveModalStory(initialStory);
    setIsPlayingPreview(false);
    VoiceNarrator.stop();
  }, [initialStory]);

  const handleClose = useCallback(() => {
    VoiceNarrator.stop();
    setIsPlayingPreview(false);
    onClose();
  }, [onClose]);

  // Stop speech if modal closes or unmounts
  useEffect(() => {
    return () => {
      VoiceNarrator.stop();
      setIsPlayingPreview(false);
    };
  }, [isOpen]);

  // Handle escape key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const currentStory = activeModalStory || initialStory;

  // Calculate 3 similar stories based on genre, theme, and category
  const similarStories = useMemo(() => {
    if (!currentStory) return [];

    const targetStory = currentStory;
    const otherFeatured = FEATURED_STORIES.filter((s) => s.id !== targetStory.id);

    // Score featured stories by similarity
    const scoredFeatured = otherFeatured
      .map((s) => {
        let score = 0;
        if (s.theme === targetStory.theme) score += 5;
        if (s.category === targetStory.category) score += 4;
        if (s.mode === targetStory.mode) score += 3;
        if (s.ageRange === targetStory.ageRange) score += 2;
        if (s.heroId === targetStory.heroId) score += 2;
        return { story: s, score };
      })
      .sort((a, b) => b.score - a.score);

    const results: Story[] = scoredFeatured.slice(0, 3).map((item) => item.story);

    // If fewer than 3 from featured, generate from relevant STORY_SEEDS
    if (results.length < 3) {
      const existingIds = new Set([targetStory.id, ...results.map((r) => r.id)]);
      const matchingSeeds = STORY_SEEDS.filter((seed) => {
        return !existingIds.has(seed.id) && !existingIds.has(`seed-${seed.id}`);
      })
        .map((seed) => {
          let score = 0;
          if (seed.theme === targetStory.theme) score += 5;
          if (seed.mode === targetStory.mode) score += 3;
          if (seed.ageRange === targetStory.ageRange) score += 2;
          if (seed.suggestedHeroId === targetStory.heroId) score += 2;
          return { seed, score };
        })
        .sort((a, b) => b.score - a.score);

      for (const item of matchingSeeds) {
        if (results.length >= 3) break;
        const seed = item.seed;
        const genStory = generateCustomBedtimeStory({
          heroId: seed.suggestedHeroId,
          theme: seed.theme,
          mode: seed.mode,
          ageRange: seed.ageRange,
          customPrompt: seed.title,
          setting: seed.setting,
          sidekick: seed.sidekick,
          problem: seed.problem,
        });
        genStory.id = `seed-${seed.id}`;
        genStory.title = seed.title;
        genStory.summary = seed.blurb;
        results.push(genStory);
      }
    }

    return results.slice(0, 3);
  }, [currentStory]);

  if (!isOpen || !currentStory) return null;

  const hero = getHeroById(currentStory.heroId);

  const startPreviewSpeech = (volumeLevel: number = previewVolume) => {
    const previewText = `${currentStory.title}. Bedtime story about ${hero.name}. ${currentStory.summary}`;
    setIsPlayingPreview(true);

    const success = VoiceNarrator.speak(previewText, {
      speedRate: 0.88,
      volume: volumeLevel,
      onEnd: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
    });

    if (!success) {
      setIsPlayingPreview(false);
    }
  };

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      VoiceNarrator.stop();
      setIsPlayingPreview(false);
    } else {
      startPreviewSpeech(previewVolume);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setPreviewVolume(newVolume);
    if (isPlayingPreview) {
      // Re-trigger speech with updated volume seamlessly
      startPreviewSpeech(newVolume);
    }
  };

  const handlePlayStory = (storyToPlay: Story = currentStory) => {
    VoiceNarrator.stop();
    setIsPlayingPreview(false);
    onClose();
    onPlay(storyToPlay);
  };

  const handleSelectSimilarStory = (similar: Story) => {
    VoiceNarrator.stop();
    setIsPlayingPreview(false);
    setActiveModalStory(similar);
  };

  const getVolumeIcon = () => {
    if (previewVolume === 0) return <VolumeX className="w-3.5 h-3.5 text-slate-400" />;
    if (previewVolume < 0.5) return <Volume1 className="w-3.5 h-3.5 text-amber-300" />;
    return <Volume2 className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-details-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-3xl bg-[#090b1e] border border-indigo-900/60 shadow-2xl shadow-indigo-950/80 overflow-hidden text-slate-100 max-h-[90vh] flex flex-col"
      >
        
        {/* Cover / Hero Art Area */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 overflow-hidden bg-gradient-to-b from-indigo-900/40 via-purple-950/60 to-[#090b1e]">
          {currentStory.coverImage ? (
            <img
              src={currentStory.coverImage}
              alt={currentStory.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60 mix-blend-screen"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-950/40">
              <span className="text-6xl opacity-40">✨</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090b1e] via-[#090b1e]/50 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            id="close-details-modal-btn"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {currentStory.badge ? (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/90 text-slate-950 shadow-md">
                {currentStory.badge}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-600/80 text-white shadow-md">
                {currentStory.theme}
              </span>
            )}
            <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-950/70 text-slate-200 border border-slate-700/60 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{currentStory.audioDurationMinutes || 10} min</span>
            </span>
          </div>

          {/* Story Title */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 id="story-details-title" className="text-2xl sm:text-3xl font-bold font-playfair text-white tracking-wide leading-tight">
              {currentStory.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-indigo-300 font-medium">Hero: {hero.name} ({hero.title})</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 capitalize">{currentStory.category}</span>
            </div>
          </div>
        </div>

        {/* Story Details Body - Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Summary Section with Preview and Dedicated Volume Slider */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-indigo-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Story Summary
              </h3>

              {/* Preview Controls Group */}
              <div className="flex items-center gap-2">
                {/* Listen to Preview Button */}
                <button
                  type="button"
                  id="listen-preview-btn"
                  onClick={handleTogglePreview}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                    isPlayingPreview
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md animate-pulse'
                      : 'bg-indigo-950/70 hover:bg-indigo-900 border-indigo-800/60 text-indigo-200 hover:text-white shadow-sm'
                  }`}
                  title={isPlayingPreview ? 'Stop narrator audio preview' : 'Listen to narrator preview'}
                >
                  {isPlayingPreview ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-amber-300" />
                      <span>Stop Preview</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Listen to Preview</span>
                    </>
                  )}
                </button>

                {/* Toggle Volume Slider Button */}
                <button
                  type="button"
                  id="toggle-preview-volume-btn"
                  onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                  className={`p-1.5 rounded-full border transition-all ${
                    showVolumeSlider
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Adjust preview narration volume"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Dedicated Preview Volume Slider Bar */}
            {(showVolumeSlider || isPlayingPreview) && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/80 border border-indigo-900/40 animate-fadeIn">
                <button
                  type="button"
                  id="mute-preview-volume-btn"
                  onClick={() => handleVolumeChange(previewVolume === 0 ? 0.85 : 0)}
                  className="hover:scale-110 transition-transform"
                  title={previewVolume === 0 ? 'Unmute preview' : 'Mute preview'}
                >
                  {getVolumeIcon()}
                </button>

                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Preview Volume:</span>
                  <input
                    type="range"
                    id="preview-volume-slider"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round(previewVolume * 100)}
                    onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                    className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="text-[11px] text-amber-300 font-mono w-8 text-right font-semibold">
                    {Math.round(previewVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-slate-200 leading-relaxed font-light">
              {currentStory.summary}
            </p>
          </div>

          {/* Scenes Preview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Bedtime Journey Structure ({currentStory.scenes.length} Chapters)
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {currentStory.scenes.map((scene, idx) => (
                <div
                  key={scene.id || idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-indigo-950 text-xs text-slate-300"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="line-clamp-2 text-slate-300">{scene.text}</p>
                    {scene.sleepAffirmation && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300/90 italic mt-1">
                        <Moon className="w-2.5 h-2.5" />
                        &ldquo;{scene.sleepAffirmation}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* More Like This Section */}
          <div className="pt-2 border-t border-indigo-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  More Like This
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 capitalize">
                  {currentStory.theme}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900 border border-slate-700 text-slate-400 capitalize">
                  {currentStory.category}
                </span>
              </div>
            </div>

            {/* 3 Similar Stories Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {similarStories.map((rec) => {
                const recHero = getHeroById(rec.heroId);
                return (
                  <div
                    key={rec.id}
                    id={`similar-story-${rec.id}`}
                    onClick={() => handleSelectSimilarStory(rec)}
                    className="group relative p-3 rounded-2xl bg-slate-900/70 border border-indigo-950/80 hover:border-amber-400/50 hover:bg-slate-800/80 cursor-pointer transition-all flex flex-col justify-between space-y-2.5"
                  >
                    <div>
                      {/* Top hero tag & time */}
                      <div className="flex items-center justify-between mb-1 text-[10px]">
                        <span className="flex items-center gap-1 text-indigo-300 font-medium truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: recHero.color }}
                          />
                          <span className="truncate">{recHero.name}</span>
                        </span>
                        <span className="text-slate-400 shrink-0">
                          {rec.audioDurationMinutes || 10}m
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {rec.title}
                      </h4>

                      {/* Short excerpt */}
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mt-1">
                        {rec.summary}
                      </p>
                    </div>

                    {/* Bottom action row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayStory(rec);
                        }}
                        className="p-1 rounded-full bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-300 transition-colors"
                        title={`Play ${rec.title}`}
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-indigo-950 bg-[#060816] flex items-center gap-3 shrink-0">
          <button
            type="button"
            id="listen-now-details-btn"
            onClick={() => handlePlayStory(currentStory)}
            className="flex-1 py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 transition-all flex items-center justify-center gap-2 font-jakarta"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Listen Now ({currentStory.title})</span>
          </button>

          {onToggleSave && (
            <button
              type="button"
              id="save-story-details-btn"
              onClick={() => onToggleSave(currentStory)}
              className={`py-3 px-4 rounded-2xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                initialIsSaved
                  ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${initialIsSaved ? 'fill-current' : ''}`} />
              <span>{initialIsSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

