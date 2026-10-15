import React, { useState, useEffect, useMemo } from 'react';
import { Story, CompletedStoryRecord, StreakMilestone, ChildProfile, DreamJournalEntry } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { getAvatarById } from '../data/avatars';
import { DailyAffirmationWidget } from './DailyAffirmationWidget';
import { StoryGalaxyMap } from './StoryGalaxyMap';
import { DailyStreakMilestoneCard } from './DailyStreakMilestoneCard';
import { GoodMorningOverlay } from './GoodMorningOverlay';
import { QuickStartBedtimeCard } from './QuickStartBedtimeCard';
import { isExactMilestone, triggerSubtleConfettiShower } from '../utils/confetti';
import {
  resolveSavedThemes,
  getRecommendedStories,
  getTargetAgeRange,
} from '../utils/storyRecommendations';
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
  Sunrise,
  Wind,
} from 'lucide-react';

interface BedtimeChroniclesHomeProps {
  onSelectStory: (story: Story) => void;
  onOpenDetails: (story: Story) => void;
  onOpenMadlibs: () => void;
  onOpenDreamJournal: () => void;
  onOpenWindDown: () => void;
  onOpenGuidedBreathing?: () => void;
  onOpenLibrary: (categoryFilter?: string) => void;
  onOpenCreator?: () => void;
  onOpenSettings: () => void;
  childName?: string;
  childAge?: number;
  childAvatar?: string;
  storyPreference?: string;
  gentleMode?: boolean;
  activeChildProfileId?: string;
  childProfiles?: ChildProfile[];
  onSwitchProfile?: (profileId: string) => void;
  completedStories?: CompletedStoryRecord[];
  streakCount?: number;
  onAdvanceStreak?: () => void;
  onSelectMilestone?: (milestone: StreakMilestone) => void;
  dreamEntries?: DreamJournalEntry[];
  onOpenThemes?: () => void;
  savedThemeIds?: string[];
  bookmarkedThemeIds?: string[];
  savedStories?: Story[];
}

export const BedtimeChroniclesHome: React.FC<BedtimeChroniclesHomeProps> = ({
  onSelectStory,
  onOpenDetails,
  onOpenMadlibs,
  onOpenDreamJournal,
  onOpenWindDown,
  onOpenGuidedBreathing,
  onOpenLibrary,
  onOpenCreator,
  onOpenSettings,
  onOpenThemes,
  childName = 'Little Explorer',
  childAge = 5,
  childAvatar = 'fox',
  storyPreference = 'Gentle Stories • Sleepy Animals',
  gentleMode = true,
  activeChildProfileId = 'profile-leo',
  childProfiles = [],
  onSwitchProfile,
  completedStories = [],
  streakCount = 3,
  onAdvanceStreak,
  onSelectMilestone,
  dreamEntries = [],
  savedThemeIds,
  bookmarkedThemeIds,
  savedStories = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGoodMorningOverlay, setShowGoodMorningOverlay] = useState(false);
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<string>('all');

  const activeSavedThemeIds = useMemo(() => {
    if (savedThemeIds && savedThemeIds.length > 0) return savedThemeIds;
    if (bookmarkedThemeIds && bookmarkedThemeIds.length > 0) return bookmarkedThemeIds;
    try {
      const stored = localStorage.getItem('infinite_heroes_bookmarked_themes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['theme-cosmic-voyage', 'theme-ancient-forest'];
  }, [savedThemeIds, bookmarkedThemeIds]);

  const activeSavedStories = useMemo(() => {
    if (savedStories && savedStories.length > 0) return savedStories;
    try {
      const stored = localStorage.getItem('infinite_heroes_saved_stories');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }, [savedStories]);

  const savedThemesList = useMemo(() => {
    return resolveSavedThemes(activeSavedThemeIds);
  }, [activeSavedThemeIds]);

  const targetAgeRange = useMemo(() => {
    return getTargetAgeRange(childAge);
  }, [childAge]);

  const recommendedStoryItems = useMemo(() => {
    return getRecommendedStories({
      stories: FEATURED_STORIES,
      childAge,
      savedThemeIds: activeSavedThemeIds,
      savedStories: activeSavedStories,
      storyPreference,
      selectedThemeFilter,
      limit: 4,
    });
  }, [childAge, activeSavedThemeIds, activeSavedStories, storyPreference, selectedThemeFilter]);

  const activeAvatar = getAvatarById(childAvatar);
  const heroStory = FEATURED_STORIES[0]; // The Silver Moon Fox

  // Check if current streak is at a milestone on mount and celebrate if newly loaded
  useEffect(() => {
    const celebrationKey = `infinite_heroes_celebrated_streak_${streakCount}`;
    if (isExactMilestone(streakCount)) {
      try {
        const alreadyCelebrated = localStorage.getItem(celebrationKey);
        if (!alreadyCelebrated) {
          const timer = setTimeout(() => {
            triggerSubtleConfettiShower({
              particleCount: 50,
              playSound: true,
              intensity: 'gentle',
              originY: 0.3,
            });
            localStorage.setItem(celebrationKey, 'true');
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch {}
    }
  }, [streakCount]);

  const filteredStories = FEATURED_STORIES.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full max-w-6xl mx-auto space-y-10 pb-16 font-sans">
      
      {/* Top Header matching Image 1: 'Bedtime Chronicles' + Search + Child Avatar */}
      <header className="flex items-center justify-between pt-2 pb-2 border-b border-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border border-amber-400/50 shadow-lg shadow-amber-500/20 shrink-0 bg-indigo-950">
            <img
              src="/assets/images/splash-icon.png"
              alt="Bedtime Chronicles Star-Shield Emblem"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-playfair font-semibold tracking-wide text-white">
              Bedtime Chronicles
            </h1>
            <p className="text-[11px] text-indigo-300/80 hidden sm:block">
              Celestial Guardians &bull; Calming Soundscapes &bull; Starlit Tales
            </p>
          </div>
        </div>

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/60 border border-indigo-900/40 text-xs text-indigo-200">
        <div className="flex items-center gap-2.5">
          <span className="text-xl animate-bounce">{activeAvatar.emoji}</span>
          <span>
            Good night, <strong className="text-amber-300 font-bold">{childName}</strong>! Ready for starry adventures?
          </span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            id="home-greeting-morning-check-btn"
            onClick={() => setShowGoodMorningOverlay(true)}
            className="px-2.5 py-1 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
            title="Good Morning! Check your bedtime streak & review last night's dream"
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span>Good Morning</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 hover:underline underline-offset-2"
          >
            <span>Avatar & Routine</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
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

      {/* QUICK-START BEDTIME CARD (Time-of-day & Historical Pattern AI Routine Suggester) */}
      <QuickStartBedtimeCard
        onSelectStory={onSelectStory}
        onOpenGuidedBreathing={onOpenGuidedBreathing || (() => {})}
        childName={childName}
        childAge={childAge}
        completedStories={completedStories}
        savedStories={activeSavedStories}
        streakCount={streakCount}
      />

      {/* STORY GALAXY MAP: Interactive Visual Cosmic Constellations & Revisit Hub */}
      <StoryGalaxyMap
        completedStories={completedStories}
        onSelectStory={onSelectStory}
        onOpenDetails={onOpenDetails}
        onOpenLibrary={onOpenLibrary}
        onOpenCreator={onOpenCreator}
        childName={childName}
      />

      {/* DAILY BEDTIME READING STREAK & CONSISTENCY MILESTONE CARD */}
      <DailyStreakMilestoneCard
        currentStreak={streakCount}
        childName={childName}
        onAdvanceStreak={onAdvanceStreak}
        onSelectMilestone={onSelectMilestone}
        onCheckMorningStreak={() => setShowGoodMorningOverlay(true)}
      />

      {/* DAILY BEDTIME AFFIRMATION OF THE DAY (Profile-Personalized) */}
      <DailyAffirmationWidget
        childName={childName}
        childAge={childAge}
        childAvatar={childAvatar}
        storyPreference={storyPreference}
        gentleMode={gentleMode}
        activeChildProfileId={activeChildProfileId}
        availableProfiles={childProfiles}
        onSwitchProfile={onSwitchProfile}
        onOpenWindDown={onOpenWindDown}
        onOpenSettings={onOpenSettings}
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
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              id="listen-now-hero-btn"
              onClick={() => onSelectStory(heroStory)}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-xs sm:text-sm bg-[#f2cb6c] hover:bg-[#ebd07f] text-[#1e1403] shadow-xl shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 min-h-[44px]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Listen Now</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(heroStory)}
              className="px-5 sm:px-6 py-3 rounded-full font-semibold text-xs sm:text-sm bg-[#1b1535]/80 hover:bg-[#271f4b] text-slate-200 hover:text-white border border-slate-700/70 transition-all min-h-[44px] flex items-center justify-center"
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
            id: 'guided-breathing',
            label: 'Guided Breathing',
            icon: Wind,
            action: onOpenGuidedBreathing ? onOpenGuidedBreathing : () => onOpenLibrary('Guided Meditation'),
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

      {/* GUIDED BREATHING BANNER: Settle Down Before Storytime */}
      {onOpenGuidedBreathing && (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#140e32]/90 via-[#0d0926]/95 to-[#160f38]/90 border border-indigo-900/60 p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400/20 via-indigo-500/20 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
              <Wind className="w-7 h-7 animate-pulse text-cyan-300" />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>Bedtime Wind-Down Ritual</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold font-playfair text-white tracking-wide">
                Guided Bedtime Breathing
              </h3>
              <p className="text-xs text-slate-300 max-w-md font-light">
                Expand and contract with the glowing starlight orb and calm ambient audio to help {childName} gently unwind.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="home-guided-breathing-cta-btn"
            onClick={onOpenGuidedBreathing}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap min-h-[44px]"
          >
            <Wind className="w-4 h-4" />
            <span>Open Breathing Orb</span>
          </button>
        </section>
      )}

      {/* RECOMMENDED FOR YOU SECTION */}
      <section
        id="recommended-for-you-section"
        data-testid="recommended-for-you-section"
        className="space-y-4 pt-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-playfair font-bold text-white tracking-wide">
                Recommended for You
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-1.5 font-sans">
              <span>Personalized for</span>
              <span className="font-semibold text-amber-200">{childName}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                Age {childAge} • Bracket {targetAgeRange}
              </span>
              <span className="text-slate-400">• Filtered by your saved bedtime themes</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenThemes && (
              <button
                type="button"
                id="recommended-open-themes-btn"
                onClick={onOpenThemes}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/60 hover:border-indigo-600/70 text-indigo-200 hover:text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Dream Themes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              id="recommended-see-all-btn"
              onClick={() => onOpenLibrary()}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/60 hover:border-slate-500/70 text-slate-300 hover:text-white flex items-center gap-1 transition-all"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Interactive Filter Pills: Age Tag + Saved Theme Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* Active Age Indicator Pill */}
          <div
            id="recommended-age-pill"
            data-testid="recommended-age-pill"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-400/40 text-amber-200 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Age {childAge} ({targetAgeRange})</span>
          </div>

          {/* All Saved Themes Pill */}
          <button
            type="button"
            id="theme-filter-pill-all"
            data-testid="theme-filter-pill-all"
            onClick={() => setSelectedThemeFilter('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              selectedThemeFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/20 ring-1 ring-amber-300'
                : 'bg-[#140f32] text-slate-300 hover:text-white border border-indigo-900/70 hover:border-indigo-700'
            }`}
          >
            <span>All Saved Themes</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedThemeFilter === 'all'
                  ? 'bg-slate-900/30 text-slate-950'
                  : 'bg-indigo-950 text-indigo-300'
              }`}
            >
              {recommendedStoryItems.length}
            </span>
          </button>

          {/* Filter Pills for each previously saved theme */}
          {savedThemesList.map((theme) => {
            const isSelected = selectedThemeFilter === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                id={`theme-filter-pill-${theme.id}`}
                data-testid={`theme-filter-pill-${theme.id}`}
                onClick={() => setSelectedThemeFilter(isSelected ? 'all' : theme.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400 border border-indigo-400'
                    : 'bg-[#140f32] text-slate-300 hover:text-white border border-indigo-900/70 hover:border-indigo-700'
                }`}
              >
                <span>{theme.emoji}</span>
                <span>{theme.title}</span>
              </button>
            );
          })}
        </div>

        {/* 4 Story Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedStoryItems.map((item) => {
            const { story, matchedAge, matchedThemeTitle, isPerfectMatch } = item;
            return (
              <div
                key={story.id}
                id={`recommended-story-card-${story.id}`}
                data-testid={`recommended-story-card-${story.id}`}
                className="group relative rounded-2xl overflow-hidden bg-[#0e0a24] border border-indigo-950/80 hover:border-indigo-600/70 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-950/50 flex flex-col justify-between"
              >
                {/* Cover Art with Badges */}
                <div
                  onClick={() => onSelectStory(story)}
                  className="cursor-pointer relative aspect-[4/5] w-full overflow-hidden bg-slate-900"
                >
                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0e0a24] flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-indigo-400/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a24] via-black/10 to-black/30" />

                  {/* Top Badges: Age Range + Duration */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase backdrop-blur-md border shadow-md ${
                        matchedAge
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                          : 'bg-indigo-950/80 text-indigo-300 border-indigo-600/40'
                      }`}
                    >
                      Ages {story.ageRange}
                    </span>

                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-black/70 backdrop-blur-md text-amber-300 border border-white/10 shadow-md">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{story.audioDurationMinutes || 8} MIN</span>
                    </span>
                  </div>

                  {/* Highlight Reason Tag at Bottom of Cover */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap gap-1 pointer-events-none">
                    {matchedThemeTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-900/90 backdrop-blur-md text-indigo-200 border border-indigo-500/40 shadow-sm">
                        <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                        <span className="truncate max-w-[130px]">{matchedThemeTitle}</span>
                      </span>
                    )}
                    {isPerfectMatch && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md shadow-sm">
                        Best Fit
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Metadata & Actions */}
                <div className="p-4 pt-3 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-sans mb-1">
                      <span className="text-indigo-300 font-medium">{story.category}</span>
                      <span className="capitalize text-slate-400">{story.theme}</span>
                    </div>

                    <h4
                      onClick={() => onSelectStory(story)}
                      className="cursor-pointer text-sm font-playfair font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                    >
                      {story.title}
                    </h4>

                    {story.summary && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {story.summary}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons: Listen Now + Details */}
                  <div className="pt-2 border-t border-indigo-950/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectStory(story)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Listen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDetails(story)}
                      className="py-2 px-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 hover:border-indigo-600 text-indigo-300 hover:text-white text-xs font-medium transition-all"
                      title="View Details"
                      aria-label={`View details for ${story.title}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if user filtered to a theme with no match */}
        {recommendedStoryItems.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-[#0e0a24]/60 border border-indigo-950/80 space-y-3">
            <p className="text-sm text-slate-300">
              No bedtime stories match this specific theme for Age {childAge} right now.
            </p>
            <button
              type="button"
              onClick={() => setSelectedThemeFilter('all')}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              Show All Recommended Stories
            </button>
          </div>
        )}
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

      {/* GOOD MORNING SUN-RISING ANIMATION & DREAM SUMMARY OVERLAY */}
      <GoodMorningOverlay
        isOpen={showGoodMorningOverlay}
        onClose={() => setShowGoodMorningOverlay(false)}
        streakCount={streakCount}
        childName={childName}
        childAvatar={childAvatar}
        lastDreamEntry={dreamEntries && dreamEntries.length > 0 ? dreamEntries[0] : null}
        onOpenDreamJournal={onOpenDreamJournal}
        onOpenStoryLibrary={() => onOpenLibrary()}
      />
    </div>
  );
};
