import React, { useState, useEffect } from 'react';
import { Story, UserStats, AppSettings, CelestialBadge, DreamJournalEntry } from './types';
import { FEATURED_STORIES } from './data/featuredStories';
import { INITIAL_BADGES } from './data/badges';
import { StarrySky } from './components/StarrySky';
import { Navbar, NavTab } from './components/Navbar';
import { BedtimeChroniclesHome } from './components/BedtimeChroniclesHome';
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

const DEFAULT_SETTINGS: AppSettings = {
  narratorVoice: 'moonbeam',
  readingSpeed: 'gentle',
  ambientSound: 'ocean',
  ambientVolume: 0.35,
  autoAdvance: true,
  sleepTimerMinutes: 15,
  parentPin: '1234',
  childName: 'Little Explorer',
  childAge: 5,
  childAvatar: 'fox',
  themeMode: 'dark',
};

const DEFAULT_STATS: UserStats = {
  storiesCompleted: 2,
  totalReadingMinutes: 14,
  currentStreak: 3,
  favoriteHeroId: 'hero-1',
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
      return stored ? JSON.parse(stored) : DEFAULT_STATS;
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

  // Sync to local storage
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

  const handleCompleteStory = (_storyId: string) => {
    setStats((prev) => ({
      ...prev,
      storiesCompleted: prev.storiesCompleted + 1,
      totalReadingMinutes: prev.totalReadingMinutes + 5,
    }));

    // Unlock badges dynamically
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === 'badge-first-star') return { ...b, unlocked: true };
        if (b.id === 'badge-streak-3') return { ...b, unlocked: true };
        return b;
      })
    );
  };

  const handleStoryGenerated = (story: Story) => {
    setActiveStory(story);
    setShowMadlibsDirect(false);
  };

  const handleSaveDreamEntry = (entry: DreamJournalEntry) => {
    setDreamEntries((prev) => [entry, ...prev]);
  };

  const handleDeleteDreamEntry = (id: string) => {
    setDreamEntries((prev) => prev.filter((e) => e.id !== id));
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
        onOpenSettings={() => setShowSettingsModal(true)}
        savedCount={savedStories.length}
        streakCount={stats.currentStreak}
        childName={settings.childName}
        childAvatar={settings.childAvatar}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Full-screen Direct Madlib Diaries Mode if toggled */}
        {showMadlibsDirect ? (
          <MadlibDiariesView
            onBack={() => setShowMadlibsDirect(false)}
            onStoryGenerated={handleStoryGenerated}
            childName={settings.childName}
            childAge={settings.childAge}
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
                onOpenSettings={() => setShowSettingsModal(true)}
                childName={settings.childName}
                childAvatar={settings.childAvatar}
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
              />
            )}

            {currentTab === 'saved' && (
              <SavedStoriesView
                savedStories={savedStories}
                stats={stats}
                onSelectStory={(s) => setActiveStory(s)}
                onRemoveSavedStory={handleRemoveSavedStory}
                onOpenCreator={() => setCurrentTab('create')}
              />
            )}

            {currentTab === 'trophies' && (
              <TrophiesView
                badges={badges}
                completedStoryIds={[]}
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
        />
      )}

      {/* Story Details Modal (Hero & Featured Details) */}
      {detailsStory && (
        <StoryDetailsModal
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

      {/* Dream Journal Modal */}
      <DreamJournalModal
        isOpen={showDreamJournalModal}
        onClose={() => setShowDreamJournalModal(false)}
        entries={dreamEntries}
        onSaveEntry={handleSaveDreamEntry}
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
    </div>
  );
};

export default App;
