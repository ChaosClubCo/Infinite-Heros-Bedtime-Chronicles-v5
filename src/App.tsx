import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Story, UserStats, AppSettings, CelestialBadge, DreamJournalEntry, CompletedStoryRecord, DreamTheme, AgeRange } from './types';
import { FEATURED_STORIES } from './data/featuredStories';
import { INITIAL_BADGES, evaluateBadgeUnlocks } from './data/badges';
import { StarrySky } from './components/StarrySky';
import { Navbar, NavTab } from './components/Navbar';
import { BedtimeChroniclesHome } from './components/BedtimeChroniclesHome';
import { ThemeGalleryView } from './components/ThemeGalleryView';
import { SafetyPersonalizationView } from './components/SafetyPersonalizationView';
import { MadlibDiariesView } from './components/MadlibDiariesView';
import { DreamJournalModal } from './components/DreamJournalModal';
import { WindDownModal } from './components/WindDownModal';
import { StoryDetailsModal } from './components/StoryDetailsModal';
import { StoryCreator } from './components/StoryCreator';
import { LibraryView } from './components/LibraryView';
import { SavedStoriesView } from './components/SavedStoriesView';
import { TrophiesView } from './components/TrophiesView';
import { StoryReader } from './components/StoryReader';
import { SleepSetupModal } from './components/SleepSetupModal';
import { OfflineToast } from './components/OfflineToast';
import { INITIAL_CHILD_PROFILES } from './data/dreamThemes';
import { useNetworkStatus, cacheStoriesForOffline } from './services/offlineCacheService';


const DEFAULT_SETTINGS: AppSettings = {
  narratorVoice: 'moonbeam',
  readingSpeed: 'gentle',
  ambientSound: 'ocean',
  ambientVolume: 0.35,
  autoAdvance: true,
  sleepTimerMinutes: 45,
  parentPin: '1234',
  childName: 'Leo',
  childAge: 5,
  childAvatar: 'bear',
  themeMode: 'dark',
  ageFilteringEnabled: true,
  madlibSillyMode: false,
  volumeNormalization: true,
  autoFadeToAmbient: true,
  activeVoiceId: 'voice-moms-voice',
  activeChildProfileId: 'profile-leo',
  childProfiles: INITIAL_CHILD_PROFILES,
  visualizerColorTheme: 'soundscape',
};

const DEFAULT_COMPLETED_STORIES: CompletedStoryRecord[] = [
  {
    id: 'story-silver-fox',
    title: 'The Silver Moon Fox',
    heroName: 'Luna & Koda',
    category: 'Bedtime Calm',
    completedAt: 'Yesterday',
  },
  {
    id: 'story-glow-whale',
    title: 'The Whispering Star & The Glowing Whale',
    heroName: 'Marina',
    category: 'Ocean Wonders',
    completedAt: '2 days ago',
  },
];

const DEFAULT_STATS: UserStats = {
  storiesCompleted: 2,
  totalReadingMinutes: 14,
  currentStreak: 3,
  favoriteHeroId: 'hero-1',
  completedStoriesList: DEFAULT_COMPLETED_STORIES,
};

const INITIAL_DREAMS: DreamJournalEntry[] = [
  {
    id: 'dream-1',
    date: 'Yesterday Morning',
    title: 'Dancing on the Moon with Koda',
    content: 'We hopped from star to star collecting silver dust to help the glowing whale light up the midnight sky.',
    mood: 'peaceful',
    tags: ['Moon', 'Koda', 'Starlight'],
    sleepRating: 5,
    illustration: {
      id: 'illust-init-1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      prompt: 'Whimsical soft watercolor and gouache storybook illustration of dancing on the moon, collecting sparkling silver dust with a starry bear cub, gentle pastel wash, soothing bedtime starlight.',
      style: 'watercolor',
      styleLabel: 'Whimsical Watercolor',
      createdAt: 'Yesterday, 07:15 AM',
    },
  },
  {
    id: 'dream-2',
    date: '2 Days Ago',
    title: 'The Whispering Tree Teaparty',
    content: 'A warm tea party inside a giant hollow pine tree with hot cocoa and singing bluebirds.',
    mood: 'cozy',
    tags: ['Forest', 'Animals', 'Tea'],
    sleepRating: 4,
  },
];

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [creatorInitialMode] = useState<'classic' | 'madlibs' | 'sleep'>('classic');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [detailsStory, setDetailsStory] = useState<Story | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDreamJournalModal, setShowDreamJournalModal] = useState(false);
  const [showWindDownModal, setShowWindDownModal] = useState(false);
  const [showMadlibsDirect, setShowMadlibsDirect] = useState(false);

  // Network and Service Worker Offline Status
  const {
    isOnline,
    wasOffline,
    clearWasOffline,
    cachedStoryCount,
    refreshOfflineCache,
  } = useNetworkStatus();

  // Persistence in localStorage
  const [savedStories, setSavedStories] = useState<Story[]>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_saved_stories');
      return stored ? JSON.parse(stored) : [FEATURED_STORIES[0], FEATURED_STORIES[1]];
    } catch {
      return [FEATURED_STORIES[0], FEATURED_STORIES[1]];
    }
  });


  const [dreamEntries, setDreamEntries] = useState<DreamJournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_dream_journal');
      return stored ? JSON.parse(stored) : INITIAL_DREAMS;
    } catch {
      return INITIAL_DREAMS;
    }
  });

  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.completedStoriesList || !parsed.completedStoriesList.length) {
          parsed.completedStoriesList = DEFAULT_COMPLETED_STORIES;
        }
        return parsed;
      }
      return DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  const [badges, setBadges] = useState<CelestialBadge[]>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_badges');
      return stored ? JSON.parse(stored) : INITIAL_BADGES;
    } catch {
      return INITIAL_BADGES;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_settings');
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [bookmarkedThemeIds, setBookmarkedThemeIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_bookmarked_themes');
      return stored ? JSON.parse(stored) : ['theme-cosmic-voyage', 'theme-enchanted-glade'];
    } catch {
      return ['theme-cosmic-voyage', 'theme-enchanted-glade'];
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_bookmarked_themes', JSON.stringify(bookmarkedThemeIds));
    } catch {}
  }, [bookmarkedThemeIds]);

  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_saved_stories', JSON.stringify(savedStories));
    } catch {}
  }, [savedStories]);

  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_dream_journal', JSON.stringify(dreamEntries));
    } catch {}
  }, [dreamEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_stats', JSON.stringify(stats));
    } catch {}
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_badges', JSON.stringify(badges));
    } catch {}
  }, [badges]);

  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Sync offline story cache with service worker storage
  useEffect(() => {
    cacheStoriesForOffline([...FEATURED_STORIES, ...savedStories]);
    refreshOfflineCache();
  }, [savedStories, refreshOfflineCache]);

  const handleToggleSaveStory = (story: Story) => {

    setSavedStories((prev) => {
      const exists = prev.some((s) => s.id === story.id);
      if (exists) {
        return prev.filter((s) => s.id !== story.id);
      } else {
        return [{ ...story, isSaved: true }, ...prev];
      }
    });
  };

  const handleRemoveSavedStory = (storyId: string) => {
    setSavedStories((prev) => prev.filter((s) => s.id !== storyId));
  };

  const handleCompleteStory = (storyId: string): CelestialBadge[] => {
    const foundStory =
      FEATURED_STORIES.find((s) => s.id === storyId) ||
      savedStories.find((s) => s.id === storyId) ||
      activeStory;

    if (!foundStory) return [];

    const title = foundStory.title || 'Magical Bedtime Tale';
    const heroName = foundStory.heroName || 'Bedtime Star';
    const category = foundStory.category || 'Bedtime Story';
    const today = new Date().toISOString().split('T')[0];

    let nextStats = stats;
    setStats((prev) => {
      const currentList = prev.completedStoriesList || DEFAULT_COMPLETED_STORIES;
      const alreadyInList = currentList.some((s) => s.id === storyId || s.title === title);
      const isNewDay = prev.lastReadDate !== today;
      const updatedStreak = prev.currentStreak + (isNewDay ? 1 : 0);

      const updatedList: CompletedStoryRecord[] = alreadyInList
        ? currentList
        : [
            {
              id: storyId,
              title,
              heroName,
              category,
              completedAt: 'Tonight',
            },
            ...currentList,
          ];

      nextStats = {
        ...prev,
        storiesCompleted: prev.storiesCompleted + (alreadyInList ? 0 : 1),
        totalReadingMinutes: prev.totalReadingMinutes + 5,
        currentStreak: updatedStreak,
        lastReadDate: today,
        completedStoriesList: updatedList,
      };
      return nextStats;
    });

    const { updatedBadges, newlyUnlockedBadges } = evaluateBadgeUnlocks(foundStory, badges, nextStats);
    if (newlyUnlockedBadges.length > 0) {
      setBadges(updatedBadges);
      return newlyUnlockedBadges;
    }

    return [];
  };

  const handleAdvanceStreak = () => {
    setStats((prev) => {
      const today = new Date().toISOString().split('T')[0];
      return {
        ...prev,
        currentStreak: prev.currentStreak + 1,
        lastReadDate: today,
      };
    });
  };

  const handleStoryGenerated = (story: Story) => {
    setActiveStory(story);
    setShowMadlibsDirect(false);
  };

  const handleStartStoryWithTheme = (theme: DreamTheme) => {
    const childName = settings.childName || 'Little Explorer';
    const themedStory: Story = {
      id: `story-theme-${theme.id}-${Date.now()}`,
      title: `${theme.title}: A Starlight Journey`,
      category: `${theme.subtitle} • Bedtime Tale`,
      theme: 'wonder',
      mode: 'sleep',
      ageRange: (settings.childAge <= 4 ? '2-4' : settings.childAge <= 6 ? '4-6' : settings.childAge <= 8 ? '6-8' : '8-10') as AgeRange,
      heroId: 'hero-1',
      heroName: `${childName} & The Starlight Guide`,
      summary: theme.description,
      coverImage: theme.imageUrl,
      audioDurationMinutes: parseInt(theme.duration.split('-')[0], 10) || 15,
      scenes: [
        {
          id: 'scene-1',
          sceneNumber: 1,
          text: `The dusk settles gently over the world as ${childName} prepares for rest. Before your eyes unfolds the serene vista of ${theme.title}. The gentle colors of ${theme.subtitle} wrap around you like a soft velvet blanket.`,
          sleepAffirmation: theme.sampleAffirmation,
          isFinal: false,
        },
        {
          id: 'scene-2',
          sceneNumber: 2,
          text: `Listening closely, the calming ${theme.ambientSound} soundscape whispers peaceful harmonies across the horizon. Every breath you take is calm, deep, and steady as the night stars begin to twinkle.`,
          sleepAffirmation: 'Inhale calm starlight, exhale all worries of the day.',
          isFinal: false,
        },
        {
          id: 'scene-3',
          sceneNumber: 3,
          text: `Drifting on a sea of peaceful dreams, ${childName} closes their eyes. The magic of this starlit sanctuary will watch over you all through the night. Good night, sleep tight, and awaken refreshed with the morning sun.`,
          sleepAffirmation: 'You are safe, loved, and peacefully drifting into sweet dreams.',
          isFinal: true,
        },
      ],
    };

    // Also smoothly sync the ambient sound to the theme
    setSettings((prev) => ({
      ...prev,
      ambientSound: (theme.ambientSound as any) || prev.ambientSound,
    }));

    setActiveStory(themedStory);
  };

  const handleToggleBookmarkTheme = (themeId: string) => {
    setBookmarkedThemeIds((prev) =>
      prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
  };

  const handleSaveDreamEntry = (entry: DreamJournalEntry) => {
    setDreamEntries((prev) => [entry, ...prev]);
  };

  const handleUpdateDreamEntry = (updatedEntry: DreamJournalEntry) => {
    setDreamEntries((prev) =>
      prev.map((e) => (e.id === updatedEntry.id ? updatedEntry : e))
    );
  };

  const handleDeleteDreamEntry = (id: string) => {
    setDreamEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Compute active child profile for personalization
  const currentChildProfiles = settings.childProfiles && settings.childProfiles.length > 0
    ? settings.childProfiles
    : INITIAL_CHILD_PROFILES;

  const activeChildProfile =
    currentChildProfiles.find((p) => p.id === settings.activeChildProfileId) ||
    currentChildProfiles[0];

  const handleSwitchChildProfile = (profileId: string) => {
    const target = currentChildProfiles.find((p) => p.id === profileId);
    if (target) {
      const updated: AppSettings = {
        ...settings,
        activeChildProfileId: target.id,
        childName: target.name,
        childAge: target.age,
        childAvatar: target.avatar,
      };
      setSettings(updated);
      try {
        localStorage.setItem('infinite_heroes_settings', JSON.stringify(updated));
      } catch {}
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 bg-[#060413]">
      {/* Background Starry Sky Canvas */}
      <StarrySky />

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setShowMadlibsDirect(false);
          setCurrentTab(tab);
        }}
        onOpenSettings={() => setCurrentTab('settings')}
        savedCount={savedStories.length}
        streakCount={stats.currentStreak}
        childName={activeChildProfile?.name || settings.childName}
        childAvatar={activeChildProfile?.avatar || settings.childAvatar}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Full-screen Direct Madlib Diaries Mode if toggled */}
        {showMadlibsDirect ? (
          <MadlibDiariesView
            onBack={() => setShowMadlibsDirect(false)}
            onStoryGenerated={handleStoryGenerated}
            childName={activeChildProfile?.name || settings.childName}
            childAge={activeChildProfile?.age || settings.childAge}
          />
        ) : (
          <>
            {currentTab === 'home' && (
              <BedtimeChroniclesHome
                onSelectStory={(s) => setActiveStory(s)}
                onOpenDetails={(s) => setDetailsStory(s)}
                onOpenMadlibs={() => setShowMadlibsDirect(true)}
                onOpenDreamJournal={() => setShowDreamJournalModal(true)}
                onOpenWindDown={() => setShowWindDownModal(true)}
                onOpenLibrary={(categoryFilter) => {
                  setCurrentTab('library');
                }}
                onOpenCreator={() => setCurrentTab('create')}
                onOpenSettings={() => setCurrentTab('settings')}
                childName={activeChildProfile?.name || settings.childName}
                childAge={activeChildProfile?.age || settings.childAge}
                childAvatar={activeChildProfile?.avatar || settings.childAvatar}
                storyPreference={activeChildProfile?.storyPreference || 'Gentle Stories • Sleepy Animals'}
                gentleMode={activeChildProfile?.gentleMode !== false}
                activeChildProfileId={settings.activeChildProfileId || activeChildProfile?.id}
                childProfiles={currentChildProfiles}
                onSwitchProfile={handleSwitchChildProfile}
                completedStories={stats.completedStoriesList || DEFAULT_COMPLETED_STORIES}
                streakCount={stats.currentStreak}
                onAdvanceStreak={handleAdvanceStreak}
                dreamEntries={dreamEntries}
              />
            )}

            {currentTab === 'gallery' && (
              <ThemeGalleryView
                onStartStoryWithTheme={handleStartStoryWithTheme}
                bookmarkedThemeIds={bookmarkedThemeIds}
                onToggleBookmarkTheme={handleToggleBookmarkTheme}
                onOpenSettings={() => setCurrentTab('settings')}
                onOpenCreator={() => setCurrentTab('create')}
              />
            )}

            {currentTab === 'madlibs' && (
              <MadlibDiariesView
                onBack={() => setCurrentTab('home')}
                onStoryGenerated={handleStoryGenerated}
                childName={settings.childName}
                childAge={settings.childAge}
              />
            )}

            {currentTab === 'create' && (
              <StoryCreator
                initialMode={creatorInitialMode}
                onStoryGenerated={handleStoryGenerated}
                childName={settings.childName}
                childAge={settings.childAge}
              />
            )}

            {currentTab === 'library' && (
              <LibraryView
                onSelectStory={(s) => setActiveStory(s)}
                onSaveStory={handleToggleSaveStory}
                savedStoryIds={savedStories.map((s) => s.id)}
                isOnline={isOnline}
              />
            )}

            {currentTab === 'saved' && (
              <SavedStoriesView
                savedStories={savedStories}
                stats={stats}
                onSelectStory={(s) => setActiveStory(s)}
                onRemoveSavedStory={handleRemoveSavedStory}
                onOpenCreator={() => setCurrentTab('create')}
                isOnline={isOnline}
              />
            )}

            {currentTab === 'trophies' && (
              <TrophiesView
                badges={badges}
                completedStoryIds={[]}
              />
            )}

            {currentTab === 'settings' && (
              <SafetyPersonalizationView
                settings={settings}
                onSaveSettings={(newSettings) => setSettings(newSettings)}
                onNavigateToTab={(tab) => setCurrentTab(tab as NavTab)}
              />
            )}
          </>
        )}
      </main>


      {/* Active Story Reader Modal */}
      {activeStory && (
        <StoryReader
          story={activeStory}
          settings={settings}
          onClose={() => setActiveStory(null)}
          onCompleteStory={handleCompleteStory}
          onToggleSaveStory={handleToggleSaveStory}
          isSaved={savedStories.some((s) => s.id === activeStory.id)}
          badges={badges}
          onNavigateToVault={() => setCurrentTab('trophies')}
        />
      )}

      {/* Story Details Modal (Hero & Featured Details) */}
      <AnimatePresence>
        {detailsStory && (
          <StoryDetailsModal
            key={`story-details-${detailsStory.id}`}
            story={detailsStory}
            isOpen={Boolean(detailsStory)}
            onClose={() => setDetailsStory(null)}
            onPlay={(s) => {
              setDetailsStory(null);
              setActiveStory(s);
            }}
            onToggleSave={handleToggleSaveStory}
            isSaved={savedStories.some((s) => s.id === detailsStory.id)}
          />
        )}
      </AnimatePresence>

      {/* Dream Journal Modal */}
      <DreamJournalModal
        isOpen={showDreamJournalModal}
        onClose={() => setShowDreamJournalModal(false)}
        entries={dreamEntries}
        onSaveEntry={handleSaveDreamEntry}
        onUpdateEntry={handleUpdateDreamEntry}
        onDeleteEntry={handleDeleteDreamEntry}
        childName={settings.childName}
      />

      {/* Wind Down Setup Modal */}
      <WindDownModal
        isOpen={showWindDownModal}
        onClose={() => setShowWindDownModal(false)}
        settings={settings}
        onSaveSettings={setSettings}
      />

      {/* Bedtime Routine Settings Modal */}
      {showSettingsModal && (
        <SleepSetupModal
          settings={settings}
          onSaveSettings={setSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Unobtrusive Offline & Reconnection Toast Notification */}
      <OfflineToast
        isOnline={isOnline}
        wasOffline={wasOffline}
        onClearWasOffline={clearWasOffline}
        cachedStoryCount={cachedStoryCount}
        onOpenLibrary={() => setCurrentTab('library')}
        onOpenSaved={() => setCurrentTab('saved')}
      />
    </div>
  );
};


export default App;
