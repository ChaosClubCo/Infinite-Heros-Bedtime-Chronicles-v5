import React from 'react';
import { Hero } from '../types';
import { Shield, Waves, Sparkles, Moon, Cloud, Flower2, Train, Ghost, Zap } from 'lucide-react';

interface HeroCardProps {
  hero: Hero;
  isSelected?: boolean;
  onSelect?: (hero: Hero) => void;
  compact?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  hero,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  const getHeroIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Waves': return <Waves className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Moon': return <Moon className="w-5 h-5" />;
      case 'Cloud': return <Cloud className="w-5 h-5" />;
      case 'Flower2': return <Flower2 className="w-5 h-5" />;
      case 'Train': return <Train className="w-5 h-5" />;
      case 'Ghost': return <Ghost className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (compact) {
    return (
      <button
        id={`hero-card-compact-${hero.id}`}
        type="button"
        onClick={() => onSelect?.(hero)}
        className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-200 ${
          isSelected
            ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
        }`}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-900 font-bold shrink-0 shadow-md"
          style={{ backgroundColor: hero.color }}
        >
          {getHeroIcon(hero.icon)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white truncate">{hero.name}</div>
          <div className="text-xs text-slate-400 truncate">{hero.power}</div>
        </div>
      </button>
    );
  }

  return (
    <div
      id={`hero-card-${hero.id}`}
      onClick={() => onSelect?.(hero)}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-indigo-400 shadow-xl shadow-indigo-500/20 scale-[1.02]'
          : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/60 hover:scale-[1.01]'
      }`}
    >
      {/* Background ambient accent */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full opacity-20 blur-2xl group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: hero.color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-950 font-bold shadow-lg transition-transform group-hover:scale-105"
            style={{ backgroundColor: hero.color }}
          >
            {getHeroIcon(hero.icon)}
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700">
            <Zap className="w-3 h-3 text-amber-400" />
            {hero.constellation}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white tracking-tight">{hero.name}</h3>
        <p className="text-xs font-medium text-indigo-300 mb-2">{hero.title}</p>
        <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3 mb-4">
          {hero.description}
        </p>
      </div>

      <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-400">Power:</span>
        <span className="font-semibold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
          {hero.power}
        </span>
      </div>
    </div>
  );
};
