import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Shield,
  Heart,
  Moon,
  Train,
  Flame,
  Laugh,
  Compass,
  Award,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Stars,
} from 'lucide-react';
import { CelestialBadge } from '../types';
import { ambientSoundEngine } from '../services/audioNarration';

interface BadgeUnlockCelebrationModalProps {
  badges: CelestialBadge[];
  heroColor?: string;
  storyTitle?: string;
  onClose: () => void;
  onViewVault?: () => void;
}

export const BadgeUnlockCelebrationModal: React.FC<BadgeUnlockCelebrationModalProps> = ({
  badges,
  heroColor = '#818CF8',
  storyTitle,
  onClose,
  onViewVault,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const celebrationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const currentBadge = badges[currentIndex] || badges[0];

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-10 h-10" />;
      case 'Shield':
        return <Shield className="w-10 h-10" />;
      case 'Heart':
        return <Heart className="w-10 h-10" />;
      case 'Moon':
        return <Moon className="w-10 h-10" />;
      case 'Train':
        return <Train className="w-10 h-10" />;
      case 'Flame':
        return <Flame className="w-10 h-10" />;
      case 'Laugh':
        return <Laugh className="w-10 h-10" />;
      case 'Compass':
        return <Compass className="w-10 h-10" />;
      default:
        return <Award className="w-10 h-10" />;
    }
  };

  const triggerFullCelebration = useCallback(
    (badgeColor = currentBadge?.color || '#F59E0B') => {
      // 1. Play warm celestial chime chord
      ambientSoundEngine.playCelebrationChime();

      // 2. Multi-stage confetti and starlight bursts
      celebrationTimersRef.current.forEach(clearTimeout);
      celebrationTimersRef.current = [];

      try {
        const palette = [
          '#FFD700', // Gold
          '#FBBF24', // Amber
          badgeColor, // Signature badge color
          heroColor, // Hero color
          '#E0E7FF', // Starlight pearl
          '#F472B6', // Sparkle pink
          '#38BDF8', // Cyan sky
        ];

        // Wave 1: Immediate central burst with stars
        confetti({
          particleCount: 90,
          spread: 90,
          origin: { y: 0.52 },
          colors: palette,
          scalar: 1.25,
          ticks: 240,
        });

        // Wave 2: Left starlight cannon
        const t1 = setTimeout(() => {
          confetti({
            particleCount: 65,
            angle: 60,
            spread: 65,
            origin: { x: 0.12, y: 0.65 },
            colors: palette,
            scalar: 1.2,
            ticks: 220,
          });
        }, 160);

        // Wave 3: Right starlight cannon
        const t2 = setTimeout(() => {
          confetti({
            particleCount: 65,
            angle: 120,
            spread: 65,
            origin: { x: 0.88, y: 0.65 },
            colors: palette,
            scalar: 1.2,
            ticks: 320,
          });
        }, 320);

        // Wave 4: Gentle starlight shower floating from above
        const t3 = setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 140,
            origin: { y: 0.2 },
            colors: ['#FFD700', '#FEF08A', '#FFFFFF', badgeColor],
            gravity: 0.7,
            ticks: 350,
            scalar: 1.0,
          });
        }, 550);

        celebrationTimersRef.current = [t1, t2, t3];
      } catch {
        // Ignored if canvas is restricted
      }
    },
    [currentBadge?.color, heroColor]
  );

  useEffect(() => {
    triggerFullCelebration(currentBadge?.color);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      celebrationTimersRef.current.forEach(clearTimeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, currentBadge?.color, onClose, triggerFullCelebration]);

  if (!currentBadge) return null;

  return (
    <div
      id="badge-celebration-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="badge-celebration-title"
    >
      {/* Background Rotating Cosmic Aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div
          className="w-[580px] h-[580px] rounded-full opacity-25 blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${currentBadge.color} 0%, ${heroColor} 40%, transparent 70%)`,
          }}
        />
        {/* Rotating Celestial Ray Beams */}
        <div
          className="absolute w-[640px] h-[640px] rounded-full opacity-20 animate-spin"
          style={{
            animationDuration: '28s',
            background: `conic-gradient(from 0deg, ${currentBadge.color}, transparent 40deg, ${heroColor} 120deg, transparent 180deg, ${currentBadge.color} 240deg, transparent 300deg, ${heroColor} 360deg)`,
          }}
        />
      </div>

      <motion.div
        id="badge-celebration-card"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 15 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative max-w-lg w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-amber-500/40 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/10 overflow-hidden"
      >
        {/* Close Button */}
        <button
          id="badge-celebration-close-btn"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors z-20"
          title="Close Celebration"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Eyebrow Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/50 text-amber-300 shadow-md shadow-amber-500/10 mb-5">
          <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
          <span className="tracking-wide uppercase">New Celestial Badge Unlocked!</span>
          <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
        </div>

        {/* Central Floating Badge Icon with Radiant Glow Ring */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Pulsing Backlight Glow */}
          <div
            className="absolute w-32 h-32 rounded-full opacity-40 blur-xl animate-ping"
            style={{
              backgroundColor: currentBadge.color,
              animationDuration: '3s',
            }}
          />

          <motion.div
            key={currentBadge.id}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl flex items-center justify-center font-bold shadow-2xl z-10 border-2"
            style={{
              backgroundColor: `${currentBadge.color}25`,
              borderColor: currentBadge.color,
              color: currentBadge.color,
              boxShadow: `0 0 35px ${currentBadge.color}45`,
            }}
          >
            {getBadgeIcon(currentBadge.icon)}

            {/* Sparkle Badges at Corners */}
            <div className="absolute -top-2 -right-2 p-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-400 shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-2 -left-2 p-1.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400 shadow-lg">
              <Stars className="w-4 h-4" />
            </div>
          </motion.div>
        </div>

        {/* Badge Title & Metadata */}
        <div className="space-y-2 mt-4">
          <div className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            {currentBadge.category} Milestone
          </div>
          <h2
            id="badge-celebration-title"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            {currentBadge.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
            {currentBadge.description}
          </p>
        </div>

        {/* Story Context & Constellation Reward Box */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-1.5">
          {storyTitle && (
            <div className="flex items-center justify-between text-slate-400">
              <span>Earned from:</span>
              <span className="font-semibold text-indigo-300 truncate max-w-[200px]">
                {storyTitle}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-slate-400">
            <span>Celestial Reward:</span>
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> +10 Constellation Starlight
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Vault Status:</span>
            <span className="font-semibold text-emerald-400">Permanently Recorded 🌟</span>
          </div>
        </div>

        {/* Multi-badge Pagination Controls (if more than 1 badge unlocked together) */}
        {badges.length > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-slate-400">
              Badge {currentIndex + 1} of {badges.length}
            </span>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, badges.length - 1))}
              disabled={currentIndex === badges.length - 1}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            id="badge-celebration-replay-btn"
            type="button"
            onClick={() => triggerFullCelebration(currentBadge.color)}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-amber-500/10"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Replay Star Sparks & Chimes</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {onViewVault && (
              <button
                id="badge-celebration-vault-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onViewVault();
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>View Trophy Vault</span>
              </button>
            )}

            <button
              id="badge-celebration-claim-btn"
              type="button"
              onClick={onClose}
              className={`py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all ${
                !onViewVault ? 'sm:col-span-2' : ''
              }`}
            >
              Claim & Sweet Dreams 🌙
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
