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
} from 'lucide-react';

interface LibraryViewProps {
  onSelectStory: (story: Story) => void;
  onSaveStory: (story: Story) => void;
  savedStoryIds: string[];
  isOnline?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onSelectStory,
  onSaveStory,
  savedStoryIds,
  isOnline = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');

  const filteredFeaturedStories = useMemo(() => {
    return FEATURED_STORIES.filter((story) => {
      const matchesSearch =
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.heroName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTheme = selectedTheme === 'all' || story.theme === selectedTheme;
      const matchesAge = selectedAge === 'all' || story.ageRange === selectedAge;
      const matchesMode = selectedMode === 'all' || story.mode === selectedMode;

      return matchesSearch && matchesTheme && matchesAge && matchesMode;
    });
  }, [searchQuery, selectedTheme, selectedAge, selectedMode]);

  const filteredSeeds = useMemo(() => {
    return STORY_SEEDS.filter((seed) => {
      const hero = getHeroById(seed.suggestedHeroId);
      const matchesSearch =
        seed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        seed.blurb.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hero.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTheme = selectedTheme === 'all' || seed.theme === selectedTheme;
      const matchesAge = selectedAge === 'all' || seed.ageRange === selectedAge;
      const matchesMode = selectedMode === 'all' || seed.mode === selectedMode;

      return matchesSearch && matchesTheme && matchesAge && matchesMode;
    });
  }, [searchQuery, selectedTheme, selectedAge, selectedMode]);

  const handleLaunchSeed = (seed: StorySeed) => {
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

      {/* Search & Filter Header */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-4">

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="library-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by story name, bedtime hero, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Age Filter */}
          <select
            value={selectedAge}
            onChange={(e) => setSelectedAge(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-400"
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
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All Modes</option>
            <option value="classic">Classic Adventures</option>
            <option value="madlibs">Mad Libs Fun</option>
            <option value="sleep">Sleep Journeys</option>
          </select>
        </div>

        {/* Theme Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Themes' },
            { id: 'wonder', label: '✨ Wonder' },
            { id: 'courage', label: '🛡️ Courage' },
            { id: 'kindness', label: '💖 Kindness' },
            { id: 'friendship', label: '🤝 Friendship' },
            { id: 'imagination', label: '💡 Imagination' },
            { id: 'comfort', label: '🌙 Comfort' },
          ].map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setSelectedTheme(th.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all ${
                selectedTheme === th.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Master Bedtime Stories */}
      {filteredFeaturedStories.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white tracking-tight">Featured Master Stories</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Multi-Scene Interactive Narratives</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFeaturedStories.map((story) => {
              const hero = getHeroById(story.heroId);
              const isSaved = savedStoryIds.includes(story.id);

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
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        {story.badge ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                            {story.badge}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 backdrop-blur-sm text-indigo-300 border border-indigo-900/60">
                            {story.category}
                          </span>
                        )}

                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-sm text-slate-200 border border-white/10">
                          <Clock className="w-3 h-3 text-amber-300" />
                          {story.audioDurationMinutes || 10} min
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-6 pt-4 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: hero.color }}
                        />
                        <span className="text-xs text-indigo-300 font-medium">
                          {hero.name} ({hero.title})
                        </span>
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
                          <span className="text-[11px] text-slate-400 capitalize">{story.category}</span>
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-600/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Offline
                          </span>
                        </div>
                        {story.mode === 'sleep' && (
                          <span className="flex items-center gap-1 text-[10px] text-purple-300 font-medium">
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
      )}

      {/* Story Seeds Vault (50+ Curated Ideas with 1-click launch) */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Story Seeds Vault</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">{filteredSeeds.length} seeds available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSeeds.map((seed) => {
            const hero = getHeroById(seed.suggestedHeroId);

            return (
              <div
                key={seed.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/50 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{seed.emoji}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {seed.ageRange}
                    </span>
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
