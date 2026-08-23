import React from 'react';
import { getAvatarById } from '../data/avatars';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Bookmark,
  Award,
  Settings,
  Compass,
} from 'lucide-react';

export type NavTab = 'home' | 'create' | 'library' | 'saved' | 'trophies';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  savedCount: number;
  streakCount: number;
  childName?: string;
  childAvatar?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  savedCount,
  streakCount,
  childName = 'Little Explorer',
  childAvatar = 'fox',
}) => {
  const avatarObj = getAvatarById(childAvatar);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          id="brand-logo"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-current" />
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
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
          {[
            { id: 'home', label: 'Explore', icon: Compass },
            { id: 'create', label: 'Create Story', icon: PlusCircle },
            { id: 'library', label: 'Library & Seeds', icon: BookOpen },
            { id: 'saved', label: `Favorites (${savedCount})`, icon: Bookmark },
            { id: 'trophies', label: 'Trophies', icon: Award },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
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
        <div className="flex items-center gap-3">
          {/* Bedtime Reading Streak Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm"
            title="Current bedtime reading streak"
          >
            <span className="text-sm">🔥</span>
            <span>{streakCount} Night Streak</span>
          </div>

          {/* Bedtime Routine & Child Profile */}
          <button
            id="open-settings-btn"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800 transition-colors"
            title={`Bedtime Settings & Profile (${childName})`}
          >
            <span className="text-base">{avatarObj.emoji}</span>
            <Settings className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/95 py-2 px-3">
        {[
          { id: 'home', label: 'Explore', icon: Compass },
          { id: 'create', label: 'Create', icon: PlusCircle },
          { id: 'library', label: 'Library', icon: BookOpen },
          { id: 'saved', label: 'Favorites', icon: Bookmark },
          { id: 'trophies', label: 'Trophies', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id as NavTab)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
