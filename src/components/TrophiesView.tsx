import React, { useState } from 'react';
import { CelestialBadge } from '../types';
import { HEROES } from '../data/heroes';
import { BadgeUnlockCelebrationModal } from './BadgeUnlockCelebrationModal';
import {
  Award,
  Sparkles,
  Shield,
  Heart,
  Moon,
  Train,
  Flame,
  Laugh,
  Compass,
  Lock,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface TrophiesViewProps {
  badges: CelestialBadge[];
  completedStoryIds: string[];
}

export const TrophiesView: React.FC<TrophiesViewProps> = ({ badges, completedStoryIds }) => {
  const [celebratingBadge, setCelebratingBadge] = useState<CelestialBadge | null>(null);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="w-6 h-6" />;
      case 'Shield': return <Shield className="w-6 h-6" />;
      case 'Heart': return <Heart className="w-6 h-6" />;
      case 'Moon': return <Moon className="w-6 h-6" />;
      case 'Train': return <Train className="w-6 h-6" />;
      case 'Flame': return <Flame className="w-6 h-6" />;
      case 'Laugh': return <Laugh className="w-6 h-6" />;
      case 'Compass': return <Compass className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Trophies Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900/90 border border-indigo-500/30 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Celestial Vault</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">Starlight Badges & Trophies</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1">
            Every bedtime story unlocks celestial milestones and powers up the constellations in your night sky! Click any unlocked trophy to replay its celebration.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[140px]">
          <div className="text-3xl font-extrabold text-amber-400">
            {unlockedCount} / {badges.length}
          </div>
          <div className="text-xs font-semibold text-slate-400 mt-1">Badges Earned</div>
        </div>
      </div>

      {/* Badges Grid */}
      <section className="space-y-4">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Milestone Trophies</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              onClick={() => {
                if (badge.unlocked) {
                  setCelebratingBadge(badge);
                }
              }}
              className={`relative p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                badge.unlocked
                  ? 'bg-slate-900/80 border-indigo-500/40 shadow-xl shadow-indigo-500/10 cursor-pointer hover:border-amber-400/60 hover:scale-[1.02] active:scale-[0.99]'
                  : 'bg-slate-950/50 border-slate-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg"
                    style={{
                      backgroundColor: badge.unlocked ? `${badge.color}25` : '#1e293b',
                      color: badge.unlocked ? badge.color : '#64748b',
                      borderColor: badge.unlocked ? badge.color : '#334155',
                      borderWidth: '1px',
                    }}
                  >
                    {getBadgeIcon(badge.icon)}
                  </div>

                  {badge.unlocked ? (
                    <span className="p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40" title="Unlocked!">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-slate-800 text-slate-500 border border-slate-700" title="Locked">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <h5 className="text-base font-bold text-white mb-1">{badge.name}</h5>
                <p className="text-xs text-slate-300/80 leading-relaxed mb-4">
                  {badge.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] font-medium flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={badge.unlocked ? 'text-amber-300 font-bold flex items-center gap-1' : 'text-slate-500 font-semibold'}>
                  {badge.unlocked ? '✨ Celebrate' : 'In Progress'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8 Hero Constellation Mastery */}
      <section className="space-y-4 pt-4">
        <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Guardian Constellations</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {HEROES.map((hero) => (
            <div
              key={hero.id}
              className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-bold text-xs shrink-0"
                style={{ backgroundColor: hero.color }}
              >
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{hero.constellation}</div>
                <div className="text-[11px] text-slate-400 truncate">{hero.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Badge Celebration Modal from Trophies */}
      {celebratingBadge && (
        <BadgeUnlockCelebrationModal
          badges={[celebratingBadge]}
          heroColor={celebratingBadge.color}
          onClose={() => setCelebratingBadge(null)}
        />
      )}
    </div>
  );
};
