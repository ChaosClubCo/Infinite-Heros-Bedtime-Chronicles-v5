import React, { useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
  type Variants,
} from 'motion/react';
import { DreamJournalEntry } from '../types';
import {
  Calendar,
  Star,
  Trash2,
  Sparkles,
  Eye,
  Maximize2,
  RefreshCw,
  Palette,
  Wand2,
} from 'lucide-react';

interface DreamJournalCardProps {
  entry: DreamJournalEntry;
  moods: { id: string; label: string; icon: string }[];
  onDelete: (id: string) => void;
  onOpenLightbox: (entry: DreamJournalEntry) => void;
  onOpenArtStudio: (entry: DreamJournalEntry) => void;
  variants?: Variants;
}

const SWIPE_THRESHOLD = -90; // Pixels required to trigger delete

export const DreamJournalCard: React.FC<DreamJournalCardProps> = ({
  entry,
  moods,
  onDelete,
  onOpenLightbox,
  onOpenArtStudio,
  variants,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  // Motion values for smooth drag interpolation
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [0, -35, -100], [0, 0.7, 1]);
  const iconScale = useTransform(x, [0, -35, -100], [0.7, 0.95, 1.15]);
  const textOpacity = useTransform(x, [0, -45, -90], [0, 0.6, 1]);

  const handleDrag = (_: unknown, info: PanInfo) => {
    if (info.offset.x < SWIPE_THRESHOLD) {
      if (!isPastThreshold) setIsPastThreshold(true);
    } else {
      if (isPastThreshold) setIsPastThreshold(false);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // If dragged past threshold or swiped left with sufficient velocity
    if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -400) {
      setIsDeleting(true);
      onDelete(entry.id);
    } else {
      setIsPastThreshold(false);
    }
  };

  return (
    <motion.div
      variants={variants}
      layout
      initial="hidden"
      animate="visible"
      exit={{
        opacity: 0,
        x: -120,
        scale: 0.95,
        height: 0,
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden',
        transition: { duration: 0.25, ease: 'easeInOut' },
      }}
      className="relative overflow-hidden rounded-2xl select-none"
    >
      {/* Background Swipe Action Tray (Revealed on Swipe Left) */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 bg-gradient-to-l from-rose-600 via-rose-700 to-red-950 flex items-center justify-end px-5 rounded-2xl border border-rose-500/40"
      >
        <div className="flex items-center gap-2 text-white">
          <motion.span
            style={{ opacity: textOpacity }}
            className="text-xs font-bold tracking-wide transition-all"
          >
            {isPastThreshold ? 'Release to delete' : 'Swipe to delete'}
          </motion.span>
          <motion.div
            style={{ scale: iconScale }}
            className={`p-2 rounded-xl backdrop-blur-sm transition-colors ${
              isPastThreshold
                ? 'bg-white text-rose-600 shadow-lg'
                : 'bg-black/30 text-rose-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* Draggable Card Content */}
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={{ left: 0.25, right: 0.05 }}
        dragSnapToOrigin
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, touchAction: 'pan-y' }}
        className={`relative z-10 p-4 sm:p-5 rounded-2xl bg-[#0e0c24] border border-indigo-950 hover:border-indigo-800/60 transition-colors space-y-3.5 shadow-lg shadow-black/50 cursor-grab active:cursor-grabbing ${
          isDeleting ? 'pointer-events-none' : ''
        }`}
      >
        {/* Top Row: Mood, Title, Date, Stars & Accessible Delete button */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <span
              className="text-xl p-1.5 rounded-xl bg-purple-950/50 border border-purple-800/40 shrink-0"
              title={entry.mood}
            >
              {moods.find((m) => m.id === entry.mood)?.icon || '✨'}
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {entry.title}
              </h4>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-indigo-400" />
                {entry.date}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
              {[...Array(entry.sleepRating)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Delete entry (or swipe left)"
              aria-label={`Delete dream ${entry.title}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dream Content */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal bg-slate-950/40 p-3 rounded-xl border border-indigo-950/60">
          {entry.content}
        </p>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 text-[10px] font-medium border border-indigo-900/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Dream Illustration Section */}
        <div className="pt-2 border-t border-indigo-950/60">
          {entry.illustration ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-900/40 flex flex-col sm:flex-row items-center gap-4">
              {/* Artwork Thumbnail with Zoom Button */}
              <div className="relative group w-full sm:w-44 h-32 rounded-xl overflow-hidden shrink-0 border border-purple-500/30 bg-slate-950 shadow-md">
                <img
                  src={entry.illustration.url}
                  alt={`Dream illustration for ${entry.title}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <span className="text-[10px] text-purple-200 font-medium truncate">
                    {entry.illustration.styleLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLightbox(entry);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
                  title="View full illustration"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info & Regenerate Actions */}
              <div className="flex-1 space-y-2 w-full text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Dream Illustration ({entry.illustration.styleLabel})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {entry.illustration.createdAt}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 italic">
                  &ldquo;{entry.illustration.prompt}&rdquo;
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(entry);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/40 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Art</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenArtStudio(entry);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/40 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    <span>Re-paint / Change Style</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Call-to-action button to trigger AI Image Generator */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-slate-900/40 border border-dashed border-indigo-800/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Palette className="w-4 h-4 text-purple-300" />
                </div>
                <div className="text-left">
                  <h5 className="text-xs font-bold text-slate-200">No illustration yet</h5>
                  <p className="text-[11px] text-slate-400">
                    Use Image Generation to bring this dream to life with watercolors or cosmic starlight.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenArtStudio(entry);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all hover:scale-102 active:scale-98 shrink-0"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Generate Dream Illustration</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
