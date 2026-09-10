import React from 'react';
import { Story, UserStats } from '../types';
import { getHeroById } from '../data/heroes';
import {
  Bookmark,
  Sparkles,
  Play,
  Trash2,
  Clock,
  Flame,
  BookOpen,
  WifiOff,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';

interface SavedStoriesViewProps {
  savedStories: Story[];
  stats: UserStats;
  onSelectStory: (story: Story) => void;
  onRemoveSavedStory: (storyId: string) => void;
  onOpenCreator: () => void;
  isOnline?: boolean;
}

export const SavedStoriesView: React.FC<SavedStoriesViewProps> = ({
  savedStories,
  stats,
  onSelectStory,
  onRemoveSavedStory,
  onOpenCreator,
  isOnline = true,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Offline Status Alert Banner if offline */}
      {!isOnline && (
        <div className="p-4 rounded-3xl bg-amber-950/50 border border-amber-500/40 text-amber-200 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-900/60 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                Offline Library Mode Active
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950 border border-amber-500/50 text-amber-300">
                  Ready to Read
                </span>
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                All your saved favorites and completed bedtime tales are safely cached on this device with full voice narration and soundscapes.
              </p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-300 px-3 py-1.5 rounded-xl bg-amber-900/50 border border-amber-600/40 shrink-0">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{savedStories.length} Cached</span>
          </span>
        </div>
      )}

      {/* Bedtime Reading Stats Banner */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 to-slate-900/90 border border-indigo-500/30 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.storiesCompleted}</div>
            <div className="text-xs text-slate-300 font-medium">Bedtime Stories Completed</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/80 to-slate-900/90 border border-amber-500/30 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.totalReadingMinutes} min</div>
            <div className="text-xs text-slate-300 font-medium">Total Bedtime Reading</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/80 to-slate-900/90 border border-purple-500/30 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Flame className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.currentStreak} Nights</div>
            <div className="text-xs text-slate-300 font-medium">Starlight Reading Streak</div>
          </div>
        </div>
      </div>

      {/* Saved Favorites List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Bedtime Favorites</h3>
          </div>
          <span className="text-xs text-slate-400">{savedStories.length} stories saved</span>
        </div>

        {savedStories.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Bookmark className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">No Saved Stories Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Tap the bookmark icon on any story or generate your own custom bedtime tale to save it here for offline bedtime reading.
            </p>
            <button
              type="button"
              onClick={onOpenCreator}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Your First Bedtime Story</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedStories.map((story) => {
              const hero = getHeroById(story.heroId);

              return (
                <div
                  key={story.id}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between gap-4 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hero.color }} />
                        <span className="text-xs font-semibold text-indigo-300">{hero.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          Offline Ready
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {story.category || story.mode}
                        </span>
                      </div>

                    </div>

                    <h4 className="text-base font-bold text-white mb-1.5">{story.title}</h4>
                    <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                      {story.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onRemoveSavedStory(story.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectStory(story)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Read Story</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
