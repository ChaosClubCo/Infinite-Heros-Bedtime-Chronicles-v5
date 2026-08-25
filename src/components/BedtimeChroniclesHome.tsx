import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, CompletedStoryRecord } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { getAvatarById } from '../data/avatars';
import { DailyAffirmationWidget } from './DailyAffirmationWidget';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Moon,
  Clock,
  Play,
  ChevronRight,
  Search,
  PenTool,
  Feather,
  Star,
  X,
} from 'lucide-react';

interface BedtimeChroniclesHomeProps {
  onSelectStory: (story: Story) => void;
  onOpenDetails: (story: Story) => void;
  onOpenMadlibs: () => void;
  onOpenDreamJournal: () => void;
  onOpenWindDown: () => void;
  onOpenLibrary: (categoryFilter?: string) => void;
  onOpenSettings: () => void;
  childName?: string;
  childAvatar?: string;
  completedStories?: CompletedStoryRecord[];
}

export const BedtimeChroniclesHome: React.FC<BedtimeChroniclesHomeProps> = ({
  onSelectStory,
  onOpenDetails,
  onOpenMadlibs,
  onOpenDreamJournal,
  onOpenWindDown,
  onOpenLibrary,
  onOpenSettings,
  childName = 'Little Explorer',
  childAvatar = 'fox',
  completedStories = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeStarTooltipId, setActiveStarTooltipId] = useState<string | null>(null);
  const [pulsingStarId, setPulsingStarId] = useState<string | null>(null);
  const constellationRef = useRef<HTMLDivElement | null>(null);

  const activeAvatar = getAvatarById(childAvatar);
  const heroStory = FEATURED_STORIES[0]; // The Silver Moon Fox

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        constellationRef.current &&
        !constellationRef.current.contains(event.target as Node)
      ) {
        setActiveStarTooltipId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveStarTooltipId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStarClick = (storyId: string) => {
    if (activeStarTooltipId === storyId) {
      setActiveStarTooltipId(null);
    } else {
      setActiveStarTooltipId(storyId);
      setPulsingStarId(storyId);
      setTimeout(() => {
        setPulsingStarId(null);
      }, 750);
    }
  };

  const handleOpenCompletedStory = (record: CompletedStoryRecord) => {
    const fullStory =
      FEATURED_STORIES.find((s) => s.id === record.id || s.title === record.title) || {
        id: record.id,
        title: record.title,
        category: record.category || 'Bedtime Tale',
        theme: 'wonder',
        mode: 'classic',
        ageRange: '4-6',
        heroId: 'hero-1',
        heroName: record.heroName || 'Luna & Koda',
        summary: 'A peaceful starlight adventure that guided you safely to sweet dreams.',
        coverImage:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
        scenes: [
          {
            id: 'scene-1',
            sceneNumber: 1,
            text: `Once upon a starlit night, you embarked on the magical tale of "${record.title}". The gentle night sky welcomed you with soft dreams.`,
            sleepAffirmation: 'You are safe, calm, and surrounded by celestial starlight.',
            isFinal: true,
          },
        ],
      };
    onSelectStory(fullStory as Story);
  };

  const handleViewStoryDetails = (record: CompletedStoryRecord) => {
    const fullStory =
      FEATURED_STORIES.find((s) => s.id === record.id || s.title === record.title) || {
        id: record.id,
        title: record.title,
        category: record.category || 'Bedtime Tale',
        theme: 'wonder',
        mode: 'classic',
        ageRange: '4-6',
        heroId: 'hero-1',
        heroName: record.heroName || 'Luna & Koda',
        summary: 'A peaceful starlight adventure that guided you safely to sweet dreams.',
        coverImage:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
        scenes: [
          {
            id: 'scene-1',
            sceneNumber: 1,
            text: `Once upon a starlit night, you embarked on the magical tale of "${record.title}". The gentle night sky welcomed you with soft dreams.`,
            sleepAffirmation: 'You are safe, calm, and surrounded by celestial starlight.',
            isFinal: true,
          },
        ],
      };
    onOpenDetails(fullStory as Story);
  };

  const personalizedStories = [
    FEATURED_STORIES.find((s) => s.id === 'story-glow-whale') || FEATURED_STORIES[1],
    FEATURED_STORIES.find((s) => s.id === 'story-hollow-tree') || FEATURED_STORIES[2],
    FEATURED_STORIES.find((s) => s.id === 'story-library-stars') || FEATURED_STORIES[3],
    FEATURED_STORIES.find((s) => s.id === 'story-zen-garden') || FEATURED_STORIES[4],
  ].filter(Boolean) as Story[];

  const filteredStories = FEATURED_STORIES.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto space-y-10 pb-16 font-sans">
      
      {/* Top Header matching Image 1: 'Bedtime Chronicles' + Search + Child Avatar */}
      <header className="flex items-center justify-between pt-2 pb-2 border-b border-indigo-950/40">
        <h1 className="text-2xl sm:text-3xl font-playfair font-semibold tracking-wide text-white">
          Bedtime Chronicles
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="search-toggle-btn"
            onClick={() => setShowSearchModal(!showSearchModal)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-full transition-colors"
            title="Search bedtime stories"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Child Profile with Avatar Icon */}
          <button
            type="button"
            id="child-profile-header-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-indigo-900/60 hover:border-amber-400/50 text-slate-200 hover:text-white transition-all shadow-sm group"
            title={`Child Profile: ${childName} (${activeAvatar.name}) - Click to customize`}
          >
            <span className="w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-base group-hover:scale-110 transition-transform">
              {activeAvatar.emoji}
            </span>
            <span className="text-xs font-semibold max-w-[120px] truncate hidden sm:inline">
              {childName}
            </span>
          </button>
        </div>
      </header>

      {/* Child Personalized Greeting Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/60 border border-indigo-900/40 text-xs text-indigo-200">
        <div className="flex items-center gap-2.5">
          <span className="text-xl animate-bounce">{activeAvatar.emoji}</span>
          <span>
            Good night, <strong className="text-amber-300 font-bold">{childName}</strong>! Ready for starry adventures?
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline underline-offset-2"
        >
          <span>Avatar & Routine</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Quick Search Drawer */}
      {showSearchModal && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/60 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories by title, hero, or bedtime theme..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-indigo-900/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {searchQuery && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {filteredStories.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectStory(s);
                    setShowSearchModal(false);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-400/60 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-amber-300">{s.title}</h4>
                    <span className="text-[10px] text-slate-400">{s.category} • {s.audioDurationMinutes} min</span>
                  </div>
                  <Play className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 fill-current" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED STORIES CONSTELLATION: Interactive Pulsing & Glowing Stars */}
      {completedStories && completedStories.length > 0 && (
        <section
          ref={constellationRef}
          aria-label="Completed Stories Constellation"
          className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-[#0e0926]/90 border border-indigo-900/60 shadow-xl backdrop-blur-md transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-sm shadow-amber-400/20">
                <Sparkles className="w-4 h-4 fill-current animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-playfair font-bold text-white tracking-wide">
                    Your Bedtime Constellation
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {completedStories.length} {completedStories.length === 1 ? 'Story Star' : 'Story Stars'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 font-light">
                  Click a glowing star to reveal its bedtime memory & title
                </p>
              </div>
            </div>

            <div className="text-[11px] text-amber-300/80 flex items-center gap-1.5 self-start sm:self-auto font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span>Tap to explore</span>
            </div>
          </div>

          {/* Interactive Celestial Constellation Bar */}
          <div className="relative flex items-center flex-wrap gap-4 sm:gap-7 py-3 px-4 sm:px-6 rounded-2xl bg-[#070417]/90 border border-indigo-950/80 min-h-[76px]">
            {/* Ambient connective constellation line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-amber-400/20 via-indigo-400/30 to-purple-400/20 pointer-events-none hidden sm:block" />

            {completedStories.map((storyRecord, index) => {
              const isSelected = activeStarTooltipId === storyRecord.id;
              const isPulsing = pulsingStarId === storyRecord.id;

              return (
                <div key={storyRecord.id} className="relative group/star">
                  {/* Star Trigger Button */}
                  <motion.button
                    type="button"
                    id={`completed-star-${storyRecord.id}`}
                    onClick={() => handleStarClick(storyRecord.id)}
                    whileHover={{ scale: 1.18 }}
                    whileTap={{ scale: 0.92 }}
                    animate={
                      isPulsing
                        ? {
                            scale: [1, 1.45, 1.18],
                            rotate: [0, -14, 14, 0],
                            filter: [
                              'drop-shadow(0 0 6px #fbbf24)',
                              'drop-shadow(0 0 22px #f59e0b) drop-shadow(0 0 35px #fde047)',
                              'drop-shadow(0 0 12px #fbbf24)',
                            ],
                          }
                        : isSelected
                        ? {
                            scale: 1.2,
                            filter: 'drop-shadow(0 0 14px #fbbf24) drop-shadow(0 0 26px #f59e0b)',
                          }
                        : {
                            scale: [1, 1.06, 1],
                            filter: 'drop-shadow(0 0 5px rgba(251, 191, 36, 0.6))',
                          }
                    }
                    transition={
                      isPulsing
                        ? { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
                        : { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: index * 0.35 }
                    }
                    className={`relative p-2.5 sm:p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-400/30 via-yellow-500/20 to-indigo-950 border border-amber-300 shadow-lg shadow-amber-400/30'
                        : 'bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-indigo-950/80 border border-amber-400/50 hover:border-amber-300 hover:bg-amber-400/25'
                    }`}
                    aria-expanded={isSelected}
                    aria-controls={`star-tooltip-${storyRecord.id}`}
                    aria-label={`Completed story star: ${storyRecord.title}. Tap to view memory.`}
                  >
                    {/* Radiating Expanding Pulse Wave on Click */}
                    <AnimatePresence>
                      {isPulsing && (
                        <motion.span
                          initial={{ scale: 0.8, opacity: 0.95 }}
                          animate={{ scale: 2.6, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.75, ease: 'easeOut' }}
                          className="absolute inset-0 rounded-full border-2 border-amber-300 pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {/* Golden Celestial Star Icon */}
                    <Star
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-amber-300 fill-amber-400 transition-transform ${
                        isSelected ? 'scale-110' : 'group-hover/star:scale-110'
                      }`}
                    />

                    {/* Mini Star Order Badge */}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-950 border border-amber-400/70 text-[9px] font-bold text-amber-300 flex items-center justify-center shadow-xs">
                      {index + 1}
                    </span>
                  </motion.button>

                  {/* Celestial Popover Tooltip for the Story Title */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        id={`star-tooltip-${storyRecord.id}`}
                        role="tooltip"
                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-3.5 w-64 sm:w-72 p-3.5 rounded-2xl bg-[#0d0926]/95 border border-amber-400/60 shadow-2xl shadow-amber-950/60 text-left backdrop-blur-xl"
                      >
                        {/* Tooltip Pointer Arrow */}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[#0d0926] border-t border-l border-amber-400/60" />

                        <div className="relative z-10 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 fill-current" />
                              <span>Story Memory Star #{index + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveStarTooltipId(null);
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                              title="Close star tooltip"
                              aria-label="Close star tooltip"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div>
                            <h4 className="text-sm font-playfair font-bold text-white tracking-wide leading-snug">
                              {storyRecord.title}
                            </h4>
                            <p className="text-[11px] text-indigo-200/90 mt-0.5">
                              {storyRecord.heroName ? `Guided by ${storyRecord.heroName}` : 'Bedtime Tale'} •{' '}
                              <span className="text-amber-300 font-medium">
                                {storyRecord.completedAt || 'Completed'}
                              </span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-indigo-950/80 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCompletedStory(storyRecord);
                              }}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Read Again</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewStoryDetails(storyRecord);
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DAILY BEDTIME AFFIRMATION WIDGET */}
      <DailyAffirmationWidget
        childName={childName}
        onOpenWindDown={onOpenWindDown}
      />

      {/* HERO BANNER: The Silver Moon Fox (Image 1) */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#171233] via-[#100d27] to-[#1a143b] border border-indigo-900/50 shadow-2xl shadow-indigo-950/80">
        
        {/* Background Artwork: Sleeping Silver Fox curled on crescent moon */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400&auto=format&fit=crop"
            alt="The Silver Moon Fox Sleeping on Moon"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-screen scale-105"
          />
          {/* Cosmic Nebula Glow & Stardust */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0924] via-[#0e0924]/85 to-transparent sm:w-2/3" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
          <div className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl flex flex-col justify-between min-h-[360px] sm:min-h-[420px]">
          
          {/* Top Tag & Duration */}
          <div className="flex items-center justify-between w-full">
            <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-widest bg-[#c89838] text-[#1c1203] shadow-md">
              Story of the Night
            </span>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120d2a]/80 border border-slate-700/60 backdrop-blur-md text-xs text-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>12 min</span>
            </div>
          </div>

          {/* Hero Story Title & Narrative */}
          <div className="my-auto py-6 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-playfair font-bold text-white tracking-tight leading-tight">
              {heroStory.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed max-w-lg font-light">
              {heroStory.summary}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              id="listen-now-hero-btn"
              onClick={() => onSelectStory(heroStory)}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs sm:text-sm bg-[#f2cb6c] hover:bg-[#ebd07f] text-[#1e1403] shadow-xl shadow-amber-400/20 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Listen Now</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(heroStory)}
              className="px-5 sm:px-6 py-3 rounded-full font-semibold text-xs sm:text-sm bg-[#1b1535]/80 hover:bg-[#271f4b] text-slate-200 hover:text-white border border-slate-700/70 transition-all"
            >
              Details
            </button>
          </div>
        </div>
      </section>

      {/* 4 CATEGORY PILLS (Image 1) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            id: 'short-tales',
            label: 'Short Tales',
            icon: Sparkles,
            action: () => onOpenLibrary('Short Tale'),
          },
          {
            id: 'meditation',
            label: 'Meditation',
            icon: Feather,
            action: () => onOpenLibrary('Guided Meditation'),
          },
          {
            id: 'classic-fables',
            label: 'Classic Fables',
            icon: BookOpen,
            action: () => onOpenLibrary('Classic Fable'),
          },
          {
            id: 'nature-sounds',
            label: 'Nature Sounds',
            icon: Volume2,
            action: onOpenWindDown,
          },
        ].map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={cat.action}
              className="flex flex-col items-center justify-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-[#0e0a24]/90 hover:bg-[#18123b] border border-indigo-950/80 hover:border-indigo-700/60 shadow-lg transition-all group hover:scale-[1.02]"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-300 group-hover:text-amber-300 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-200 group-hover:text-white font-serif tracking-wide">
                {cat.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* PERSONALIZED FOR YOU SECTION (Image 1) */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-playfair font-bold text-white tracking-wide">
              Personalized for You
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Based on your recent peaceful nights
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenLibrary()}
            className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Story Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {personalizedStories.map((story) => (
            <div
              key={story.id}
              onClick={() => onSelectStory(story)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-[#0e0a24] border border-indigo-950/80 hover:border-indigo-700/70 shadow-xl transition-all hover:scale-[1.02] flex flex-col"
            >
              {/* Cover Art with Duration Badge */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
                <img
                  src={story.coverImage}
                  alt={story.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a24] via-transparent to-black/20" />

                {/* Duration Badge Top Right */}
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-black/60 backdrop-blur-md text-amber-300 border border-white/10">
                  {story.audioDurationMinutes || 10} MIN
                </span>
              </div>

              {/* Card Metadata Beneath */}
              <div className="p-4 pt-3 flex flex-col justify-between flex-1">
                <div>
                  <h4 className="text-sm font-playfair font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {story.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                    {story.category}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENING RITUALS SECTION (Image 1) */}
      <section className="space-y-4">
        <h3 className="text-2xl font-playfair font-bold text-white tracking-wide">
          Evening Rituals
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Wind Down Mode (Left 2 columns) */}
          <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#120c29] via-[#0d0922] to-[#150e30] border border-indigo-950/80 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-sm">
              <h4 className="text-xl font-playfair font-bold text-white">
                Wind Down Mode
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Schedule your device to dim and start a soft nature soundscape 30 minutes before sleep.
              </p>
              <button
                type="button"
                onClick={onOpenWindDown}
                className="mt-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#261c47] hover:bg-[#342761] border border-indigo-800/60 text-slate-200 hover:text-white transition-all shadow-md"
              >
                Setup Now
              </button>
            </div>

            {/* Stylized Phone Preview (Matching Image 1 Wind Down Device Graphic) */}
            <div className="relative w-40 h-56 rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-3 shrink-0">
              <div className="w-12 h-1 rounded-full bg-slate-800 mx-auto" />
              
              <div className="text-center space-y-1 my-auto">
                <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">Bedtime Timer</span>
                <div className="text-xl font-bold font-mono text-white tracking-wider">
                  45:23
                </div>
                <span className="text-[8px] text-slate-500">Ocean Waves Active</span>
              </div>

              <div className="w-full space-y-1">
                <div className="w-full h-1 rounded-full bg-indigo-950 overflow-hidden">
                  <div className="w-2/3 h-full bg-indigo-500 rounded-full" />
                </div>
                <div className="text-[7px] text-center text-slate-500">Sleep Horizon: 8:45 PM</div>
              </div>
            </div>
          </div>

          {/* Card 2: Dream Journal (Right 1 column) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#130d2b] to-[#0c081e] border border-indigo-950/80 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              {/* Moon Badge */}
              <div className="w-10 h-10 rounded-full bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-300 mb-4">
                <Moon className="w-5 h-5" />
              </div>

              <h4 className="text-xl font-playfair font-bold text-white mb-1">
                Dream Journal
              </h4>
              <p className="text-xs text-slate-300 font-light">
                Record your morning reflections
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenDreamJournal}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors group"
            >
              <span>Open Journal</span>
              <PenTool className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* QUICK LAUNCH BANNER TO MADLIB SUITE */}
      <section className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-[#0e0926] border border-purple-900/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-md shadow-amber-400/10 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-playfair font-bold text-white">Madlib Suite</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                5 Bedtime Modes
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Fill in story blanks, speak aloud, explore themed story packs, or visit your Madlib Vault
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMadlibs}
          className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#FFD54F] hover:bg-[#ffe082] text-slate-950 shadow-lg shadow-amber-500/20 transition-all shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
        >
          <span>Open Madlib Suite</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* FOOTER matching Image 1 */}
      <footer className="pt-12 border-t border-indigo-950/60 text-center space-y-3">
        <div className="text-base font-playfair font-medium text-slate-300">
          Bedtime Chronicles
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <button type="button" onClick={onOpenSettings} className="hover:text-slate-300">
            Privacy & COPPA Safe
          </button>
          <span>•</span>
          <button type="button" onClick={onOpenSettings} className="hover:text-slate-300">
            Terms of Service
          </button>
          <span>•</span>
          <button type="button" onClick={onOpenSettings} className="hover:text-slate-300">
            Parent Guide
          </button>
        </div>

        <p className="text-[11px] text-slate-600">
          © 2024 Bedtime Chronicles. Sweet dreams.
        </p>
      </footer>
    </div>
  );
};
