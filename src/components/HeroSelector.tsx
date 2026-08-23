import React from 'react';
import { Hero } from '../types';
import { HEROES } from '../data/heroes';
import { HeroCard } from './HeroCard';
import { Sparkles } from 'lucide-react';

interface HeroSelectorProps {
  selectedHeroId: string;
  onSelectHero: (hero: Hero) => void;
  compact?: boolean;
}

export const HeroSelector: React.FC<HeroSelectorProps> = ({
  selectedHeroId,
  onSelectHero,
  compact = false,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-semibold text-slate-200">Choose Your Bedtime Hero</h4>
        </div>
        <span className="text-xs text-slate-400">8 Guardians of the Night</span>
      </div>

      {compact ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {HEROES.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isSelected={hero.id === selectedHeroId}
              onSelect={onSelectHero}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HEROES.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isSelected={hero.id === selectedHeroId}
              onSelect={onSelectHero}
            />
          ))}
        </div>
      )}
    </div>
  );
};
