import React, { useState, useMemo } from 'react';
import { Story, StorySeed, VocabularyWord } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { STORY_SEEDS } from '../data/storySeeds';
import { getVocabularyWordById } from '../data/vocabularyWords';
import { getHeroById } from '../data/heroes';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import {
  Search,
  Play,
  Clock,
  Moon,
  Compass,
  Bookmark,
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
  Mic,
  Sparkles,
} from 'lucide-react';

interface LibraryViewProps {
  onSelectStory: (story: Story) => void;
  onSaveStory: (story: Story) => void;
  savedStoryIds: string[];
  isOnline?: boolean;
  onOpenSettings?: () => void;
  onBack?: () => void;
  onOpenWordSpark?: (word?: VocabularyWord) => void;
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
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyH9PXA0o_H9gQoYIg9PgFWnd-Cxd3VSwHewaRw4gA5TdIgfEwcCnq9Yw6THbfN5W7SCwDuBS76T8VgxNh4serExSasSVjyf8qrgMXtSZLaBLXUawIj6Esrg127wtmk62PAb66DtNeOwAQRZIP4m5DCVpfpzMcPhhfgRwl1GLK_SNVakCNJcZjZk-BvnJOXkez_GRk6AMWImFUScZS4na2fgBsOWB8c4T34v_AWzH9CxAcdfiQIliK2UYnYAevO29Dl3I1rgIlRCg',
  },
  {
    id: 'Magical',
    label: 'Magical',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJenlNSm8Agdp7vd6mQfALJZNiFDhIBkB8Hht3wuHMd-nDtV3lQuE0q8HVa4BXXoXLnfVJKUnQma8M1zCf9ZEVOPpzce-yf6eXuRcaEAREZWno7QEpntEBTbG8jNko_pCSOO92szrwkLWiYIAay2EoWn7-nHlIVPzV7bW6FMtDIKNBZM5DHQZjPP-IuK9j1Urzj1naF8xtdKxaN7tA4IR3aHPMs1w46n3rwKpKGw4phB-h-S3yFLcCuB5H9EHq9iIJgmufMVj3ca4',
  },
  {
    id: 'Winter',
    label: 'Winter',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD6LdjlvZ6ZnBRCfp7ZyVotlcDzYkIoW3s2Ogh13oeY2geHTq8yRv6kAEA8o-SqpRO8alweqStOlOgipAXTYj6XW8S2xW9EP8Ix_RcXJyFd8EZUy8o_5kcBvOAghF_tbwLstaUp51PboVxijo68zMNdPRRZQrYE3l255lV5mqMntpIOJX6Ue1yu-q6VzGSo4gb2U7tfh2Elj45mw_C4VffAU0qdObVBtLBdcA5YMPyprceGZvEK5tRBhHOTM9F5JZGWgBF8zv8XB4o',
  },
  {
    id: 'Oceanic',
    label: 'Oceanic',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZo5EmFIH_nt5TK6omVOfrm1JaWYFIzJXU91TbQGFgDF9NA6JiHU8Qbr-JMRrcc8jyyMGcOinQ7QNrS648CrMfIvSGSeXLcDfDRg3wFC9vL92aM77zaUPZlhBK73aPD5vrSM6kfeDaM6QGtEy2DGu_-8tUCE3JMZCd8VK99BPLh9cDtf1w0WexMIxtT0eyyVStj47Ho3Qi6Uvc_9Hyd06yi6FmkIeOTplsGyqtihhUu7WYSjUKXMM3HmVByoQyvdzMzNhuuZMBVB8',
  },
];

const HERO_AVATAR_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCn9p3C34xAYu7Z9zxHYOATTXoMRBJemWHounQiOIgw1h6dBGWO6crSxqkzWzh9mheLP4alAfXSPOQpsHmiYqX-Xek1NR_BhEvHt4Sy8UMluvyisHrM7F5zS0oue3SoNjzawUmElDelySyX4ZPDcJdspEkUPYPzP_aPQLz0QG4tumxQ9fFkoxh8k_VNm8xAfULsUFux1yoFfNiq_tcltyDbXPckoDYo4Johiuls_1oYnIV4uz85ImwaKueArr28cr5r7HJHVzTKaLE';

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
    return (
      storyCategory === 'Magical' ||
      storyCategory === 'Bedtime Calm' ||
      storyCategory === 'Heartwarming Fables'
    );
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
  onOpenWordSpark,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [subTab, setSubTab] = useState<SubTabOption>('crafted');
  const [previewStory, setPreviewStory] = useState<Story | null>(null);
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [showSeedsVault, setShowSeedsVault] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [isListeningVoice, setIsListeningVoice] = useState(false);

  // Hero Story (Editor's pick: The Starry Whales)
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

  // Bento stories for All Crafted view
  const bentoStories = useMemo(() => {
    // Exclude the hero story from secondary list when hero banner is shown
    return filteredStories.filter((s) => s.id !== heroStory.id);
  }, [filteredStories, heroStory.id]);

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
    const hero = getHeroById(seed.suggestedHeroId);
    const customStory = generateCustomBedtimeStory({
      mode: seed.mode,
      hero,
      childName: hero.name,
      childAge: 5,
      theme: seed.theme,
      tone: 'cozy and gentle',
    });
    onSelectStory(customStory);
  };

  const handleToggleCategory = (category: CategoryFilter) => {
    setSelectedCategory((prev) => (prev === category ? 'all' : category));
  };

  // Voice Search / Simulation
  const handleToggleVoiceSearch = () => {
    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    setIsListeningVoice(true);

    // If browser supports web speech recognition
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new (SpeechRecognition as new () => any)();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchQuery(transcript);
          setIsListeningVoice(false);
        };
        recognition.onerror = () => {
          setIsListeningVoice(false);
        };
        recognition.onend = () => {
          setIsListeningVoice(false);
        };
        recognition.start();
        return;
      } catch {
        // fallback
      }
    }

    // Friendly fallback simulated speech input
    setTimeout(() => {
      setSearchQuery('whales');
      setIsListeningVoice(false);
    }, 1200);
  };

  return (
    <div id="library-view-container" className="space-y-6 sm:space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Offline Alert Banner */}
      {!isOnline && (
        <div
          id="library-offline-alert"
          className="flex items-center gap-2 p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs shadow-lg backdrop-blur-md"
        >
          <Moon className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Offline Mode Active • Audio and stories are served from local starlight cache.</span>
        </div>
      )}

      {/* Top Application Bar matching screenshots */}
      <header className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-400/60 hover:bg-slate-800 transition-all shadow-md"
              title="Back to Home"
              aria-label="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Hero Avatar with glowing ring */}
          <div
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-400/80 p-0.5 shadow-[0_0_15px_rgba(34,211,238,0.5)] bg-slate-950 shrink-0 cursor-pointer hover:scale-105 transition-transform"
            title="Cosmic Explorer"
            onClick={onOpenSettings}
          >
            <img
              src={HERO_AVATAR_IMAGE}
              alt="Cosmic Hero Avatar"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

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

      {/* Search Input Bar (rounded capsule with Mic button matching screenshots) */}
      <div className="relative max-w-xl mx-auto w-full">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-indigo-300/80 absolute left-4 pointer-events-none" />
          <input
            type="text"
            id="library-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a magical tale..."
            className="w-full pl-11 pr-20 py-3 rounded-full bg-slate-900/70 border border-slate-700/80 hover:border-indigo-500/50 focus:border-indigo-400 text-sm text-white placeholder-slate-400 shadow-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-slate-400 hover:text-white bg-slate-800/60"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleVoiceSearch}
              className={`p-1.5 rounded-full transition-all ${
                isListeningVoice
                  ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/50'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-900/50'
              }`}
              title={isListeningVoice ? 'Listening...' : 'Voice Search'}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Thematic Categories Cards matching screenshots */}
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

        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {THEMATIC_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleToggleCategory(cat.id)}
                className={`group relative flex flex-col items-center gap-1.5 transition-all text-center ${
                  isSelected ? 'scale-105' : 'hover:scale-102 opacity-90 hover:opacity-100'
                }`}
              >
                <div
                  className={`relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden border transition-all duration-300 shadow-md ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                      : 'border-slate-800 hover:border-indigo-500/50'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 transition-opacity ${
                      isSelected
                        ? 'bg-gradient-to-t from-cyan-950/80 via-transparent to-transparent'
                        : 'bg-gradient-to-t from-slate-950/70 via-transparent to-transparent'
                    }`}
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 ring-4 ring-cyan-400/40" />
                  )}
                </div>

                <span
                  className={`text-xs font-bold transition-colors ${
                    isSelected ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Sub-Navigation Tabs matching screenshots: New Arrivals | Favorites | All Crafted */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pt-2">
        <div className="flex items-center gap-6 sm:gap-8 text-sm font-bold">
          <button
            type="button"
            onClick={() => setSubTab('arrivals')}
            className={`pb-3 relative transition-colors flex items-center gap-1.5 ${
              subTab === 'arrivals'
                ? 'text-indigo-200 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_-2px_8px_rgba(192,193,255,0.8)]'
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
                ? 'text-indigo-200 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_-2px_8px_rgba(192,193,255,0.8)]'
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

          <button
            type="button"
            onClick={() => setSubTab('crafted')}
            className={`pb-3 relative transition-colors ${
              subTab === 'crafted'
                ? 'text-indigo-200 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-indigo-400 after:shadow-[0_-2px_8px_rgba(192,193,255,0.8)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Crafted
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
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in">
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

      {/* Vocabulary Spark Quick Banner (matching the 5th screenshot feature) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/50 via-indigo-950/60 to-purple-950/50 border border-amber-400/40 shadow-xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                New Word Spark
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-400/20 text-amber-200 border border-amber-400/40">
                Ages 3–9
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white">
              Discover: <span className="font-bangers text-amber-300 text-base tracking-wider">CONSTELLATION</span> &bull; A group of stars making pictures!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onOpenWordSpark) {
              onOpenWordSpark(getVocabularyWordById('vocab-constellation'));
            }
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bangers text-xs sm:text-sm tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
        >
          <span>LEARN WORD</span>
          <span>🚀</span>
        </button>
      </div>

      {/* Main Bento Grid: Story Cards matching screenshots */}
      <section className="space-y-4">
        {filteredStories.length > 0 ? (
          <div className="space-y-4">
            {/* Bento Layout: Hero Card + Adjacent/Subsequent Bento Cards */}
            {subTab === 'crafted' && selectedCategory === 'all' && !searchQuery ? (
              <>
                {/* 1. Editor's Pick: The Starry Whales */}
                <div
                  onClick={() => onSelectStory(heroStory)}
                  className="group relative h-72 sm:h-80 w-full rounded-3xl overflow-hidden border border-indigo-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] cursor-pointer bg-slate-950 transition-all hover:scale-[1.01]"
                >
                  <img
                    src={heroStory.coverImage}
                    alt={heroStory.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05051e] via-[#05051e]/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#05051e]/80 via-transparent to-black/30" />

                  {/* Top Left: EDITOR'S PICK pill */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bangers tracking-wider uppercase bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/50 border border-indigo-400 backdrop-blur-md">
                      EDITOR&apos;S PICK
                    </span>
                  </div>

                  {/* Top Right: Bookmark + Word Spark badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenWordSpark) {
                          onOpenWordSpark(getVocabularyWordById('vocab-constellation'));
                        }
                      }}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/50 backdrop-blur-md flex items-center gap-1 hover:bg-amber-500/40 transition-all"
                      title="Word Spark inside this story!"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Spark: Constellation</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveStory(heroStory);
                      }}
                      className={`p-2 rounded-full backdrop-blur-md border transition-all ${
                        savedStoryIds.includes(heroStory.id)
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                          : 'bg-black/60 border-white/20 text-white hover:border-white/50'
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom Text Details */}
                  <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-2xl sm:text-4xl font-bangers tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-1">
                        {heroStory.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-indigo-200 font-medium drop-shadow-md">
                        {heroStory.audioDurationMinutes || 12} min read &bull; Cosmic
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStory(heroStory);
                      }}
                      className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/50 transition-all active:scale-95 shrink-0"
                      title="Play story"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Secondary Bento Grid (Candy Cloud, Midnight Explorers, Galactic Lullaby, etc.) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bentoStories.map((story) => {
                    const isSaved = savedStoryIds.includes(story.id);
                    const catColors = getCategoryColor(story.category);

                    return (
                      <div
                        key={story.id}
                        onClick={() => onSelectStory(story)}
                        className="group relative h-64 sm:h-72 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/60 shadow-[0_8px_25px_rgba(0,0,0,0.5)] cursor-pointer bg-slate-950 transition-all hover:scale-[1.01]"
                      >
                        <img
                          src={story.coverImage}
                          alt={story.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#05051e] via-[#05051e]/40 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border ${catColors.bg} ${catColors.text} ${catColors.border}`}
                          >
                            {story.badge || story.category}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewStory(story);
                              }}
                              className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white"
                              title="Details"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveStory(story);
                              }}
                              className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                                isSaved
                                  ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                                  : 'bg-black/60 border-white/20 text-white hover:border-white/50'
                              }`}
                              title="Bookmark"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Text */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                          <div>
                            <h4 className="text-xl sm:text-2xl font-bangers tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-0.5">
                              {story.title}
                            </h4>
                            <p className="text-xs text-indigo-200 font-medium drop-shadow-md">
                              {story.audioDurationMinutes} min read &bull; {story.badge || story.category}
                            </p>
                          </div>

                          <div className="w-10 h-10 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all shrink-0">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Filtered / Search / Favorites Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStories.map((story) => {
                  const isSaved = savedStoryIds.includes(story.id);
                  const catColors = getCategoryColor(story.category);

                  return (
                    <div
                      key={story.id}
                      onClick={() => onSelectStory(story)}
                      className="group relative h-64 rounded-3xl overflow-hidden border border-slate-800 hover:border-indigo-500/60 shadow-xl cursor-pointer bg-slate-950 transition-all hover:scale-[1.01]"
                    >
                      <img
                        src={story.coverImage}
                        alt={story.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05051e] via-[#05051e]/40 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md border ${catColors.bg} ${catColors.text} ${catColors.border}`}
                        >
                          {story.badge || story.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewStory(story);
                            }}
                            className="p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white"
                            title="Details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSaveStory(story);
                            }}
                            className={`p-1.5 rounded-full backdrop-blur-md border transition-all ${
                              isSaved
                                ? 'bg-amber-500/30 border-amber-400 text-amber-300'
                                : 'bg-black/60 border-white/20 text-white hover:border-white/50'
                            }`}
                            title="Bookmark"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Bottom Text */}
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-bangers tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mb-0.5">
                            {story.title}
                          </h4>
                          <p className="text-xs text-indigo-200 font-medium drop-shadow-md">
                            {story.audioDurationMinutes} min read &bull; {story.category}
                          </p>
                        </div>

                        <div className="w-9 h-9 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all shrink-0">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <span className="text-[10px] font-medium text-slate-500">&bull;</span>
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
                    <span className="text-[10px] font-medium text-slate-500">&bull;</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 animate-fade-in">
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
                  Hero: {previewStory.heroName} &bull; {previewStory.theme}
                </div>
                <h3 className="text-2xl font-bangers tracking-wider text-white">
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

              {/* Word Spark in this story */}
              {previewStory.id === 'story-starry-whales' && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-200">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Includes Word Spark: <strong>CONSTELLATION</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenWordSpark) {
                        onOpenWordSpark(getVocabularyWordById('vocab-constellation'));
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px]"
                  >
                    View Spark
                  </button>
                </div>
              )}

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
