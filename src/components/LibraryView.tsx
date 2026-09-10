import React, { useState, useMemo } from 'react';
import { Story, StorySeed } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { STORY_SEEDS } from '../data/storySeeds';
import { getHeroById } from '../data/heroes';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import {
  Search,
  Sparkles,
  Play,
  Clock,
  Moon,
  Compass,
  Bookmark,
  CheckCircle2,
  WifiOff,
  SlidersHorizontal,
  RotateCcw,
  Waves,
  Heart,
  TreePine,
  Star,
} from 'lucide-react';

interface LibraryViewProps {
  onSelectStory: (story: Story) => void;
  onSaveStory: (story: Story) => void;
  savedStoryIds: string[];
  isOnline?: boolean;
}

export type CategoryFilter =
  | 'all'
  | 'Bedtime Calm'
  | 'Ocean Wonders'
  | 'Cosmic Adventures'
  | 'Forest & Nature'
  | 'Heartwarming Fables';

export type DurationFilter = 'all' | 'quick' | 'medium' | 'extended';
export type SortOption = 'featured' | 'duration-asc' | 'duration-desc' | 'category' | 'title';

const CATEGORIES: { id: CategoryFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'all', label: 'All Categories', icon: <Sparkles className="w-3.5 h-3.5" />, color: '#818CF8' },
  { id: 'Bedtime Calm', label: 'Bedtime Calm', icon: <Moon className="w-3.5 h-3.5" />, color: '#A78BFA' },
  { id: 'Ocean Wonders', label: 'Ocean Wonders', icon: <Waves className="w-3.5 h-3.5" />, color: '#38BDF8' },
  { id: 'Cosmic Adventures', label: 'Cosmic Adventures', icon: <Star className="w-3.5 h-3.5" />, color: '#FBBF24' },
  { id: 'Forest & Nature', label: 'Forest & Nature', icon: <TreePine className="w-3.5 h-3.5" />, color: '#34D399' },
  { id: 'Heartwarming Fables', label: 'Heartwarming Fables', icon: <Heart className="w-3.5 h-3.5" />, color: '#F472B6' },
];

function getCategoryColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Ocean Wonders':
      return { bg: 'bg-sky-950/70', text: 'text-sky-300', border: 'border-sky-500/40' };
    case 'Bedtime Calm':
      return { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'Cosmic Adventures':
      return { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-500/40' };
    case 'Forest & Nature':
      return { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-500/40' };
    case 'Heartwarming Fables':
      return { bg: 'bg-pink-950/70', text: 'text-pink-300', border: 'border-pink-500/40' };
    default:
      return { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-500/40' };
  }
}

function getSeedCategory(seed: StorySeed): string {
  if (seed.category) return seed.category;
  const set = (seed.setting || '').toLowerCase();
  const theme = (seed.theme || '').toLowerCase();
  if (
    set.includes('ocean') ||
    set.includes('lagoon') ||
    set.includes('reef') ||
    set.includes('water') ||
    set.includes('glowfish')
  ) {
    return 'Ocean Wonders';
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
    return 'Cosmic Adventures';
  }
  if (theme === 'kindness' || theme === 'friendship') {
    return 'Heartwarming Fables';
  }
  return 'Bedtime Calm';
}

function getSeedDuration(seed: StorySeed): number {
  if (seed.audioDurationMinutes) return seed.audioDurationMinutes;
  return 5 + (seed.title.length % 6);
}

function matchesDuration(durationMinutes: number, filter: DurationFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'quick') return durationMinutes < 8;
  if (filter === 'medium') return durationMinutes >= 8 && durationMinutes <= 12;
  if (filter === 'extended') return durationMinutes > 12;
  return true;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectStory,
  onSaveStory,
  savedStoryIds,
  isOnline = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');

  const isFiltered =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedDuration !== 'all' ||
    selectedTheme !== 'all' ||
    selectedAge !== 'all' ||
    selectedMode !== 'all' ||
    sortBy !== 'featured';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDuration('all');
    setSortBy('featured');
    setSelectedTheme('all');
    setSelectedAge('all');
    setSelectedMode('all');
  };

  // Category counts for quick badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: FEATURED_STORIES.length };
    FEATURED_STORIES.forEach((st) => {
      counts[st.category] = (counts[st.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredFeaturedStories = useMemo(() => {
    const filtered = FEATURED_STORIES.filter((story) => {
      const matchesSearch =
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.heroName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || story.category === selectedCategory;
      const duration = story.audioDurationMinutes || 10;
      const matchesDur = matchesDuration(duration, selectedDuration);
      const matchesTh = selectedTheme === 'all' || story.theme === selectedTheme;
      const matchesAg = selectedAge === 'all' || story.ageRange === selectedAge;
      const matchesMd = selectedMode === 'all' || story.mode === selectedMode;

      return matchesSearch && matchesCat && matchesDur && matchesTh && matchesAg && matchesMd;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'duration-asc':
        return sorted.sort((a, b) => (a.audioDurationMinutes || 10) - (b.audioDurationMinutes || 10));
      case 'duration-desc':
        return sorted.sort((a, b) => (b.audioDurationMinutes || 10) - (a.audioDurationMinutes || 10));
      case 'category':
        return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'featured':
      default:
        return sorted;
    }
  }, [searchQuery, selectedCategory, selectedDuration, sortBy, selectedTheme, selectedAge, selectedMode]);

  const filteredSeeds = useMemo(() => {
    const filtered = STORY_SEEDS.filter((seed) => {
      const hero = getHeroById(seed.suggestedHeroId);
      const category = getSeedCategory(seed);
      const duration = getSeedDuration(seed);

      const matchesSearch =
        seed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seed.blurb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hero.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || category === selectedCategory;
      const matchesDur = matchesDuration(duration, selectedDuration);
      const matchesTh = selectedTheme === 'all' || seed.theme === selectedTheme;
      const matchesAg = selectedAge === 'all' || seed.ageRange === selectedAge;
      const matchesMd = selectedMode === 'all' || seed.mode === selectedMode;

      return matchesSearch && matchesCat && matchesDur && matchesTh && matchesAg && matchesMd;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'duration-asc':
        return sorted.sort((a, b) => getSeedDuration(a) - getSeedDuration(b));
      case 'duration-desc':
        return sorted.sort((a, b) => getSeedDuration(b) - getSeedDuration(a));
      case 'category':
        return sorted.sort((a, b) => getSeedCategory(a).localeCompare(getSeedCategory(b)));
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'featured':
      default:
        return sorted;
    }
  }, [searchQuery, selectedCategory, selectedDuration, sortBy, selectedTheme, selectedAge, selectedMode]);

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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Offline Alert Banner in Library */}
      {!isOnline && (
        <div className="p-4 rounded-3xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-900/70 border border-indigo-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Offline Library Active
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                  Cached for Bedtime
                </span>
              </h4>
              <p className="text-xs text-indigo-300/80 mt-0.5">
                All featured master stories and local story seeds are cached and ready to play offline with audio narration.
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-300 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-600/40 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Service Worker Cached</span>
          </span>
        </div>
      )}

      {/* Main Search, Category, Duration & Sort Control Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-4">
        {/* Row 1: Search Bar + Sort Dropdown + Duration Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="library-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by story title, hero, keywords, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>

          {/* Duration Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="duration-select" className="text-xs text-slate-400 font-semibold shrink-0 hidden sm:inline">
              Duration:
            </label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="duration-select"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as DurationFilter)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
                title="Filter by reading duration"
              >
                <option value="all">⏱️ All Durations</option>
                <option value="quick">⚡ Quick (&lt; 8 min)</option>
                <option value="medium">📖 Standard (8–12 min)</option>
                <option value="extended">🌌 Extended (13+ min)</option>
              </select>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="sort-select" className="text-xs text-slate-400 font-semibold shrink-0 hidden sm:inline">
              Sort:
            </label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-400 transition-colors cursor-pointer"
                title="Sort stories by duration, category, or title"
              >
                <option value="featured">🌟 Featured</option>
                <option value="duration-asc">⏱️ Duration: Shortest First</option>
                <option value="duration-desc">⏱️ Duration: Longest First</option>
                <option value="category">🏷️ Category (A–Z)</option>
                <option value="title">🔤 Title (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Reset Filters button if any active */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs font-semibold text-rose-300 hover:bg-rose-900/70 hover:text-white transition-all shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filter by Category:</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Showing {filteredFeaturedStories.length} master {filteredFeaturedStories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = cat.id === 'all' ? FEATURED_STORIES.length : categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold shrink-0 transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                      : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-800/90 border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-indigo-950/70 text-indigo-200' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Secondary Filters (Age, Mode, Theme) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Age Filter */}
            <select
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Ages</option>
              <option value="2-4">Ages 2-4 (Gentle)</option>
              <option value="4-6">Ages 4-6 (Preschool)</option>
              <option value="6-8">Ages 6-8 (Early Reader)</option>
              <option value="8-10">Ages 8-10 (Explorer)</option>
            </select>

            {/* Mode Filter */}
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Modes</option>
              <option value="classic">Classic Adventures</option>
              <option value="madlibs">Mad Libs Fun</option>
              <option value="sleep">Sleep Journeys</option>
            </select>

            {/* Theme Filter */}
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/80 text-xs text-slate-300 focus:outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Themes</option>
              <option value="wonder">✨ Wonder & Stars</option>
              <option value="courage">🛡️ Courage</option>
              <option value="kindness">💖 Kindness</option>
              <option value="friendship">🤝 Friendship</option>
              <option value="comfort">🌙 Sleep & Comfort</option>
            </select>
          </div>

          {/* Active Filter Indicator */}
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
            <span>
              Category: <strong className="text-indigo-300">{selectedCategory}</strong>
            </span>
            <span>•</span>
            <span>
              Duration: <strong className="text-amber-300">{selectedDuration}</strong>
            </span>
            <span>•</span>
            <span>
              Sort: <strong className="text-emerald-300">{sortBy}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Featured Master Bedtime Stories */}
      {filteredFeaturedStories.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Featured Master Stories</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              Sorted by{' '}
              {sortBy === 'duration-asc'
                ? 'Duration (Shortest First)'
                : sortBy === 'duration-desc'
                ? 'Duration (Longest First)'
                : sortBy === 'category'
                ? 'Category'
                : sortBy === 'title'
                ? 'Title'
                : 'Featured'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFeaturedStories.map((story) => {
              const hero = getHeroById(story.heroId);
              const isSaved = savedStoryIds.includes(story.id);
              const catColors = getCategoryColor(story.category);

              return (
                <div
                  key={story.id}
                  id={`featured-story-${story.id}`}
                  className="group relative rounded-3xl bg-[#0d0922] border border-indigo-950/80 hover:border-indigo-700/60 shadow-xl transition-all hover:scale-[1.01] overflow-hidden flex flex-col justify-between"
                >
                  {/* Story Cover Image header */}
                  {story.coverImage && (
                    <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0922] via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        {/* Category Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border ${catColors.bg} ${catColors.text} ${catColors.border}`}
                        >
                          {story.category}
                        </span>

                        {/* Duration Badge */}
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-amber-200 border border-amber-500/30 shadow-md">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{story.audioDurationMinutes || 10} min read</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hero.color }} />
                        <span className="text-xs text-indigo-300 font-medium">
                          {hero.name} ({hero.title})
                        </span>
                        {story.companionName && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded-full border border-purple-800/40">
                            <Heart className="w-2.5 h-2.5 text-pink-400" />
                            <span>With {story.companionName}</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-playfair font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                        {story.title}
                      </h4>

                      <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-indigo-950/80">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${catColors.bg} ${catColors.text}`}>
                            {story.category}
                          </span>
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-600/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Offline
                          </span>
                        </div>
                        {story.mode === 'sleep' && (
                          <span className="flex items-center gap-1 text-[10px] text-purple-300 font-medium mt-0.5">
                            <Moon className="w-3 h-3 text-purple-400" />
                            Sleep journey
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSaveStory(story)}
                          className={`p-2 rounded-xl border text-xs transition-colors ${
                            isSaved
                              ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title="Bookmark Story"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectStory(story)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all font-jakarta"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Listen Story</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Moon className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
          <h4 className="text-base font-bold text-white">No stories match your current filters</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your category selection, duration filter, or search query to find more bedtime stories.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}

      {/* Story Seeds Vault (Filtered and Sorted) */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Story Seeds Vault</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {filteredSeeds.length} seeds available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSeeds.slice(0, 18).map((seed) => {
            const hero = getHeroById(seed.suggestedHeroId);
            const category = getSeedCategory(seed);
            const duration = getSeedDuration(seed);
            const catColors = getCategoryColor(category);

            return (
              <div
                key={seed.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{seed.emoji}</span>
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${catColors.bg} ${catColors.text}`}>
                        {category}
                      </span>
                      <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                        <Clock className="w-2.5 h-2.5" />
                        {duration}m
                      </span>
                    </div>
                  </div>

                  <h5 className="text-sm font-bold text-white mb-1">{seed.title}</h5>
                  <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2">
                    {seed.blurb}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hero.color }} />
                    <span className="truncate max-w-[90px]">{hero.name}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLaunchSeed(seed)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-[11px] bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all"
                  >
                    <span>Launch</span>
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
