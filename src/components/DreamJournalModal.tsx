import React, { useState } from 'react';
import { DreamJournalEntry } from '../types';
import { Moon, Star, Plus, Trash2, Calendar, X } from 'lucide-react';

interface DreamJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DreamJournalEntry[];
  onSaveEntry: (entry: DreamJournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  childName: string;
}

export const DreamJournalModal: React.FC<DreamJournalModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
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

  const moods: { id: DreamJournalEntry['mood']; label: string; icon: string }[] = [
    { id: 'peaceful', label: 'Peaceful', icon: '🌙' },
    { id: 'magical', label: 'Magical', icon: '✨' },
    { id: 'adventurous', label: 'Adventurous', icon: '🚀' },
    { id: 'cozy', label: 'Cozy', icon: '🧸' },
    { id: 'funny', label: 'Funny', icon: '😄' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#090a1a] border border-indigo-900/60 shadow-2xl shadow-indigo-950/80 overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-indigo-900/40 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-playfair text-white tracking-wide">
                Dream Journal
              </h2>
              <p className="text-xs text-indigo-300/80">
                {childName}&apos;s Morning Reflections & Starlight Memories
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isCreating ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Recorded Dreams ({entries.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write New Dream</span>
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-indigo-900/30">
                  <Moon className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-200">No dreams recorded yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
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
                <div className="grid gap-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 rounded-2xl bg-slate-900/60 border border-indigo-950 hover:border-indigo-800/60 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base" title={entry.mood}>
                              {moods.find((m) => m.id === entry.mood)?.icon || '✨'}
                            </span>
                            <h4 className="text-sm font-bold text-white">{entry.title}</h4>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {entry.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(entry.sleepRating)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                          <button
                            onClick={() => onDeleteEntry(entry.id)}
                            className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{entry.content}</p>

                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 text-[10px] font-medium border border-indigo-900/60"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
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
    </div>
  );
};
