import React, { useState } from 'react';
import { AppSettings } from '../types';
import { CHILD_AVATARS, getAvatarById } from '../data/avatars';
import {
  Moon,
  Volume2,
  User,
  X,
  Sparkles,
  Check,
} from 'lucide-react';

interface SleepSetupModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SleepSetupModal: React.FC<SleepSetupModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [formData, setFormData] = useState<AppSettings>({
    ...settings,
    childAvatar: settings.childAvatar || 'fox',
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const activeAvatar = getAvatarById(formData.childAvatar);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="max-w-lg w-full p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Bedtime Routine & Profile Setup</h3>
              <p className="text-xs text-slate-400">Personalize your child&apos;s bedtime experience</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1 custom-scrollbar">
          
          {/* Child Avatar Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-indigo-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Child&apos;s Bedtime Avatar
              </label>
              <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1">
                <span>Selected:</span>
                <span className="text-amber-300 font-semibold">{activeAvatar.name}</span>
              </span>
            </div>

            {/* Avatar Selection Grid */}
            <div className="grid grid-cols-4 gap-2">
              {CHILD_AVATARS.map((avatar) => {
                const isSelected = formData.childAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    id={`avatar-option-${avatar.id}`}
                    onClick={() => setFormData({ ...formData, childAvatar: avatar.id })}
                    className={`relative p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-indigo-950/90 border-amber-400 text-white shadow-md shadow-amber-400/10 scale-[1.03]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                    title={`${avatar.name}: ${avatar.description}`}
                  >
                    <span className="text-2xl sm:text-3xl filter drop-shadow-sm">{avatar.emoji}</span>
                    <span className="text-[10px] font-semibold truncate w-full text-center leading-tight">
                      {avatar.name}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Avatar Preview Chip */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-xl">{activeAvatar.emoji}</span>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-200">
                  {formData.childName || 'Little Explorer'} &bull; {activeAvatar.name}
                </div>
                <div className="text-[10px] text-slate-400">{activeAvatar.description}</div>
              </div>
            </div>
          </div>

          {/* Child Name & Age */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Child&apos;s Name
              </label>
              <input
                type="text"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-400 font-medium"
                placeholder="e.g. Leo"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Child&apos;s Age</label>
              <select
                value={formData.childAge}
                onChange={(e) => setFormData({ ...formData, childAge: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-400 font-medium"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((age) => (
                  <option key={age} value={age}>{age} Years Old</option>
                ))}
              </select>
            </div>
          </div>

          {/* Narration Pace & Voice */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              Default Narration Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'gentle', label: '0.75x Gentle (Sleepy)' },
                { id: 'medium', label: '0.9x Calm (Bedtime)' },
                { id: 'normal', label: '1.0x Normal (Daytime)' },
              ].map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, readingSpeed: sp.id as any })}
                  className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                    formData.readingSpeed === sp.id
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ambient Sound Default */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">Ambient Sleep Soundscape</label>
            <select
              value={formData.ambientSound}
              onChange={(e) => setFormData({ ...formData, ambientSound: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-400"
            >
              <option value="none">Off (Quiet night)</option>
              <option value="ocean">Ocean Waves (Calming tide)</option>
              <option value="rain">Gentle Rain (Tapping on glass)</option>
              <option value="wind">Night Breeze (Soft trees)</option>
              <option value="fire">Cozy Hearth (Warm crackle)</option>
              <option value="train">Night Train (Rhythmic chug)</option>
            </select>
          </div>

          {/* Auto-Advance Toggle */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-200">Auto-Advance Scenes</div>
              <div className="text-[11px] text-slate-400">Automatically proceed to next scene after narration</div>
            </div>
            <input
              type="checkbox"
              checked={formData.autoAdvance}
              onChange={(e) => setFormData({ ...formData, autoAdvance: e.target.checked })}
              className="w-5 h-5 accent-indigo-500 rounded"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-profile-settings-btn"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              {isSavedNotice ? 'Saved!' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

