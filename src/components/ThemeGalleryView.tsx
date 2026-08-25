import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DreamTheme, Story } from '../types';
import { DREAM_THEMES } from '../data/dreamThemes';
import { ambientSoundEngine } from '../services/audioNarration';
import {
  Sparkles,
  Clock,
  Bookmark,
  Play,
  Volume2,
  VolumeX,
  X,
  Compass,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkle,
} from 'lucide-react';

interface ThemeGalleryViewProps {
  onStartStoryWithTheme: (theme: DreamTheme) => void;
  onPreviewStory?: (story: Story) => void;
  bookmarkedThemeIds?: string[];
  onToggleBookmarkTheme?: (themeId: string) => void;
  onOpenSettings?: () => void;
  onOpenCreator?: () => void;
}

const CATEGORY_AMBIENT_COLORS: Record<string, { bgGlow: string; accent: string }> = {
  all: {
    bgGlow: 'from-purple-900/25 via-indigo-900/15 to-transparent',
    accent: 'border-amber-400/40 text-amber-300',
  },
  cosmic: {
    bgGlow: 'from-violet-900/30 via-indigo-950/20 to-transparent',
    accent: 'border-purple-400/40 text-purple-300',
  },
  nature: {
    bgGlow: 'from-emerald-950/30 via-teal-950/20 to-transparent',
    accent: 'border-emerald-400/40 text-emerald-300',
  },
  fantasy: {
    bgGlow: 'from-amber-900/25 via-rose-950/20 to-transparent',
    accent: 'border-amber-400/40 text-amber-300',
  },
  adventure: {
    bgGlow: 'from-cyan-950/30 via-blue-950/20 to-transparent',
    accent: 'border-cyan-400/40 text-cyan-300',
  },
  bookmarked: {
    bgGlow: 'from-amber-950/30 via-indigo-950/20 to-transparent',
    accent: 'border-amber-400/40 text-amber-300',
  },
};

export const ThemeGalleryView: React.FC<ThemeGalleryViewProps> = ({
  onStartStoryWithTheme,
  bookmarkedThemeIds = ['theme-cosmic-voyage'],
  onToggleBookmarkTheme,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewTheme, setActivePreviewTheme] = useState<DreamTheme | null>(null);
  const [ambientAudioActive, setAmbientAudioActive] = useState(false);
  const [localBookmarks, setLocalBookmarks] = useState<string[]>(bookmarkedThemeIds);

  // Clean up audio on unmount or modal close
  useEffect(() => {
    return () => {
      ambientSoundEngine.stopAmbient();
    };
  }, []);

  const handleBookmark = (themeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onToggleBookmarkTheme) {
      onToggleBookmarkTheme(themeId);
    }
    setLocalBookmarks((prev) =>
      prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
  };

  const filteredThemes = DREAM_THEMES.filter((theme) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'bookmarked') return localBookmarks.includes(theme.id);
    return theme.category === selectedCategory;
  });

  const handleToggleAmbientAudio = (soundName: string) => {
    if (ambientAudioActive) {
      ambientSoundEngine.stopAmbient();
      setAmbientAudioActive(false);
    } else {
      ambientSoundEngine.playAmbient(soundName, 0.35);
      setAmbientAudioActive(true);
    }
  };

  const handleStepPreviewTheme = (direction: 'next' | 'prev') => {
    if (!activePreviewTheme) return;
    const currentIndex = DREAM_THEMES.findIndex((t) => t.id === activePreviewTheme.id);
    if (currentIndex === -1) return;

    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= DREAM_THEMES.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = DREAM_THEMES.length - 1;

    const nextTheme = DREAM_THEMES[nextIndex];
    setActivePreviewTheme(nextTheme);

    // If audio is actively playing, switch soundscape
    if (ambientAudioActive) {
      ambientSoundEngine.playAmbient(nextTheme.ambientSound, 0.35);
    }
  };

  const activeColorConfig =
    CATEGORY_AMBIENT_COLORS[selectedCategory] || CATEGORY_AMBIENT_COLORS.all;

  return (
    <div className="relative pb-16 space-y-8 min-h-[80vh]">
      {/* Whimsical Atmospheric Ambient Light Cross-Fade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`absolute -top-12 -left-12 right-0 h-96 bg-radial-gradient ${activeColorConfig.bgGlow} blur-3xl pointer-events-none -z-10`}
        />
      </AnimatePresence>

      {/* Header Banner */}
      <header className="max-w-4xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
          <span>Nightly Visual Tapestries</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-playfair font-bold text-white tracking-tight">
          Dream Themes
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
          Choose the visual tapestry of your next nightly adventure. Every theme is meticulously
          crafted to induce calm and spark the imagination.
        </p>
      </header>

      {/* Filter Tabs Bar with Sliding Pill */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar">
          {[
            { id: 'all', label: 'All Themes' },
            { id: 'cosmic', label: '🌌 Cosmic' },
            { id: 'nature', label: '🌲 Nature & Ocean' },
            { id: 'fantasy', label: '✨ Fantasy & Citadel' },
            { id: 'adventure', label: '⚙️ Adventure' },
            { id: 'bookmarked', label: `⭐ Saved (${localBookmarks.length})` },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 select-none ${
                  isActive
                    ? 'text-slate-950 font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeThemeCategoryPill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 shadow-md shadow-amber-400/25"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Start Journey Quick Launcher */}
        <button
          type="button"
          onClick={() => {
            const randomTheme = DREAM_THEMES[Math.floor(Math.random() * DREAM_THEMES.length)];
            onStartStoryWithTheme(randomTheme);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
        >
          <Compass className="w-4 h-4" />
          <span>Start Random Journey</span>
        </button>
      </div>

      {/* Cross-Fading Bento Grid Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6"
        >
          {filteredThemes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full py-16 px-6 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 max-w-md mx-auto my-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 flex items-center justify-center mx-auto">
                <Bookmark className="w-7 h-7" />
              </div>
              <h3 className="font-playfair text-xl font-bold text-white">No Saved Themes Yet</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Click the bookmark icon on any dream theme card to save your favorite bedtime tapestries here.
              </p>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-md"
              >
                Browse All Themes
              </button>
            </motion.div>
          ) : (
            filteredThemes.map((theme, index) => {
              const isBookmarked = localBookmarks.includes(theme.id);
              const isLargeCard = theme.colSpan === 2;

              return (
                <motion.div
                  key={theme.id}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.38,
                    delay: Math.min(index * 0.04, 0.25),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`group/theme rounded-3xl overflow-hidden flex flex-col bg-slate-900/85 border border-slate-800/90 hover:border-amber-400/50 shadow-xl hover:shadow-2xl hover:shadow-indigo-950/70 backdrop-blur-xl transition-all duration-300 ${
                    isLargeCard ? 'lg:col-span-2' : 'col-span-1'
                  }`}
                >
                  {/* Image Container with Ambient Gradient Overlay */}
                  <div className={`relative overflow-hidden ${isLargeCard ? 'h-56 sm:h-64' : 'h-48'}`}>
                    <img
                      src={theme.imageUrl}
                      alt={theme.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/theme:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090b1c] via-[#090b1c]/30 to-transparent" />

                    {/* Tag Pill (Popular / New) */}
                    {theme.tag && (
                      <span className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-600/90 text-white border border-purple-400/40 shadow-md backdrop-blur-md">
                        {theme.tag}
                      </span>
                    )}

                    {/* Ambient Sound Tag */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-950/75 border border-slate-700 text-slate-300 backdrop-blur-md">
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span className="capitalize">{theme.ambientSound}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="text-xl sm:text-2xl font-playfair font-bold text-white group-hover/theme:text-amber-300 transition-colors">
                          {theme.title}
                        </h3>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{theme.duration}</span>
                        </div>
                      </div>

                      <p className="text-xs text-indigo-300/90 font-medium mb-2">
                        {theme.subtitle}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 font-light">
                        {theme.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setActivePreviewTheme(theme)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-400/20 transition-transform active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartStoryWithTheme(theme)}
                        className="py-2.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Start bedtime story with this theme"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span className="hidden sm:inline">Launch</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleBookmark(theme.id, e)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          isBookmarked
                            ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark theme'}
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>

      {/* Atmospheric Footer Quote */}
      <footer className="mt-16 text-center pt-8 border-t border-slate-800/60">
        <p className="font-serif italic text-slate-400 text-sm sm:text-base opacity-80">
          &ldquo;The world is but a canvas to our imagination.&rdquo; &mdash; Henry David Thoreau
        </p>
      </footer>

      {/* Interactive Theme Focus & Ambient Preview Modal with Cross-Fade */}
      <AnimatePresence>
        {activePreviewTheme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl w-full rounded-3xl overflow-hidden bg-slate-900 border border-amber-400/40 shadow-2xl relative flex flex-col"
            >
              {/* Modal Cover Image with Cross-Fade on Step */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activePreviewTheme.id}
                    src={activePreviewTheme.imageUrl}
                    alt={activePreviewTheme.title}
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePreviewTheme(null);
                    setAmbientAudioActive(false);
                    ambientSoundEngine.stopAmbient();
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 border border-slate-700 text-slate-300 hover:text-white transition-colors z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Tag */}
                {activePreviewTheme.tag && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow z-20">
                    {activePreviewTheme.tag}
                  </span>
                )}

                {/* Step Browsing Buttons (Prev / Next Theme) */}
                <div className="absolute inset-y-0 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                  <button
                    type="button"
                    onClick={() => handleStepPreviewTheme('prev')}
                    className="pointer-events-auto p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90"
                    title="Previous Theme"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStepPreviewTheme('next')}
                    className="pointer-events-auto p-2 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white shadow-lg transition-transform active:scale-90"
                    title="Next Theme"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Content with Subtle Cross-Fade */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePreviewTheme.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  className="p-6 sm:p-8 -mt-8 relative z-10 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-white">
                        {activePreviewTheme.title}
                      </h2>
                      <p className="text-xs text-amber-300 font-medium">{activePreviewTheme.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 text-xs bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Duration: {activePreviewTheme.duration}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-light">
                    {activePreviewTheme.description}
                  </p>

                  {/* Calming Affirmation Box */}
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-amber-300 uppercase text-[10px] tracking-wider">
                      <Sparkle className="w-3.5 h-3.5 fill-current animate-pulse" />
                      <span>Bedtime Sleep Affirmation</span>
                    </div>
                    <p className="italic text-slate-100">&ldquo;{activePreviewTheme.sampleAffirmation}&rdquo;</p>
                  </div>

                  {/* Ambient Sound Preview Bar */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white capitalize">
                          Ambient Soundscape: {activePreviewTheme.ambientSound}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {ambientAudioActive ? 'Calming frequencies playing...' : 'Click to preview audio'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAmbientAudio(activePreviewTheme.ambientSound)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                        ambientAudioActive
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {ambientAudioActive ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{ambientAudioActive ? 'Mute' : 'Play Sound'}</span>
                    </button>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const theme = activePreviewTheme;
                        setActivePreviewTheme(null);
                        setAmbientAudioActive(false);
                        ambientSoundEngine.stopAmbient();
                        onStartStoryWithTheme(theme);
                      }}
                      className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Begin Bedtime Story In This Theme</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBookmark(activePreviewTheme.id)}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Bookmark theme"
                    >
                      <Bookmark
                        className={`w-5 h-5 ${
                          localBookmarks.includes(activePreviewTheme.id) ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
