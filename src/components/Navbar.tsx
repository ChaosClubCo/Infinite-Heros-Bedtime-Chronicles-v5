import React from 'react';
import { getAvatarById } from '../data/avatars';
import { useSyncOfflineStatus } from '../context/SyncOfflineContext';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Bookmark,
  Award,
  Settings,
  Compass,
  Wand2,
  WifiOff,
  Wind,
  RefreshCw,
  Cloud,
} from 'lucide-react';

export type NavTab = 'home' | 'gallery' | 'madlibs' | 'create' | 'library' | 'saved' | 'trophies' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  onOpenGuidedBreathing?: () => void;
  savedCount: number;
  streakCount: number;
  childName?: string;
  childAvatar?: string;
  isOnline?: boolean;
  isSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onOpenGuidedBreathing,
  savedCount,
  streakCount,
  childName = 'Little Explorer',
  childAvatar = 'fox',
  isOnline = true,
  isSyncing: isSyncingProp,
}) => {
  const avatarObj = getAvatarById(childAvatar);

  // Read sync state from context
  let contextSyncState: { isSyncing: boolean; triggerManualSync?: () => Promise<void> } = {
    isSyncing: false,
  };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextSyncState = useSyncOfflineStatus();
  } catch {
    // Fallback if rendered outside of SyncOfflineProvider
  }

  const isSyncing = isSyncingProp !== undefined ? isSyncingProp : contextSyncState.isSyncing;
  const triggerManualSync = contextSyncState.triggerManualSync;


  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          id="brand-logo"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 p-0.5 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform overflow-hidden">
            <img
              src="/assets/images/splash-icon.png"
              alt="Infinite Heroes Star-Shield Emblem"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Infinite Heroes</span>
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                Bedtime
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Bedtime Chronicles v5</p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          {[
            { id: 'home', label: 'Explore', icon: Compass },
            { id: 'gallery', label: 'Dream Themes', icon: Sparkles },
            { id: 'madlibs', label: 'Madlib Suite', icon: Wand2 },
            { id: 'create', label: 'Create Story', icon: PlusCircle },
            { id: 'library', label: 'Library & Seeds', icon: BookOpen },
            { id: 'saved', label: `Favorites (${savedCount})`, icon: Bookmark },
            { id: 'trophies', label: 'Trophies', icon: Award },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side: Streak & Settings */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline Mode Indicator Badge */}
          {!isOnline && (
            <div
              id="navbar-offline-badge"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-sm animate-pulse"
              title="Offline Mode Active — Cached Stories & Library Ready"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>
          )}

          {/* Offline Data Syncing Indicator Badge (SyncOfflineContext) */}
          {isSyncing ? (
            <div
              id="navbar-syncing-indicator"
              role="status"
              aria-live="polite"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/90 via-cyan-950/80 to-purple-950/90 border border-cyan-400/60 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-500/20 backdrop-blur-md animate-pulse cursor-pointer hover:border-cyan-300 transition-all"
              title="Syncing offline bedtime data, stories, and journal to server..."
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-spin shrink-0" />
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="hidden sm:inline">Syncing offline data...</span>
              <span className="sm:hidden">Syncing...</span>
            </div>
          ) : isOnline && triggerManualSync ? (
            <button
              id="navbar-manual-sync-btn"
              type="button"
              onClick={() => triggerManualSync()}
              className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 transition-colors hidden sm:flex items-center justify-center"
              title="All offline data synced with server • Click to refresh sync"
            >
              <Cloud className="w-4 h-4" />
            </button>
          ) : null}

          {/* Bedtime Reading Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm"
            title="Current bedtime reading streak"
          >
            <span className="text-sm">🔥</span>
            <span className="hidden xs:inline">{streakCount} Night Streak</span>
            <span className="xs:hidden">{streakCount}</span>
          </div>

          {/* Guided Breathing Quick Action */}
          {onOpenGuidedBreathing && (
            <button
              id="navbar-guided-breathing-btn"
              type="button"
              onClick={onOpenGuidedBreathing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-bold transition-all shadow-sm group"
              title="Guided Bedtime Breathing • Calm Orb for Sleep"
            >
              <Wind className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Breathe</span>
            </button>
          )}


          {/* Bedtime Routine & Child Profile */}
          <button
            id="open-settings-btn"
            type="button"
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors ${
              currentTab === 'settings'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800'
            }`}
            title={`Bedtime Settings & Safety (${childName})`}
          >
            <span className="text-base">{avatarObj.emoji}</span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl py-1.5 px-2 shadow-2xl shadow-black safe-area-inset-bottom overflow-x-auto custom-scrollbar"
      >
        {[
          { id: 'home', label: 'Explore', icon: Compass },
          { id: 'gallery', label: 'Themes', icon: Sparkles },
          { id: 'madlibs', label: 'Madlibs', icon: Wand2 },
          { id: 'create', label: 'Create', icon: PlusCircle },
          { id: 'library', label: 'Library', icon: BookOpen },
          { id: 'saved', label: `Saved${savedCount > 0 ? ` (${savedCount})` : ''}`, icon: Bookmark },
          { id: 'trophies', label: 'Trophies', icon: Award },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              id={`mobile-nav-tab-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] py-1 px-2 rounded-xl text-[10px] font-bold transition-all shrink-0 active:scale-95 ${
                isActive
                  ? 'text-indigo-300 bg-indigo-950/70 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5] text-amber-300' : 'stroke-2'}`} />
              <span className="whitespace-nowrap leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
