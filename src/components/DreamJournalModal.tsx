import React, { useState } from 'react';
import { DreamJournalEntry, DreamArtStyle, DreamIllustration } from '../types';
import {
  Moon,
  Star,
  Plus,
  Trash2,
  Calendar,
  X,
  Sparkles,
  Palette,
  Maximize2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import {
  DREAM_ART_STYLES,
  generateDreamIllustration,
  buildDreamIllustrationPrompt,
} from '../services/dreamIllustration';

interface DreamJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DreamJournalEntry[];
  onSaveEntry: (entry: DreamJournalEntry) => void;
  onUpdateEntry?: (entry: DreamJournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  childName: string;
}

export const DreamJournalModal: React.FC<DreamJournalModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
  onUpdateEntry,
  onDeleteEntry,
  childName,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<DreamJournalEntry['mood']>('peaceful');
  const [sleepRating, setSleepRating] = useState(5);
  const [customTag, setCustomTag] = useState('');
  const [tags, setTags] = useState<string[]>(['Stars', 'Animals']);

  // Dream Illustration Generator State
  const [illustratingEntry, setIllustratingEntry] = useState<DreamJournalEntry | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<DreamArtStyle>('watercolor');
  const [isGeneratingArt, setIsGeneratingArt] = useState(false);
  const [artProgressStep, setArtProgressStep] = useState('');
  const [artProgressPercent, setArtProgressPercent] = useState(0);
  const [previewIllustration, setPreviewIllustration] = useState<DreamIllustration | null>(null);

  // Lightbox viewer state
  const [lightboxEntry, setLightboxEntry] = useState<DreamJournalEntry | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newEntry: DreamJournalEntry = {
      id: `dream-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      title: title.trim(),
      content: content.trim(),
      mood,
      tags,
      sleepRating,
    };

    onSaveEntry(newEntry);
    setTitle('');
    setContent('');
    setIsCreating(false);
  };

  const handleAddTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim())) {
      setTags([...tags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleOpenArtStudio = (entry: DreamJournalEntry) => {
    setIllustratingEntry(entry);
    setSelectedStyle(entry.illustration?.style || 'watercolor');
    setPreviewIllustration(entry.illustration || null);
    setArtProgressStep('');
    setArtProgressPercent(0);
  };

  const handleTriggerGenerate = async () => {
    if (!illustratingEntry) return;

    setIsGeneratingArt(true);
    setArtProgressStep('Initializing Dream Vision...');
    setArtProgressPercent(10);

    try {
      const illustration = await generateDreamIllustration(
        illustratingEntry,
        selectedStyle,
        (step, pct) => {
          setArtProgressStep(step);
          setArtProgressPercent(pct);
        }
      );

      setPreviewIllustration(illustration);

      // Persist to entry
      const updatedEntry: DreamJournalEntry = {
        ...illustratingEntry,
        illustration,
      };

      if (onUpdateEntry) {
        onUpdateEntry(updatedEntry);
      } else {
        onSaveEntry(updatedEntry);
      }
      setIllustratingEntry(updatedEntry);
    } catch (err) {
      console.error('Failed to generate dream illustration', err);
    } finally {
      setIsGeneratingArt(false);
    }
  };

  const moods: { id: DreamJournalEntry['mood']; label: string; icon: string }[] = [
    { id: 'peaceful', label: 'Peaceful', icon: '🌙' },
    { id: 'magical', label: 'Magical', icon: '✨' },
    { id: 'adventurous', label: 'Adventurous', icon: '🚀' },
    { id: 'cozy', label: 'Cozy', icon: '🧸' },
    { id: 'funny', label: 'Funny', icon: '😄' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080718] border border-indigo-900/60 shadow-2xl shadow-indigo-950/90 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-indigo-900/40 flex items-center justify-between bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <Moon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-playfair text-white tracking-wide">
                  Dream Journal
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> AI Art Studio
                </span>
              </div>
              <p className="text-xs text-indigo-300/80">
                {childName}&apos;s Morning Reflections, Bedtime Dreams & Starlight Artwork
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {!isCreating ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Recorded Dreams ({entries.length})
                  </span>
                  <span className="text-[11px] text-indigo-400/80 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-900/40">
                    {entries.filter((e) => e.illustration).length} Illustrated
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>Write New Dream</span>
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-indigo-900/30">
                  <Moon className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-200">No dreams recorded yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                    Wake up in the morning and record the magical stories, flying creatures, or sweet adventures you dreamed about!
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Record Tonight&apos;s Dream
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#0e0c24]/80 border border-indigo-950 hover:border-indigo-800/60 transition-all space-y-3.5 shadow-lg shadow-black/40"
                    >
                      {/* Top Row: Mood, Title, Date, Stars & Delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-xl p-1.5 rounded-xl bg-purple-950/50 border border-purple-800/40 shrink-0" title={entry.mood}>
                            {moods.find((m) => m.id === entry.mood)?.icon || '✨'}
                          </span>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">{entry.title}</h4>
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
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            title="Delete entry"
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
                                onClick={() => setLightboxEntry(entry)}
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
                              <p className="text-[11px] text-slate-300 line-clamp-2 italic text-slate-400">
                                &ldquo;{entry.illustration.prompt}&rdquo;
                              </p>
                              
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setLightboxEntry(entry)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-900/60 hover:bg-indigo-800/80 text-indigo-200 border border-indigo-700/40 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Art</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenArtStudio(entry)}
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
                              onClick={() => handleOpenArtStudio(entry)}
                              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all hover:scale-102 active:scale-98 shrink-0"
                            >
                              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                              <span>Generate Dream Illustration</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dream Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flying over Candy Castle with Koda"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  What happened in your dream?
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe the magical sights, funny sounds, or friendly animals..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Dream Mood
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {moods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMood(m.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                        mood === m.id
                          ? 'bg-purple-900/80 border-purple-400 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  How restful was your sleep?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSleepRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= sleepRating
                            ? 'text-amber-400 fill-current'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags & Elements
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Add custom tag (e.g. Moon, Whale)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 rounded-lg bg-indigo-900/70 hover:bg-indigo-800 text-indigo-200 text-xs font-bold"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[11px] border border-indigo-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-indigo-950">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Dream Art Studio Generator Drawer / Modal */}
      {illustratingEntry && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-xl rounded-3xl bg-[#09081f] border border-purple-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Studio Header */}
            <div className="p-5 border-b border-indigo-900/40 flex items-center justify-between bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-900/50 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Palette className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-playfair">
                    Dream Illustration Studio
                  </h3>
                  <p className="text-[11px] text-indigo-300/80 truncate max-w-xs">
                    Painting: {illustratingEntry.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isGeneratingArt) setIllustratingEntry(null);
                }}
                disabled={isGeneratingArt}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Studio Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Dream Context Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-indigo-900/40 space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400">
                  Dream Memory Source
                </span>
                <h4 className="text-xs font-bold text-white">{illustratingEntry.title}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2">
                  {illustratingEntry.content}
                </p>
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Choose Illustration Art Style
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {DREAM_ART_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        disabled={isGeneratingArt}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? 'bg-purple-900/40 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                            : 'bg-slate-900/50 border-slate-800/80 hover:border-indigo-700/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{style.icon}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{style.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                            {style.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Synthesized Art Prompt Preview */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-900/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-amber-300" />
                    AI Image Generation Prompt
                  </span>
                  <span className="text-[10px] text-slate-400">Model: Gemini Vision Pro</span>
                </div>
                <p className="text-[11px] text-indigo-200/90 font-mono bg-black/40 p-2.5 rounded-xl border border-indigo-900/40 leading-relaxed break-words">
                  {buildDreamIllustrationPrompt(illustratingEntry, selectedStyle)}
                </p>
              </div>

              {/* Live Generation Progress Area */}
              {isGeneratingArt && (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-950/60 to-indigo-950/60 border border-purple-500/40 space-y-3 text-center animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 text-amber-300 animate-spin" />
                    <span className="text-xs font-bold text-white">
                      Painting Your Dreamscape...
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-purple-500/30">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-purple-400 to-indigo-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${artProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-purple-200 font-medium">
                    {artProgressStep} ({artProgressPercent}%)
                  </p>
                </div>
              )}

              {/* Preview if already created / updated */}
              {!isGeneratingArt && previewIllustration && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Generated Illustration Ready
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-purple-500/40 shadow-xl max-h-56">
                    <img
                      src={previewIllustration.url}
                      alt={illustratingEntry.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {previewIllustration.styleLabel}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {previewIllustration.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Studio Footer */}
            <div className="p-4 border-t border-indigo-900/40 bg-slate-950/80 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={isGeneratingArt}
                onClick={() => setIllustratingEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Done
              </button>

              <button
                type="button"
                disabled={isGeneratingArt}
                onClick={handleTriggerGenerate}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-600 hover:from-amber-300 hover:via-purple-400 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-102 active:scale-98 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isGeneratingArt ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Painting Artwork...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>
                      {previewIllustration ? 'Re-paint Artwork' : 'Generate Dream Illustration'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Artwork Lightbox Modal */}
      {lightboxEntry && lightboxEntry.illustration && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#0a0820] border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-indigo-900/40 flex items-center justify-between bg-black/40">
              <div>
                <h3 className="text-base font-bold text-white font-playfair">
                  {lightboxEntry.title}
                </h3>
                <span className="text-[11px] text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {lightboxEntry.illustration.styleLabel} • Dream Illustration
                </span>
              </div>
              <button
                onClick={() => setLightboxEntry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl bg-black max-h-[50vh] flex items-center justify-center">
                <img
                  src={lightboxEntry.illustration.url}
                  alt={lightboxEntry.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-indigo-900/40 space-y-2">
                <span className="text-[10px] uppercase font-bold text-purple-400">
                  Dream Memory
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {lightboxEntry.content}
                </p>
                <div className="pt-2 border-t border-indigo-950 text-[11px] text-slate-400 italic">
                  &ldquo;{lightboxEntry.illustration.prompt}&rdquo;
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-indigo-900/40 bg-slate-950/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const target = lightboxEntry;
                  setLightboxEntry(null);
                  handleOpenArtStudio(target);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-700/40 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                <span>Change Style / Re-paint</span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxEntry(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

