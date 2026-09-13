import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, ChildProfile } from '../types';
import { INITIAL_CHILD_PROFILES, VOICE_PROFILES } from '../data/dreamThemes';
import { CHILD_AVATARS, getAvatarById } from '../data/avatars';
import {
  ShieldCheck,
  Users,
  Mic,
  Volume2,
  Sparkles,
  Edit3,
  Plus,
  Share2,
  Link as LinkIcon,
  UserPlus,
  RefreshCw,
  CreditCard,
  Lock,
  Check,
  X,
  Clock,
  ChevronRight,
  Moon,
  Sun,
  Eye,
  Sunset,
  Flame,
  Sliders,
} from 'lucide-react';

interface SafetyPersonalizationViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SafetyPersonalizationView: React.FC<SafetyPersonalizationViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  // Profiles state
  const [profiles, setProfiles] = useState<ChildProfile[]>(
    settings.childProfiles && settings.childProfiles.length > 0
      ? settings.childProfiles
      : INITIAL_CHILD_PROFILES
  );
  const [activeProfileId, setActiveProfileId] = useState<string>(
    settings.activeChildProfileId || profiles[0].id
  );

  // Voice synthesis state
  const [activeVoiceId, setActiveVoiceId] = useState<string>(
    settings.activeVoiceId || 'voice-moms-voice'
  );
  const [showManageVoiceModal, setShowManageVoiceModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ChildProfile | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<'privacy' | 'terms' | 'guide' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings values with fallbacks
  const [ageFiltering, setAgeFiltering] = useState<boolean>(
    settings.ageFilteringEnabled !== undefined ? settings.ageFilteringEnabled : true
  );
  const [sillyMode, setSillyMode] = useState<boolean>(
    settings.madlibSillyMode !== undefined ? settings.madlibSillyMode : false
  );
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(
    settings.sleepTimerMinutes || 45
  );
  const [volumeNormalization, setVolumeNormalization] = useState<boolean>(
    settings.volumeNormalization !== undefined ? settings.volumeNormalization : true
  );
  const [autoFadeToAmbient, setAutoFadeToAmbient] = useState<boolean>(
    settings.autoFadeToAmbient !== undefined ? settings.autoFadeToAmbient : true
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Sync back to master settings
  const persistSettings = (partial: Partial<AppSettings>) => {
    const updated: AppSettings = {
      ...settings,
      ageFilteringEnabled: ageFiltering,
      madlibSillyMode: sillyMode,
      sleepTimerMinutes: sleepTimerMinutes,
      volumeNormalization: volumeNormalization,
      autoFadeToAmbient: autoFadeToAmbient,
      activeVoiceId: activeVoiceId,
      activeChildProfileId: activeProfileId,
      childProfiles: profiles,
      ...partial,
    };
    onSaveSettings(updated);
  };

  const handleSelectProfile = (profile: ChildProfile) => {
    setActiveProfileId(profile.id);
    persistSettings({
      activeChildProfileId: profile.id,
      childName: profile.name,
      childAge: profile.age,
      childAvatar: profile.avatar,
    });
    showToast(`Switched active profile to ${profile.name}`);
  };

  const handleSaveChildProfile = (profile: ChildProfile) => {
    let updatedProfiles: ChildProfile[];
    const exists = profiles.some((p) => p.id === profile.id);
    if (exists) {
      updatedProfiles = profiles.map((p) => (p.id === profile.id ? profile : p));
    } else {
      updatedProfiles = [...profiles, profile];
    }
    setProfiles(updatedProfiles);
    setEditingProfile(null);
    setShowAddProfileModal(false);

    if (profile.id === activeProfileId || !exists) {
      setActiveProfileId(profile.id);
      persistSettings({
        childProfiles: updatedProfiles,
        activeChildProfileId: profile.id,
        childName: profile.name,
        childAge: profile.age,
        childAvatar: profile.avatar,
      });
    } else {
      persistSettings({ childProfiles: updatedProfiles });
    }
    showToast(`Profile for ${profile.name} saved safely`);
  };

  const activeVoice =
    VOICE_PROFILES.find((v) => v.id === activeVoiceId) || VOICE_PROFILES[0];

  return (
    <div className="relative pb-16 space-y-8 animate-fade-in text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-950/90 border border-amber-400/60 text-amber-300 text-xs font-bold shadow-2xl backdrop-blur-xl"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen 1 Header */}
      <header className="max-w-4xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Parental Dashboard & Safety Controls</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-playfair font-bold text-white tracking-tight">
          Safety &amp; Personalization
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-2xl">
          Tailor the Starlight Tales experience for your family&apos;s unique bedtime routines.
        </p>
      </header>

      {/* 2-Column Responsive Layout (As in provided HTML Screen 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Profiles & Voice Synthesis (7 Columns) */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          
          {/* Section 1: Child Profiles */}
          <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-playfair font-bold text-amber-300">Child Profiles</h2>
              </div>
              <button
                type="button"
                id="add-child-profile-btn"
                onClick={() => setShowAddProfileModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Child</span>
              </button>
            </div>

            <div className="space-y-3">
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId;
                const avatar = getAvatarById(profile.avatar);

                return (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/80 border-amber-400 shadow-lg shadow-amber-400/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-2xl shadow-sm">
                        {avatar.emoji || '🦊'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base">{profile.name}</h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          Age: {profile.age} yrs &bull; {profile.storyPreference}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProfile(profile);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                      title={`Edit ${profile.name}'s profile`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Voice Synthesis */}
          <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-playfair font-bold text-amber-300">Voice Synthesis</h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Create a personalized voice profile so stories are read in your reassuring tone.
                </p>
              </div>
              <Mic className="w-5 h-5 text-amber-400" />
            </div>

            {/* Active Voice Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400">
                    Active Voice Profile
                  </div>
                  <div className="font-bold text-white text-sm sm:text-base">
                    {activeVoice.name}
                  </div>
                  <div className="text-[11px] text-indigo-300 font-medium">
                    {activeVoice.role}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManageVoiceModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-bold border border-amber-400/40 transition-colors"
              >
                Manage
              </button>
            </div>

            {/* Share Profile Actions */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Share Voice &amp; Routine Profile</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Magic link copied securely to clipboard!')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Magic Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('Co-Parent invitation link generated')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invite Co-Parent</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('Synced seamlessly across family devices')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sync Devices</span>
                </button>
              </div>
            </div>

            {/* Trusted Listeners Avatar Row */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Trusted Listeners
              </h4>
              <div className="flex items-center gap-2">
                {profiles.map((p) => {
                  const avatar = getAvatarById(p.avatar);
                  return (
                    <div
                      key={p.id}
                      className="w-9 h-9 rounded-full border-2 border-indigo-500/40 bg-slate-950 flex items-center justify-center text-lg shadow"
                      title={`${p.name} (${p.age} yrs)`}
                    >
                      {avatar.emoji}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(true)}
                  className="w-9 h-9 rounded-full border-2 border-dashed border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300 flex items-center justify-center transition-colors"
                  title="Add trusted listener"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Controls, Playback & Accounts (5 Columns) */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8">
          
          {/* Section 3: Content & Filters */}
          <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-5">
            <h2 className="text-xl font-playfair font-bold text-purple-300 border-b border-slate-800 pb-3">
              Content &amp; Filters
            </h2>

            <ul className="space-y-5">
              {/* Age-Appropriate Filtering Toggle */}
              <li className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Age-Appropriate Filtering</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Automatically restrict vocabulary and themes based on child&apos;s age profile.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ageFiltering}
                  onClick={() => {
                    const next = !ageFiltering;
                    setAgeFiltering(next);
                    persistSettings({ ageFilteringEnabled: next });
                    showToast(next ? 'Age filtering enabled' : 'Age filtering relaxed');
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    ageFiltering ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      ageFiltering ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </li>

              {/* Madlib Silly Mode Toggle */}
              <li className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Madlib &apos;Silly Mode&apos;</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Allow wacky, nonsensical word suggestions in interactive stories.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sillyMode}
                  onClick={() => {
                    const next = !sillyMode;
                    setSillyMode(next);
                    persistSettings({ madlibSillyMode: next });
                    showToast(next ? 'Silly Mode active!' : 'Calm Madlib Mode restored');
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    sillyMode ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      sillyMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </li>
            </ul>
          </section>

          {/* Section 4: Playback Defaults */}
          <section className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl space-y-5">
            <h2 className="text-xl font-playfair font-bold text-indigo-300 border-b border-slate-800 pb-3">
              Playback Defaults
            </h2>

            <div className="space-y-5">
              {/* Default Sleep Timer Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Default Sleep Timer</span>
                  </label>
                  <span className="font-mono text-amber-300 font-bold">{sleepTimerMinutes} mins</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={sleepTimerMinutes}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSleepTimerMinutes(val);
                    persistSettings({ sleepTimerMinutes: val });
                  }}
                  className="w-full h-2 rounded-lg bg-slate-950 accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>15m (Short)</span>
                  <span>45m (Standard)</span>
                  <span>120m (Long)</span>
                </div>
              </div>

              {/* Volume Normalization */}
              <div className="flex items-start justify-between gap-4 pt-1">
                <div>
                  <h4 className="font-bold text-white text-sm">Volume Normalization</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Prevent sudden loud noises during voice or scene transitions.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={volumeNormalization}
                  onClick={() => {
                    const next = !volumeNormalization;
                    setVolumeNormalization(next);
                    persistSettings({ volumeNormalization: next });
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    volumeNormalization ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      volumeNormalization ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-fade to Ambient */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Auto-fade to Ambient</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Gradually transition to rain/white noise when bedtime story finishes.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoFadeToAmbient}
                  onClick={() => {
                    const next = !autoFadeToAmbient;
                    setAutoFadeToAmbient(next);
                    persistSettings({ autoFadeToAmbient: next });
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                    autoFadeToAmbient ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${
                      autoFadeToAmbient ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Account & Sub */}
          <section className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800/90 shadow-xl backdrop-blur-xl divide-y divide-slate-800/80">
            <button
              type="button"
              onClick={() => setShowSubscriptionModal(true)}
              className="w-full flex items-center justify-between py-3 px-2 text-left text-slate-300 hover:text-white transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm block">Subscription Management</span>
                  <span className="text-[11px] text-slate-400">Family Pass &bull; Active</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="w-full flex items-center justify-between py-3 px-2 text-left text-slate-300 hover:text-white transition-colors group pt-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs sm:text-sm block">Account Security &amp; PIN</span>
                  <span className="text-[11px] text-slate-400">Parental Gate Protection</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>
        </div>
      </div>

      {/* Screen 1 Footer Links */}
      <footer className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div>&copy; 2026 Starlight Tales &bull; Infinite Heroes Bedtime Chronicles</div>
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setShowPolicyModal('guide')}
            className="hover:text-amber-300 transition-colors"
          >
            Parent Guide
          </button>
          <button
            type="button"
            onClick={() => setShowPolicyModal('privacy')}
            className="hover:text-amber-300 transition-colors"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setShowPolicyModal('terms')}
            className="hover:text-amber-300 transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </footer>

      {/* Manage Voice Modal */}
      <AnimatePresence>
        {showManageVoiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <Mic className="w-5 h-5" />
                  <h3 className="font-bold text-base">Select &amp; Synthesize Voice</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageVoiceModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {VOICE_PROFILES.map((voice) => {
                  const isSelected = voice.id === activeVoiceId;
                  return (
                    <div
                      key={voice.id}
                      onClick={() => {
                        setActiveVoiceId(voice.id);
                        persistSettings({ activeVoiceId: voice.id });
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/80 border-amber-400 shadow-md shadow-amber-400/10'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-white text-sm">{voice.name}</div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="text-[11px] text-amber-300/90 mb-1">{voice.role}</div>
                      <div className="text-xs text-slate-300 font-light">{voice.description}</div>
                      {voice.samplePhrase && (
                        <div className="mt-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] italic text-indigo-200">
                          &ldquo;{voice.samplePhrase}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowManageVoiceModal(false);
                  showToast('Voice configuration applied');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                Confirm Voice Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Child Profile Modal */}
      <AnimatePresence>
        {(showAddProfileModal || editingProfile) && (
          <ChildProfileEditorModal
            initialProfile={editingProfile}
            onClose={() => {
              setShowAddProfileModal(false);
              setEditingProfile(null);
            }}
            onSave={handleSaveChildProfile}
          />
        )}
      </AnimatePresence>

      {/* Subscription Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-playfair font-bold text-white">Starlight Tales Family Pass</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Unlimited AI bedtime stories, 10 immersive dream themes, and offline soothing ambient soundscapes.
              </p>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <Check className="w-4 h-4" />
                  <span>Active Plan: Family Lifetime Bedtime Edition</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Unlimited Child Profiles &amp; Dream Journal entries</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>High-fidelity voice synthesis &amp; ambient visualizers</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security & PIN Modal */}
      <AnimatePresence>
        {showSecurityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span>Parental Lock &amp; Security</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>Parental Gate PIN protects settings and voice configuration from unintended adjustments.</p>
                <div>
                  <label className="block text-slate-200 font-bold mb-1">Current Parent PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    defaultValue="1234"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center text-lg tracking-widest font-mono text-white"
                  />
                </div>
                <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                  COPPA &amp; GDPR-K Certified: No personal voice audio or child identifying metadata leaves your family cloud boundary without authorization.
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSecurityModal(false);
                  showToast('Security preferences updated');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                Save Security Settings
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Policy Drawer / Modal */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-lg w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white capitalize">
                  {showPolicyModal === 'guide'
                    ? 'Parent & Bedtime Routine Guide'
                    : showPolicyModal === 'privacy'
                    ? 'Privacy & Child Safety Policy'
                    : 'Terms of Service'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2.5 leading-relaxed max-h-72 overflow-y-auto pr-1">
                {showPolicyModal === 'guide' ? (
                  <>
                    <p className="font-bold text-amber-300">Creating a Soothing Bedtime Routine:</p>
                    <p>1. Start 20-30 minutes before lights out with a gentle story in Dream Themes.</p>
                    <p>2. Keep the ambient sound running after narration ends with auto-fade.</p>
                    <p>3. Encourage your child to share one peaceful thought for their Dream Journal.</p>
                  </>
                ) : showPolicyModal === 'privacy' ? (
                  <>
                    <p className="font-bold text-amber-300">Child Safety First (COPPA &amp; GDPR-K Compliant):</p>
                    <p>We do not sell, track, or share children&apos;s personal profiles. All generated bedtime tales pass through strict child safety filters (no scary themes, violence, or aggressive pacing).</p>
                    <p>Voice recordings are stored locally or in your private encrypted vault.</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-amber-300">Terms of Use:</p>
                    <p>Starlight Tales is designed for family bedtime relaxation and educational storytelling for children aged 3 to 10.</p>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowPolicyModal(null)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface ChildProfileEditorModalProps {
  initialProfile: ChildProfile | null;
  onClose: () => void;
  onSave: (profile: ChildProfile) => void;
}

const ChildProfileEditorModal: React.FC<ChildProfileEditorModalProps> = ({
  initialProfile,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialProfile ? initialProfile.name : '');
  const [age, setAge] = useState(initialProfile ? initialProfile.age : 5);
  const [avatar, setAvatar] = useState(initialProfile ? initialProfile.avatar : 'fox');
  const [preference, setPreference] = useState(
    initialProfile ? initialProfile.storyPreference : 'Gentle Stories • Sleepy Animals'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialProfile ? initialProfile.id : `profile-${Date.now()}`,
      name: name.trim(),
      age,
      avatar,
      storyPreference: preference,
      gentleMode: age <= 6,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white text-base">
            {initialProfile ? `Edit ${initialProfile.name}'s Profile` : 'Add New Child Profile'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-200 mb-1">Child&apos;s Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Leo or Maya"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-200 mb-1">Age</label>
              <select
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((a) => (
                  <option key={a} value={a}>{a} Years Old</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-200 mb-1">Story Focus</label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
              >
                <option value="Gentle Stories • Sleepy Animals">Gentle Stories</option>
                <option value="Adventure Tales • Star Constellations">Adventure Tales</option>
                <option value="Nature & Forest Friends">Nature Friends</option>
                <option value="Deep Sleep Affirmations">Deep Sleep</option>
              </select>
            </div>
          </div>

          {/* Avatar Choices */}
          <div>
            <label className="block font-bold text-slate-200 mb-1.5">Choose Bedtime Companion Avatar</label>
            <div className="grid grid-cols-4 gap-2">
              {CHILD_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatar(av.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    avatar === av.id
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 scale-105'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-[10px] font-semibold truncate w-full text-center">{av.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold"
            >
              Save Profile
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
