import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Story, CompletedStoryRecord } from '../types';
import { FEATURED_STORIES } from '../data/featuredStories';
import { ambientSoundEngine } from '../services/audioNarration';
import {
  Sparkles,
  Star,
  Play,
  Moon,
  Info,
  Compass,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Layers,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export interface StoryGalaxyMapProps {
  completedStories: CompletedStoryRecord[];
  onSelectStory: (story: Story) => void;
  onOpenDetails: (story: Story) => void;
  onOpenLibrary?: () => void;
  onOpenCreator?: () => void;
  childName?: string;
}

interface ConstellationSector {
  id: string;
  storyId?: string;
  constellationName: string;
  heroName: string;
  heroColor: string;
  iconName: string;
  theme: string;
  defaultTitle: string;
  summary: string;
  affirmation: string;
  x: number;
  y: number;
  sectorName: string;
  coverImage?: string;
  audioDurationMinutes?: number;
}

// Preset galaxy sectors mapping the celestial path across the bedtime sky
const GALAXY_SECTORS: ConstellationSector[] = [
  {
    id: 'sector-fox',
    storyId: 'story-silver-moon-fox',
    constellationName: 'The Silver Moon Fox',
    heroName: 'Luna & Koda',
    heroColor: '#FFD54F',
    iconName: 'Fox',
    theme: 'Wonder & Peaceful Sleep',
    defaultTitle: 'The Silver Moon Fox',
    summary: 'A whispering voyage through starlit pines returning the lost sparkle to the North Star.',
    affirmation: 'Inhale the quiet midnight forest air. You are safe and snug.',
    x: 120,
    y: 190,
    sectorName: 'Whispering Pines Realm',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 12,
  },
  {
    id: 'sector-whale',
    storyId: 'story-glow-whale',
    constellationName: 'The Luminous Whale',
    heroName: 'Marina',
    heroColor: '#4DD0E1',
    iconName: 'Waves',
    theme: 'Ocean Wonders & Calm',
    defaultTitle: "The Glow Whale's Song",
    summary: 'Drifting across turquoise cosmic currents as gentle whale songs tuck the ocean to sleep.',
    affirmation: 'Breathe in the calm cool ocean air. You are peaceful and weightless.',
    x: 320,
    y: 110,
    sectorName: 'Bioluminescent Lagoon',
    coverImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 8,
  },
  {
    id: 'sector-tree',
    storyId: 'story-hollow-tree',
    constellationName: 'The Ancient Hollow Oak',
    heroName: 'Rowan',
    heroColor: '#A5D6A7',
    iconName: 'Tree',
    theme: 'Friendship & Cozy Hearth',
    defaultTitle: 'The Hollow Tree Inn',
    summary: 'Resting by a warm cedar hearth with sleepy woodland travelers under glowing fairy lanterns.',
    affirmation: 'You are welcomed, warm, and cozy right where you are.',
    x: 520,
    y: 210,
    sectorName: 'Starlight Canopy Forest',
    coverImage: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 15,
  },
  {
    id: 'sector-loom',
    storyId: 'story-library-stars',
    constellationName: 'The Dream Loom',
    heroName: 'Luna',
    heroColor: '#CE93D8',
    iconName: 'Moon',
    theme: 'Imagination & Sweet Dreams',
    defaultTitle: 'The Celestial Library of Stars',
    summary: 'Weaving silver moonbeams into comforting dreams inside the quiet archive of the cosmos.',
    affirmation: 'Feel every busy thought turn into soft, floating stardust.',
    x: 720,
    y: 120,
    sectorName: 'Lunar Archives Sector',
    coverImage: 'https://images.unsplash.com/photo-1507842229451-9f232615e324?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 10,
  },
  {
    id: 'sector-cloud',
    storyId: 'story-cloud-castle',
    constellationName: 'The Brave Cloud Citadel',
    heroName: 'Nimbus',
    heroColor: '#90CAF9',
    iconName: 'Cloud',
    theme: 'Courage & Gentle Breezes',
    defaultTitle: 'Nimbus & The Castle of Clouds',
    summary: 'Gliding on marshmallow clouds that soften rainstorms into soothing sleep melodies.',
    affirmation: 'You are brave, kind, and shielded by gentle starlight.',
    x: 920,
    y: 220,
    sectorName: 'Cumulus Haven Sector',
    coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 9,
  },
  {
    id: 'sector-train',
    storyId: 'story-night-train',
    constellationName: 'The Milky Way Express',
    heroName: 'Whistle',
    heroColor: '#B0BEC5',
    iconName: 'Train',
    theme: 'Tranquil Travel',
    defaultTitle: 'The Midnight Star Train',
    summary: 'Riding along rails made of starlight across the galaxy to peaceful dreamland stations.',
    affirmation: 'Click-clack, click-clack. The night train carries you safely to sleep.',
    x: 1120,
    y: 130,
    sectorName: 'Stellar Railway Corridor',
    coverImage: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 14,
  },
  {
    id: 'sector-garden',
    storyId: 'story-zen-garden',
    constellationName: 'The Dream Seed Garden',
    heroName: 'Bloom',
    heroColor: '#81C784',
    iconName: 'Flower',
    theme: 'Tranquility & Growth',
    defaultTitle: 'The Moonlit Blossom Sanctuary',
    summary: 'Planting glowing night-blooms that release soothing scents of lavender and mint.',
    affirmation: 'Like a little seed resting in warm earth, you rest in quiet peace.',
    x: 1320,
    y: 230,
    sectorName: 'Celestial Botanical Garden',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 11,
  },
  {
    id: 'sector-shield',
    storyId: 'story-north-star-shield',
    constellationName: 'The North Star Citadel',
    heroName: 'Nova',
    heroColor: '#FFD700',
    iconName: 'Shield',
    theme: 'Protection & Golden Light',
    defaultTitle: 'Nova & The Eternal Starlight Shield',
    summary: 'Gathering at the apex of the galaxy where the North Star bathes the entire world in calm warmth.',
    affirmation: 'The brightest star in the universe shines over your peaceful sleep.',
    x: 1520,
    y: 140,
    sectorName: 'North Star Apex Sanctuary',
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
    audioDurationMinutes: 13,
  },
];

export const StoryGalaxyMap: React.FC<StoryGalaxyMapProps> = ({
  completedStories = [],
  onSelectStory,
  onOpenDetails,
  onOpenLibrary,
  onOpenCreator,
  childName = 'Little Explorer',
}) => {
  const [selectedSector, setSelectedSector] = useState<ConstellationSector | null>(null);
  const [activeStoryRecord, setActiveStoryRecord] = useState<CompletedStoryRecord | null>(null);
  const [viewMode, setViewMode] = useState<'trail' | 'atlas'>('trail');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'unlocked'>('all');
  const [isSparklingId, setIsSparklingId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Map completed stories to sectors
  const mappedSectors = useMemo(() => {
    return GALAXY_SECTORS.map((sector, index) => {
      // Check if this sector's story is completed
      const matchedRecord = completedStories.find(
        (c) =>
          c.id === sector.storyId ||
          c.title.toLowerCase() === sector.defaultTitle.toLowerCase() ||
          c.title.toLowerCase().includes(sector.constellationName.toLowerCase()) ||
          (index < completedStories.length && completedStories[index])
      );

      // Check if this is the next reachable star on the voyage
      const isCompleted = !!matchedRecord || index < completedStories.length;
      const isNextTarget = !isCompleted && index === completedStories.length;

      return {
        ...sector,
        isCompleted,
        isNextTarget,
        completedRecord: matchedRecord || (index < completedStories.length ? completedStories[index] : undefined),
        orderNumber: index + 1,
      };
    });
  }, [completedStories]);

  const completedCount = mappedSectors.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / mappedSectors.length) * 100);

  // Auto-select initial active sector or center on the latest completed
  useEffect(() => {
    if (completedStories.length > 0 && !selectedSector) {
      const latestSector = mappedSectors.find((s) => s.isCompleted) || mappedSectors[0];
      setSelectedSector(latestSector);
    }
  }, [completedStories.length, mappedSectors, selectedSector]);

  const handleSectorClick = (sector: typeof mappedSectors[0]) => {
    // Play starlight chime sound
    ambientSoundEngine.playStarTwinkle(sector.isCompleted ? 1.0 : 0.85);

    setIsSparklingId(sector.id);
    setSelectedSector(sector);
    setActiveStoryRecord(sector.completedRecord || null);

    setTimeout(() => {
      setIsSparklingId(null);
    }, 800);
  };

  const handleRevisitStory = (sector: ConstellationSector, record?: CompletedStoryRecord) => {
    ambientSoundEngine.playCelebrationChime();

    // Find full story in FEATURED_STORIES or construct rich fallback
    const storyIdToFind = record?.id || sector.storyId;
    const storyTitleToFind = record?.title || sector.defaultTitle;

    const foundStory =
      FEATURED_STORIES.find((s) => s.id === storyIdToFind || s.title === storyTitleToFind) || {
        id: sector.storyId || `story-${sector.id}`,
        title: record?.title || sector.defaultTitle,
        category: record?.category || 'Bedtime Galaxy Tale',
        theme: 'wonder',
        mode: 'sleep',
        ageRange: '4-6',
        heroId: 'hero-1',
        heroName: record?.heroName || sector.heroName,
        summary: sector.summary,
        coverImage: sector.coverImage,
        audioDurationMinutes: sector.audioDurationMinutes || 10,
        scenes: [
          {
            id: 'scene-galaxy-1',
            sceneNumber: 1,
            text: `High in the constellation of ${sector.constellationName}, the soft stars lit the way for "${record?.title || sector.defaultTitle}". The cosmic winds whispered a calm lullaby.`,
            sleepAffirmation: sector.affirmation,
            isFinal: true,
          },
        ],
      };

    onSelectStory(foundStory as Story);
  };

  const handleViewDetails = (sector: ConstellationSector, record?: CompletedStoryRecord) => {
    const foundStory =
      FEATURED_STORIES.find((s) => s.id === (record?.id || sector.storyId) || s.title === (record?.title || sector.defaultTitle)) || {
        id: sector.storyId || `story-${sector.id}`,
        title: record?.title || sector.defaultTitle,
        category: record?.category || 'Bedtime Galaxy Tale',
        theme: 'wonder',
        mode: 'sleep',
        ageRange: '4-6',
        heroId: 'hero-1',
        heroName: record?.heroName || sector.heroName,
        summary: sector.summary,
        coverImage: sector.coverImage,
        audioDurationMinutes: sector.audioDurationMinutes || 10,
        scenes: [
          {
            id: 'scene-galaxy-1',
            sceneNumber: 1,
            text: sector.summary,
            sleepAffirmation: sector.affirmation,
            isFinal: true,
          },
        ],
      };

    onOpenDetails(foundStory as Story);
  };

  // Build SVG path coordinates connecting all sectors smoothly
  const svgPathD = useMemo(() => {
    if (mappedSectors.length === 0) return '';
    return mappedSectors.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const prev = mappedSectors[index - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, '');
  }, [mappedSectors]);

  // Build SVG path for ONLY the completed nodes
  const completedSvgPathD = useMemo(() => {
    const completedList = mappedSectors.filter((s) => s.isCompleted);
    if (completedList.length <= 1) return '';
    return completedList.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const prev = completedList[index - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${point.x} ${point.y}`;
    }, '');
  }, [mappedSectors]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section
      id="story-galaxy-map-section"
      aria-label="Story Galaxy Map of Completed Tales"
      className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-[#0b071e] via-[#10092c] to-[#080416] border border-indigo-900/60 shadow-2xl shadow-indigo-950/70 p-4 sm:p-6 md:p-8 space-y-6"
    >
      {/* Background Celestial Stars & Cosmic Nebula Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        
        {/* Subtle decorative grid/astrolabe rings */}
        <div className="absolute right-10 top-10 w-64 h-64 rounded-full border border-indigo-500/10 pointer-events-none" />
        <div className="absolute right-20 top-20 w-44 h-44 rounded-full border border-amber-400/10 pointer-events-none" />
      </div>

      {/* Header HUD: Galaxy Title + Completion Meter + Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-950/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-400/20">
              <Sparkles className="w-4 h-4 fill-current animate-pulse" />
            </span>
            <h3 className="text-lg sm:text-xl font-playfair font-bold text-white tracking-wide flex items-center gap-2">
              The Story Galaxy Map
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-indigo-950 text-amber-300 border border-amber-400/40 shadow-xs">
              {completedCount} / {mappedSectors.length} Constellations Lit
            </span>
          </div>

          <p className="text-xs text-indigo-200/80 max-w-xl font-light">
            Follow <strong className="text-amber-300 font-semibold">{childName}&apos;s</strong> starlight journey. Click on any constellation to revisit the memories and sweet dreams you charted!
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Progress Bar Badge */}
          <div className="px-3 py-1.5 rounded-2xl bg-[#130d32]/90 border border-indigo-900/60 flex items-center gap-2.5 text-xs text-slate-300">
            <div className="w-20 bg-slate-900 h-2 rounded-full overflow-hidden border border-indigo-950">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(progressPercent, 12)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-amber-300">{progressPercent}% Explored</span>
          </div>

          {/* View Mode Toggle: Map Trail vs Grid Atlas */}
          <div className="p-1 rounded-xl bg-slate-950/80 border border-indigo-950 flex items-center gap-1">
            <button
              type="button"
              id="galaxy-view-trail-btn"
              onClick={() => setViewMode('trail')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'trail'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Voyage Trail Map"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trail</span>
            </button>
            <button
              type="button"
              id="galaxy-view-atlas-btn"
              onClick={() => setViewMode('atlas')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'atlas'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Constellation Atlas Grid"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atlas</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: Interactive Celestial Voyage Trail */}
      {viewMode === 'trail' && (
        <div className="relative z-10 space-y-4">
          {/* Scroll Navigation Arrows */}
          <div className="flex items-center justify-between text-xs text-indigo-300/80 px-1">
            <div className="flex items-center gap-2 font-medium">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Scroll along the stardust trail to explore your constellations</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Scroll galaxy map left"
                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-indigo-900/50 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Scroll galaxy map right"
                className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-indigo-900/50 text-slate-300 hover:text-white transition-all active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Cosmic Canvas */}
          <div
            ref={scrollContainerRef}
            className="relative w-full overflow-x-auto rounded-3xl bg-[#060314]/90 border border-indigo-950/80 shadow-inner scrollbar-thin scrollbar-thumb-indigo-900 scrollbar-track-transparent py-6 px-4 select-none"
            style={{ minHeight: '340px' }}
          >
            <div className="relative" style={{ width: '1660px', height: '320px' }}>
              {/* SVG Constellation Connected Paths */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1660 320"
                fill="none"
              >
                <defs>
                  {/* Glowing stardust filter */}
                  <filter id="galaxyGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <linearGradient id="unlockedTrailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.8" />
                  </linearGradient>

                  <linearGradient id="futureTrailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#475569" stopOpacity="0.15" />
                  </linearGradient>
                </defs>

                {/* Base dashed cosmic roadmap line */}
                <path
                  d={svgPathD}
                  stroke="url(#futureTrailGradient)"
                  strokeWidth="2.5"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                />

                {/* Completed illuminated stardust trail */}
                {completedSvgPathD && (
                  <path
                    d={completedSvgPathD}
                    stroke="url(#unlockedTrailGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    filter="url(#galaxyGlow)"
                  />
                )}
              </svg>

              {/* Render Interactive Constellation Nodes along the coordinates */}
              {mappedSectors.map((sector) => {
                const isSelected = selectedSector?.id === sector.id;
                const isSparkling = isSparklingId === sector.id;

                return (
                  <div
                    key={sector.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-300"
                    style={{ left: `${sector.x}px`, top: `${sector.y}px` }}
                  >
                    {/* Node Trigger Button */}
                    <motion.button
                      type="button"
                      id={`galaxy-node-${sector.id}`}
                      onClick={() => handleSectorClick(sector)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.94 }}
                      animate={
                        isSparkling
                          ? {
                              scale: [1, 1.4, 1.18],
                              rotate: [0, -15, 15, 0],
                            }
                          : isSelected
                          ? {
                              scale: 1.14,
                            }
                          : {
                              scale: 1,
                            }
                      }
                      transition={{ duration: 0.4 }}
                      className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                        sector.isCompleted
                          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-2 shadow-lg cursor-pointer'
                          : sector.isNextTarget
                          ? 'bg-slate-950 border-2 border-dashed border-amber-400/80 shadow-md shadow-amber-400/20 cursor-pointer animate-pulse'
                          : 'bg-slate-950/80 border border-slate-800/80 opacity-50 cursor-pointer'
                      }`}
                      style={{
                        borderColor: sector.isCompleted ? sector.heroColor : isSelected ? '#FBBF24' : undefined,
                        boxShadow: sector.isCompleted
                          ? `0 0 18px ${sector.heroColor}50, inset 0 0 10px ${sector.heroColor}30`
                          : undefined,
                      }}
                      aria-label={`Constellation ${sector.constellationName} - ${sector.isCompleted ? 'Completed' : 'Upcoming'}`}
                    >
                      {/* Orbital Ring if Completed or Selected */}
                      {sector.isCompleted && (
                        <div
                          className="absolute -inset-2 rounded-full border border-dashed opacity-60 animate-spin"
                          style={{
                            borderColor: sector.heroColor,
                            animationDuration: '14s',
                          }}
                        />
                      )}

                      {/* Next target pulsating glow badge */}
                      {sector.isNextTarget && (
                        <div className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[8px] uppercase tracking-wider animate-bounce shadow">
                          Next
                        </div>
                      )}

                      {/* Constellation Icon / Emblem */}
                      {sector.isCompleted ? (
                        <div className="flex flex-col items-center justify-center">
                          <Star
                            className="w-6 h-6 fill-current transition-transform"
                            style={{ color: sector.heroColor }}
                          />
                        </div>
                      ) : sector.isNextTarget ? (
                        <Sparkles className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-500" />
                      )}

                      {/* Sector Order Number Pill */}
                      <span
                        className={`absolute -bottom-2 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow ${
                          sector.isCompleted
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-900 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {sector.orderNumber}
                      </span>
                    </motion.button>

                    {/* Beneath Node Label */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-3.5 text-center pointer-events-none w-36"
                    >
                      <span
                        className={`text-xs font-bold font-playfair tracking-wide block truncate ${
                          sector.isCompleted ? 'text-white' : sector.isNextTarget ? 'text-amber-300' : 'text-slate-500'
                        }`}
                      >
                        {sector.constellationName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate">
                        {sector.heroName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: Atlas Grid Cards */}
      {viewMode === 'atlas' && (
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs text-slate-400 font-medium">Filter Constellations:</span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All Sectors' },
                { id: 'completed', label: `Completed (${completedCount})` },
                { id: 'unlocked', label: 'Upcoming' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id as 'all' | 'completed' | 'unlocked')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    filterMode === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {mappedSectors
              .filter((sector) => {
                if (filterMode === 'completed') return sector.isCompleted;
                if (filterMode === 'unlocked') return !sector.isCompleted;
                return true;
              })
              .map((sector) => {
                const isSelected = selectedSector?.id === sector.id;

                return (
                  <div
                    key={sector.id}
                    onClick={() => handleSectorClick(sector)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      sector.isCompleted
                        ? isSelected
                          ? 'bg-slate-900/90 border-amber-400 shadow-xl shadow-amber-400/10'
                          : 'bg-slate-900/60 border-indigo-950 hover:border-indigo-800 hover:bg-slate-900/80'
                        : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
                          style={{
                            backgroundColor: `${sector.heroColor}20`,
                            color: sector.heroColor,
                            border: `1px solid ${sector.heroColor}50`,
                          }}
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sector.isCompleted
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-900 text-slate-500 border border-slate-800'
                          }`}
                        >
                          {sector.isCompleted ? '✨ Star Lit' : 'Locked'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {sector.constellationName}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {sector.heroName} • {sector.sectorName}
                        </p>
                      </div>

                      <p className="text-xs text-slate-300/80 line-clamp-2 font-light">
                        {sector.summary}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-amber-300/90 font-semibold">{sector.theme}</span>
                      <span className="text-slate-400 flex items-center gap-1 group-hover:text-amber-300 font-medium">
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SELECTED CONSTELLATION INSPECTION PORTAL */}
      {selectedSector && (
        <div
          id="constellation-memory-inspector"
          className="relative z-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#120c32] via-[#170e3f] to-[#110b2d] border border-amber-400/50 shadow-2xl backdrop-blur-xl animate-fadeIn"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left: Constellation Icon + Story Details */}
            <div className="flex items-start gap-4 sm:gap-5 flex-1">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shrink-0 shadow-xl border relative"
                style={{
                  backgroundColor: `${selectedSector.heroColor}25`,
                  borderColor: selectedSector.heroColor,
                  color: selectedSector.heroColor,
                }}
              >
                <Star className="w-8 h-8 sm:w-10 sm:h-10 fill-current animate-pulse" />
                <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-amber-400/70 text-[10px] font-black text-amber-300">
                  #{selectedSector.orderNumber}
                </span>
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Constellation Realm
                  </span>
                  <span className="text-xs text-indigo-200 font-medium">
                    {selectedSector.sectorName}
                  </span>
                  {selectedSector.isCompleted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Charted</span>
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-playfair font-bold text-white tracking-wide truncate">
                  {activeStoryRecord?.title || selectedSector.defaultTitle}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light line-clamp-2">
                  {selectedSector.summary}
                </p>

                {/* Sleep Affirmation Whisper */}
                <div className="p-2.5 rounded-xl bg-[#0a051d]/70 border border-indigo-900/50 text-xs text-amber-200/90 italic flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>&quot;{selectedSector.affirmation}&quot;</span>
                </div>
              </div>
            </div>

            {/* Right: Primary Revisit CTA & Action Hub */}
            <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2.5 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-indigo-950 lg:pl-6">
              <button
                type="button"
                id="galaxy-revisit-story-btn"
                onClick={() => handleRevisitStory(selectedSector, activeStoryRecord || undefined)}
                className="flex-1 lg:flex-initial px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-xs sm:text-sm shadow-xl shadow-amber-400/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {selectedSector.isCompleted ? 'Revisit Story Now' : 'Begin This Bedtime Tale'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="galaxy-story-details-btn"
                  onClick={() => handleViewDetails(selectedSector, activeStoryRecord || undefined)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => ambientSoundEngine.playStarTwinkle(1.2)}
                  title="Play celestial star chime"
                  className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-amber-300 hover:text-amber-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
