import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  WifiOff,
  Wifi,
  BookOpen,
  X,
  Sparkles,
  CheckCircle2,
  HardDrive,
  ChevronRight,
} from 'lucide-react';

export interface OfflineToastProps {
  isOnline: boolean;
  wasOffline: boolean;
  onClearWasOffline: () => void;
  cachedStoryCount: number;
  onOpenLibrary?: () => void;
  onOpenSaved?: () => void;
}

export const OfflineToast: React.FC<OfflineToastProps> = ({
  isOnline,
  wasOffline,
  onClearWasOffline,
  cachedStoryCount,
  onOpenLibrary,
  onOpenSaved,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // When connection drops to offline, reset dismissal so parent/child is alerted
  useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
      setIsMinimized(false);
    }
  }, [isOnline]);

  // Auto-dismiss the "Back Online" toast after 4.5 seconds
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        onClearWasOffline();
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, onClearWasOffline]);

  // Render "Back Online" confirmation toast
  if (isOnline && wasOffline) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-slate-100 flex items-center justify-between gap-3"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span>Back Online</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Starlight connection and sync restored
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearWasOffline}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            aria-label="Dismiss online notification"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  // If online and not coming back from offline, nothing to display
  if (isOnline) return null;

  // If user dismissed completely
  if (isDismissed) return null;

  // Minimized pill state
  if (isMinimized) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        type="button"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/95 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-xl hover:border-amber-400 transition-all active:scale-95 group"
        title="Click to view offline status details"
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Offline Mode</span>
        <span className="px-1.5 py-0.2 rounded-md bg-amber-950 border border-amber-600/40 text-[10px] text-amber-200">
          {cachedStoryCount} tales
        </span>
      </motion.button>
    );
  }

  // Full unobtrusive offline banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] bg-slate-900/95 border border-indigo-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-xl text-slate-100 relative overflow-hidden"
        role="alert"
        aria-live="assertive"
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-indigo-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-sm mt-0.5">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  Offline Mode Active
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center gap-1">
                  <HardDrive className="w-2.5 h-2.5 text-indigo-400" />
                  Cached Storage
                </span>
              </div>
              <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                You can read your saved favorites, completed stories, and explore the bedtime library without internet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[10px] font-semibold"
              title="Minimize offline banner"
            >
              Minimize
            </button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Dismiss offline banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-slate-200">{cachedStoryCount}</strong> bedtime tales available offline
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSaved && (
              <button
                type="button"
                onClick={onOpenSaved}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-[11px] font-bold text-slate-200 hover:text-white transition-all"
              >
                Saved Tales
              </button>
            )}
            {onOpenLibrary && (
              <button
                type="button"
                onClick={onOpenLibrary}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
              >
                <BookOpen className="w-3 h-3" />
                <span>Browse Library</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
