import React, { useState, useMemo } from 'react';
import { Story, StorySeed } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { STORY_SEEDS } from '../data/storySeeds';
import { getHeroById } from '../data/heroes';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import {
  Search,
  Play,
  Clock,
  Moon,
  Compass,
  Bookmark,
  CheckCircle2,
  WifiOff,
  SlidersHorizontal,
  RotateCcw,
  Star,
  Settings,
  ArrowLeft,
  X,
  ChevronRight,
  Info,
  Rocket,
  Wand2,
} from 'lucide-react';

interface LibraryViewProps {
  onSelectStory: (story: Story) => void;
  onSaveStory: (story: Story) => void;
  savedStoryIds: string[];
  isOnline?: boolean;
  onOpenSettings?: () => void;
  onBack?: () => void;
}

export type CategoryFilter = 'all' | 'Cosmic' | 'Magical' | 'Winter' | 'Oceanic' | 'Bedtime Calm';
export type SubTabOption = 'crafted' | 'arrivals' | 'favorites';

interface ThematicCategory {
  id: CategoryFilter;
  label: string;
  image: string;
}

const THEMATIC_CATEGORIES: ThematicCategory[] = [
  {
    id: 'Cosmic',
    label: 'Cosmic',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoKk36V8dFYivJt4Nxgr5NPtOBud3OXjibZM8Uh7idzJhEcPL7mvt13QwqSwFGht3CBlDWIzOHAObliUzIHGegUdVWanS-N7Jm_O3fiKZ7d28fXO0FaR5KesUAgev2m7BiNaSkVrtNJsphLsbE-_ZmOsCpzfyP2EXOtU-ZPdQaTH4AdrjaujtAE2yb3eDJUVP2Aj3j6wKlgDPhG_9vgh7y0Rm6GeD3Zmhy1nGUuewXWNDsA-nog7FeYIUO6TLmdzx96WnwJX610F4',
  },
  {
    id: 'Magical',
    label: 'Magical',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXYY5sEzIMkmCZxpwmPxTAE567Z1dYGXa-A7_wdfiAMqqp987qKvzRVYmsJkT2KvDagS5_PWN27siIeMecGGu5QNcoJpZ8wPlSYw8svqSCAm_SjSp0mTlZkjx-9HRZJlPf9Lxxkr3VhCKb43v2aG4Clr47TBOGpQ8XHsfIhJToGG-tpZS7Ad1szU2XibKGhro7j6dummDmk4seXiN2FNl4L1oE1c4uLIu5SIHYsTnyp6LaMk_HllgtttiddjIcWK-cOOw05vMAKVg',
  },
  {
    id: 'Winter',
    label: 'Winter',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxfX-zx6ghTtr6RHzEcaYpeDEtGkLXXY3g-4XH3Feres50IILX_eV9O1441iGHM4RBnND6fMiqIpimJJypLgS2jLxazLFagzTPYje40tVLXCE6tCnXUmZ2M2HQ-00ESHe0bxYx9_RVhH7RcnmRYHgzj2Uozhhz8XH5CA9kDHs0v0eC1Ly6wWvrSXDWxkuNmRbhdMdxAENeqEZ0cAi8cLoBPZHj_eKoHNeDwMHrEXAhVCCwrdTiJ45F2YbX4wK36vRgBKSeYu81yr0',
  },
  {
    id: 'Oceanic',
    label: 'Oceanic',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6OXTfL_mvShYyP7odXhDKPfSCtCM4CgJgoXWLzMtI35bPyiF91Zn7B2OOO7udMQoLHd6IqMB_qo_t8nUy1e72GYauFjWmGBe2JMG5ngwMXHG47FD3yVPWmjmtE-EDn2kxCv7Lc3DP4PKnkh4PG8OmzKNdH76TWyNR_mT_XsA4utDdcQN_iBBLlyQpovds5o2q0bkJ0G-uHWWZ3VcU3-jfE8D8oBEgRgL8vQnWyMAW5HRQtXhuXTjDnW29xspQwJEERx68i_7Gl74',
  },
];

function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Oceanic':
    case 'Ocean Wonders':
      return { bg: 'bg-sky-950/70', text: 'text-sky-300', border: 'border-sky-500/40' };
    case 'Magical':
    case 'Bedtime Calm':
      return { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'Cosmic':
    case 'Cosmic Adventures':
      return { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-500/40' };
    case 'Winter':
      return { bg: 'bg-cyan-950/70', text: 'text-cyan-300', border: 'border-cyan-500/40' };
    case 'Forest & Nature':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    default:
      return { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-500/40' };
  }
}

function matchesCategory(storyCategory: string, selectedCat: CategoryFilter): boolean {
  if (selectedCat === 'all') return true;
  if (selectedCat === 'Cosmic') {
    return storyCategory === 'Cosmic' || storyCategory === 'Cosmic Adventures';
  }
  if (selectedCat === 'Oceanic') {
    return storyCategory === 'Oceanic' || storyCategory === 'Ocean Wonders';
  }
  if (selectedCat === 'Magical') {
    return storyCategory === 'Magical' || storyCategory === 'Bedtime Calm' || storyCategory === 'Heartwarming Fables';
  }
  if (selectedCat === 'Winter') {
    return storyCategory === 'Winter';
  }
  return storyCategory === selectedCat;
}

function getSeedCategory(seed: StorySeed): string {
  if (seed.category) return seed.category;
  const set = (seed.setting || '').toLowerCase();
  if (
    set.includes('ocean') ||
    set.includes('lagoon') ||
    set.includes('reef') ||
    set.includes('water') ||
    set.includes('glowfish')
  ) {
    return 'Oceanic';
  }
  if (
    set.includes('forest') ||
    set.includes('pine') ||
    set.includes('meadow') ||
    set.includes('wood') ||
    set.includes('tree') ||
    set.includes('garden')
  ) {
    return 'Forest & Nature';
  }
  if (
    set.includes('star') ||
    set.includes('crystal') ||
    set.includes('sky') ||
    set.includes('milky') ||
    set.includes('cloud') ||
    set.includes('peaks') ||
    set.includes('cavern')
  ) {
    return 'Cosmic';
  }
  return 'Magical';
}

function getSeedDuration(seed: StorySeed): number {
  if (seed.audioDurationMinutes) return seed.audioDurationMinutes;
  return 5 + (seed.title.length % 6);
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectStory,
  onSaveStory,
  savedStoryIds,
  isOnline = true,
  onOpenSettings,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [subTab, setSubTab] = useState<SubTabOption>('crafted');
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showSeedsVault, setShowSeedsVault] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('all');

  // Hero Story (Editor's pick: The Starry Whales or The Boy Who Caught a Star)
  const heroStory = useMemo(() => {
    return (
      FEATURED_STORIES.find((s) => s.id === 'story-starry-whales') ||
      FEATURED_STORIES.find((s) => s.isEditorPick) ||
      FEATURED_STORIES[0]
    );
  }, []);

  // Filtered stories according to search query, category, and sub-tab
  const filteredStories = useMemo(() => {
    return FEATURED_STORIES.filter((story) => {
      // Search matching
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        story.title.toLowerCase().includes(q) ||
        story.summary.toLowerCase().includes(q) ||
        story.heroName.toLowerCase().includes(q) ||
        story.category.toLowerCase().includes(q) ||
        (story.badge && story.badge.toLowerCase().includes(q));

      // Category matching
      const matchesCat = matchesCategory(story.category, selectedCategory);

      // Duration matching
      const duration = story.audioDurationMinutes || 10;
      let matchesDur = true;
      if (selectedDuration === 'quick') matchesDur = duration < 8;
      if (selectedDuration === 'medium') matchesDur = duration >= 8 && duration <= 12;
      if (selectedDuration === 'extended') matchesDur = duration > 12;

      // Sub-tab matching
      let matchesTab = true;
      if (subTab === 'favorites') {
        matchesTab = savedStoryIds.includes(story.id);
      } else if (subTab === 'arrivals') {
        matchesTab =
          story.badge === 'New Arrival' ||
          (story.tags && story.tags.includes('New Arrivals')) ||
          story.id.includes('astro') ||
          story.id.includes('giggles') ||
          story.id.includes('moon-owl');
      }

      return matchesSearch && matchesCat && matchesDur && matchesTab;
    });
  }, [searchQuery, selectedCategory, selectedDuration, subTab, savedStoryIds]);

  // Specific groups for UI sections
  const newArrivalStories = useMemo(() => {
    return FEATURED_STORIES.filter(
      (s) =>
        s.badge === 'New Arrival' ||
        (s.tags && s.tags.includes('New Arrivals')) ||
        s.id === 'story-astro-pups' ||
        s.id === 'story-planet-giggles' ||
        s.id === 'story-moon-owl'
    );
  }, []);

  const allCraftedStories = useMemo(() => {
    return FEATURED_STORIES.filter(
      (s) =>
        s.badge === 'All Crafted' ||
        s.id === 'story-galaxy-book' ||
        s.id === 'story-earths-lullaby' ||
        s.id === 'story-journey-core'
    );
  }, []);

  // Filtered seeds for the vault
  const filteredSeeds = useMemo(() => {
    return STORY_SEEDS.filter((seed) => {
      const q = searchQuery.toLowerCase().trim();
      const hero = getHeroById(seed.suggestedHeroId);
      const cat = getSeedCategory(seed);
      return (
        q === '' ||
        seed.title.toLowerCase().includes(q) ||
        seed.blurb.toLowerCase().includes(q) ||
        hero.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const handleLaunchSeed = (seed: StorySeed) => {
    const category = getSeedCategory(seed);
    const duration = getSeedDuration(seed);
    const generated = generateCustomBedtimeStory({
      heroId: seed.suggestedHeroId,
      theme: seed.theme,
      mode: seed.mode,
      ageRange: seed.ageRange,
      customPrompt: seed.title,
      setting: seed.setting,
      sidekick: seed.sidekick,
      problem: seed.problem,
    });
    generated.category = category;
    generated.audioDurationMinutes = duration;
    onSelectStory(generated);
  };

  const handleToggleCategory = (catId: CategoryFilter) => {
    setSelectedCategory((prev) => (prev === catId ? 'all' : catId));
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 font-jakarta">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/70 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Offline Library Active
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  Cached
                </span>
              </h4>
              <p className="text-xs text-indigo-300/80">
                All master stories and audio narrations are cached on your device.
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600/40 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </span>
        </div>
      )}

      {/* Top Application Bar matching screenshot header */}
      <header className="flex items-center justify-between gap-4 py-2">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-400/60 hover:bg-slate-800 transition-all shadow-md"
          title="Back to Home"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="font-bangers text-3xl sm:text-4xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-purple-200 drop-shadow-[0_0_12px_rgba(192,193,255,0.45)]">
            Infinity Heroes
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-400/60 hover:bg-slate-800 transition-all shadow-md"
          title="Settings and Preferences"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Search Input Bar (rounded capsule matching screenshots) */}
      <div className="relative max-w-xl mx-auto w-full">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-indigo-300/80 absolute left-4 pointer-events-none" />
          <input
            type="text"
            id="library-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a magical tale..."
            className="w-full pl-11 pr-10 py-3 rounded-full bg-slate-900/70 border border-slate-700/80 hover:border-indigo-500/50 focus:border-indigo-400 text-sm text-white placeholder-slate-400 shadow-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-white bg-slate-800/60"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Thematic Categories Cards matching screenshot row */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold px-1">
            Categories
          </h2>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Show All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMATIC_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`group relative h-28 sm:h-32 rounded-2xl overflow-hidden border transition-all duration-300 text-left flex flex-col justify-end p-3 ${
                  isSelected
                    ? 'border-indigo-400 ring-2 ring-indigo-400/50 scale-[1.02] shadow-lg shadow-indigo-900/50'
                    : 'border-slate-800 hover:border-indigo-500/50 hover:scale-[1.01]'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 transition-opacity ${
                    isSelected
                      ? 'bg-gradient-to-t from-indigo-950/90 via-slate-950/50 to-transparent'
                      : 'bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent'
                  }`}
                />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-bold text-sm sm:text-base text-white drop-shadow-md">
                    {cat.label}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/30" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sub-Navigation Tabs matching screenshots: All Crafted | New Arrivals | Favorites */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pt-2">
        <div className="flex items-center gap-6 text-sm font-bold">
          <button
            type="button"
            onClick={() => setSubTab('crafted')}
            className={`pb-3 relative transition-colors ${
              subTab === 'crafted'
                ? 'text-indigo-300 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_0_8px_rgba(129,140,248,0.9)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Crafted
          </button>

          <button
            type="button"
            onClick={() => setSubTab('arrivals')}
            className={`pb-3 relative transition-colors flex items-center gap-1.5 ${
              subTab === 'arrivals'
                ? 'text-indigo-300 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_0_8px_rgba(129,140,248,0.9)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>New Arrivals</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setSubTab('favorites')}
            className={`pb-3 relative transition-colors flex items-center gap-1.5 ${
              subTab === 'favorites'
                ? 'text-indigo-300 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_0_8px_rgba(129,140,248,0.9)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Favorites</span>
            {savedStoryIds.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                {savedStoryIds.length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Drawer Toggle */}
        <button
          type="button"
          onClick={() => setShowFiltersDrawer((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all mb-2 ${
            showFiltersDrawer || selectedDuration !== 'all'
              ? 'bg-indigo-950/70 border-indigo-500 text-indigo-200'
              : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
          }`}
          title="Toggle duration filters"
        >
          <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
          <span>Filters</span>
          {selectedDuration !== 'all' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          )}
        </button>
      </div>

      {/* Expanded Duration Filter Panel */}
      {showFiltersDrawer && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Reading Duration:</span>
            {(['all', 'quick', 'medium', 'extended'] as const).map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setSelectedDuration(dur)}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  selectedDuration === dur
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {dur === 'all' && 'All Durations'}
                {dur === 'quick' && '⚡ Quick (< 8 min)'}
                {dur === 'medium' && '📖 Standard (8–12 min)'}
                {dur === 'extended' && '🌌 Extended (13+ min)'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedDuration('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 text-xs font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        </div>
      )}

      {/* Hero Feature Banner (Editor's Pick: The Starry Whales) */}
      {subTab === 'crafted' && selectedCategory === 'all' && !searchQuery && heroStory && (
        <section className="relative rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl group">
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-950">
            <img
              src={heroStory.coverImage}
              alt={heroStory.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#05051e] via-[#05051e]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#05051e]/80 via-transparent to-black/40" />

            {/* Content Details */}
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400">
                    Editor&apos;s Pick
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/60 backdrop-blur-md text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    <span>{heroStory.audioDurationMinutes || 12} min read • Cosmic</span>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-bangers tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {heroStory.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-200/90 line-clamp-2 leading-relaxed">
                  {heroStory.summary}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectStory(heroStory)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/40 transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Listen Story</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSaveStory(heroStory)}
                    className={`p-2.5 rounded-full border transition-all ${
                      savedStoryIds.includes(heroStory.id)
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Bookmark Story"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewStory(heroStory)}
                    className="p-2.5 rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
                    title="Story Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid: Stories (Bento-style layout matching screenshots) */}
      <section className="space-y-4">
        {filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStories.map((story) => {
              const isSaved = savedStoryIds.includes(story.id);
              const catColors = getCategoryColor(story.category);

              return (
                <div
                  key={story.id}
                  className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/60 shadow-xl transition-all duration-300 hover:scale-[1.01] overflow-hidden flex flex-col justify-between"
                >
                  {/* Image with Tag Overlay */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                    <img
                      src={story.coverImage}
                      alt={story.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                    {/* Top Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border ${catColors.bg} ${catColors.text} ${catColors.border}`}
                      >
                        {story.badge || story.category}
                      </span>

                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 backdrop-blur-md text-amber-200 border border-amber-500/30">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        <span>{story.audioDurationMinutes || 10}m</span>
                      </span>
                    </div>

                    {/* Quick Play Button on Hover */}
                    <button
                      type="button"
                      onClick={() => onSelectStory(story)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 duration-300 hover:bg-indigo-500"
                      title="Play story"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] text-indigo-300 font-medium">
                          {story.heroName} • {story.theme}
                        </span>
                        {story.rating && (
                          <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-300">
                            <Star className="w-3 h-3 fill-current text-amber-400" />
                            <span>{story.rating}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {story.title}
                      </h4>

                      <p className="text-xs text-slate-300/80 line-clamp-2 mt-1 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => setPreviewStory(story)}
                        className="text-xs font-semibold text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSaveStory(story)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isSaved
                              ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Bookmark story"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectStory(story)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Listen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <Moon className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
            <h4 className="text-base font-bold text-white">No stories found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No bedtime stories match &ldquo;{searchQuery}&rdquo; in this category. Try selecting &ldquo;Show All&rdquo; or resetting filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDuration('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </section>

      {/* New Arrivals Section */}
      {subTab === 'crafted' && !searchQuery && selectedCategory === 'all' && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm uppercase tracking-wider font-extrabold text-white">
              New Arrivals
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {newArrivalStories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story)}
                className="group p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-pink-500/50 transition-all flex items-center gap-3 cursor-pointer hover:bg-slate-800/60"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {story.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {story.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-semibold text-amber-300 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {story.audioDurationMinutes}m
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">•</span>
                    <span className="text-[10px] text-indigo-300 font-medium">
                      {story.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Crafted Highlights Section */}
      {subTab === 'crafted' && !searchQuery && selectedCategory === 'all' && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm uppercase tracking-wider font-extrabold text-white">
              All Crafted
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {allCraftedStories.map((story) => (
              <div
                key={story.id}
                onClick={() => onSelectStory(story)}
                className="group p-3 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-3 cursor-pointer hover:bg-slate-800/60"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {story.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {story.summary}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {story.rating && (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {story.rating}
                      </span>
                    )}
                    <span className="text-[10px] font-medium text-slate-500">•</span>
                    <span className="text-[10px] text-indigo-300 font-medium">
                      {story.audioDurationMinutes}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expandable Story Seeds Vault */}
      <section className="pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => setShowSeedsVault((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Story Seeds Vault ({filteredSeeds.length} ideas)
              </h4>
              <p className="text-[11px] text-slate-400">
                Generate instant custom bedtime tales from creative story prompts
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-5 h-5 text-slate-400 transition-transform ${
              showSeedsVault ? 'rotate-90' : ''
            }`}
          />
        </button>

        {showSeedsVault && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {filteredSeeds.slice(0, 12).map((seed) => {
              const hero = getHeroById(seed.suggestedHeroId);
              const duration = getSeedDuration(seed);

              return (
                <div
                  key={seed.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{seed.emoji}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                        {duration}m
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{seed.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {seed.blurb}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 truncate max-w-[100px]">{hero.name}</span>
                    <button
                      type="button"
                      onClick={() => handleLaunchSeed(seed)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white transition-all"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Launch</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Story Preview Modal */}
      {previewStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#09071c] border border-indigo-500/40 shadow-2xl overflow-hidden text-white flex flex-col">
            {/* Header Image */}
            <div className="relative h-48 w-full bg-slate-900">
              <img
                src={previewStory.coverImage}
                alt={previewStory.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09071c] via-transparent to-black/50" />
              <button
                type="button"
                onClick={() => setPreviewStory(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white border border-indigo-400">
                  {previewStory.category}
                </span>
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-black/70 text-amber-300">
                  <Clock className="w-3 h-3" />
                  <span>{previewStory.audioDurationMinutes} min</span>
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-indigo-300 font-medium mb-1">
                  Hero: {previewStory.heroName} • {previewStory.theme}
                </div>
                <h3 className="text-xl font-bold font-playfair text-white">
                  {previewStory.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  {previewStory.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                  Ages: {previewStory.ageRange}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 capitalize">
                  Mode: {previewStory.mode}
                </span>
                {previewStory.rating && (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-300 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {previewStory.rating} / 5.0
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onSaveStory(previewStory);
                  }}
                  className={`p-2.5 rounded-xl border text-xs transition-colors ${
                    savedStoryIds.includes(previewStory.id)
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Bookmark"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const storyToPlay = previewStory;
                    setPreviewStory(null);
                    onSelectStory(storyToPlay);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Bedtime Journey</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
