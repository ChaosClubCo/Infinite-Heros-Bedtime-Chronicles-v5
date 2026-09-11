import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Heart,
  RotateCw,
  Wind,
  Moon,
  Sparkle,
  Star,
  Users,
  Compass,
  Check,
} from 'lucide-react';
import {
  BedtimeAffirmation,
  ProfileAffirmationResult,
  getDailyAffirmationForProfile,
  getCuratedAffirmationsForProfile,
  formatAffirmationPhrase,
  AffirmationTheme,
} from '../data/bedtimeAffirmations';
import { ChildProfile } from '../types';
import { getAvatarById } from '../data/avatars';

interface DailyAffirmationWidgetProps {
  childName?: string;
  childAge?: number;
  childAvatar?: string;
  storyPreference?: string;
  gentleMode?: boolean;
  activeChildProfileId?: string;
  availableProfiles?: ChildProfile[];
  onSwitchProfile?: (profileId: string) => void;
  className?: string;
  onOpenWindDown?: () => void;
  onOpenSettings?: () => void;
}

export const DailyAffirmationWidget: React.FC<DailyAffirmationWidgetProps> = ({
  childName = 'Little Explorer',
  childAge = 5,
  childAvatar = 'fox',
  storyPreference = 'Gentle Stories • Sleepy Animals',
  gentleMode = true,
  activeChildProfileId = 'profile-leo',
  availableProfiles = [],
  onSwitchProfile,
  className = '',
  onOpenWindDown,
  onOpenSettings,
}) => {
  // Current active date
  const today = useMemo(() => new Date(), []);

  // Compute profile-tailored daily affirmation
  const profileDailyData: ProfileAffirmationResult = useMemo(() => {
    return getDailyAffirmationForProfile(
      {
        id: activeChildProfileId,
        name: childName,
        age: childAge,
        avatar: childAvatar,
        storyPreference,
        gentleMode,
      },
      today
    );
  }, [activeChildProfileId, childName, childAge, childAvatar, storyPreference, gentleMode, today]);

  // Current displayed affirmation (defaults to profile-daily)
  const [currentAffirmation, setCurrentAffirmation] = useState<BedtimeAffirmation>(
    profileDailyData.affirmation
  );
  const [isCustomSpun, setIsCustomSpun] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [showPreferenceDetails, setShowPreferenceDetails] = useState(false);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showStarWishModal, setShowStarWishModal] = useState(false);
  const [wishRecorded, setWishRecorded] = useState(false);
  const [starWishText, setStarWishText] = useState('');

  // Age-adapted breathing timer: 3 seconds for younger toddlers, 4 seconds for older kids
  const breathingDuration = childAge <= 4 ? 3 : 4;
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCountdown, setBreathingCountdown] = useState(breathingDuration);

  // Sync state whenever the active profile changes
  useEffect(() => {
    setCurrentAffirmation(profileDailyData.affirmation);
    setIsCustomSpun(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [profileDailyData]);

  // Check if current affirmation is favorited in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bedtime_favorite_affirmations');
      if (saved) {
        const favIds: string[] = JSON.parse(saved);
        setIsFavorited(favIds.includes(currentAffirmation.id));
      } else {
        setIsFavorited(false);
      }
    } catch {
      setIsFavorited(false);
    }
  }, [currentAffirmation.id]);

  // Breathing exercise interval
  useEffect(() => {
    if (!showBreathingGuide) return;

    setBreathingCountdown(breathingDuration);
    setBreathingPhase('inhale');

    const interval = setInterval(() => {
      setBreathingCountdown((prev) => {
        if (prev <= 1) {
          setBreathingPhase((currPhase) => {
            if (currPhase === 'inhale') return 'hold';
            if (currPhase === 'hold') return 'exhale';
            return 'inhale';
          });
          return breathingDuration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showBreathingGuide, breathingDuration]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleFavorite = () => {
    try {
      const saved = localStorage.getItem('bedtime_favorite_affirmations');
      let favIds: string[] = saved ? JSON.parse(saved) : [];
      if (isFavorited) {
        favIds = favIds.filter((id) => id !== currentAffirmation.id);
        setIsFavorited(false);
      } else {
        favIds.push(currentAffirmation.id);
        setIsFavorited(true);
      }
      localStorage.setItem('bedtime_favorite_affirmations', JSON.stringify(favIds));
    } catch (e) {
      console.error('Failed to update favorite affirmations:', e);
      setIsFavorited(!isFavorited);
    }
  };

  const handleSpinAnother = () => {
    const curatedPool = getCuratedAffirmationsForProfile({
      id: activeChildProfileId,
      name: childName,
      age: childAge,
      avatar: childAvatar,
      storyPreference,
      gentleMode,
    });
    const remaining = curatedPool.filter((a) => a.id !== currentAffirmation.id);
    if (remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      setCurrentAffirmation(remaining[randomIndex]);
      setIsCustomSpun(true);
    }
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleResetToDaily = () => {
    setCurrentAffirmation(profileDailyData.affirmation);
    setIsCustomSpun(false);
    if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSpeakAffirmation = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const formattedText = formatAffirmationPhrase(currentAffirmation.phrase, childName);
    const utteranceText = `${formattedText} ${currentAffirmation.bedtimeWhisper || ''}`;
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.rate = 0.82; // Gentle, sleepy bedtime pace
    utterance.pitch = 1.05; // Warm, soothing tone

    // Select natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const gentleVoice = voices.find(
      (v) =>
        (v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Samantha') ||
            v.name.includes('Google') ||
            v.name.includes('Karen') ||
            v.name.includes('Victoria'))) ||
        v.lang === 'en-US'
    );
    if (gentleVoice) {
      utterance.voice = gentleVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleRecordWish = () => {
    if (!starWishText.trim()) return;
    setWishRecorded(true);
    setTimeout(() => {
      setWishRecorded(false);
      setShowStarWishModal(false);
      setStarWishText('');
    }, 2000);
  };

  const dayOfWeek = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(today);
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(today);

  const themeTagDetails: Record<
    AffirmationTheme,
    { label: string; bg: string; text: string; border: string; icon: string }
  > = {
    peace: { label: 'Inner Calm', bg: 'bg-indigo-950/80', text: 'text-indigo-300', border: 'border-indigo-500/40', icon: '🌙' },
    love: { label: 'Safe & Cherished', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-500/40', icon: '💖' },
    wonder: { label: 'Starlight Wonder', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500/40', icon: '✨' },
    courage: { label: 'Gentle Bravery', bg: 'bg-cyan-950/80', text: 'text-cyan-300', border: 'border-cyan-500/40', icon: '🛡️' },
    kindness: { label: 'Warm Heart', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/40', icon: '🌱' },
    coziness: { label: 'Cozy Den', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-500/40', icon: '🧸' },
    nature: { label: 'Night Forest', bg: 'bg-teal-950/80', text: 'text-teal-300', border: 'border-teal-500/40', icon: '🌲' },
  };

  const currentTag = themeTagDetails[currentAffirmation.theme] || themeTagDetails.peace;
  const companionAvatar = getAvatarById(childAvatar);

  return (
    <section
      id="daily-bedtime-affirmation-widget"
      aria-label="Bedtime Affirmation of the Day"
      className={`relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#120d2a] via-[#0d0922] to-[#180f33] border border-indigo-900/60 shadow-xl backdrop-blur-xl transition-all ${className}`}
    >
      {/* Whimsical Cosmic Ambient Aura */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-purple-600/10 blur-3xl pointer-events-none -ml-12 -mb-12" />

      {/* Decorative Star Dust Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 space-y-4">
        {/* TOP HEADER: Child Profile Anchor + Date + Preference Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-950/80">
          <div className="flex items-center gap-3">
            {/* Child Companion Avatar Badge */}
            <div className="relative group">
              <div
                className={`w-10 h-10 rounded-2xl ${companionAvatar.iconBg} border ${companionAvatar.borderColor} flex items-center justify-center text-xl shadow-md transition-transform group-hover:scale-105`}
              >
                <span>{companionAvatar.emoji}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-950 border border-amber-400/60 flex items-center justify-center text-[9px] text-amber-300">
                ✨
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-playfair font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>{childName}&apos;s Affirmation of the Day</span>
                </h3>

                {/* Preference / Theme Tag */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold flex items-center gap-1 ${currentTag.bg} ${currentTag.text} border ${currentTag.border}`}
                >
                  <span>{currentTag.icon}</span>
                  <span>{currentTag.label}</span>
                </span>

                {/* Age & Preference alignment pill */}
                <button
                  type="button"
                  onClick={() => setShowPreferenceDetails(!showPreferenceDetails)}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700/60 flex items-center gap-1 transition-colors"
                  title="Click to view personalized preference details"
                >
                  <Compass className="w-3 h-3 text-amber-400" />
                  <span>Age {childAge} • {profileDailyData.preferenceLabel}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-400 font-light">
                  {isCustomSpun
                    ? '✨ Explored from your curated bedtime constellation'
                    : `${dayOfWeek} • ${monthDay} Starlight`}
                </p>

                {availableProfiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline underline-offset-2 flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    <span>Switch Child ({availableProfiles.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            {/* Listen Aloud Button */}
            <button
              type="button"
              id="affirmation-speak-btn"
              onClick={handleSpeakAffirmation}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 ring-2 ring-amber-300'
                  : 'bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-800/60 text-slate-200 hover:text-white'
              }`}
              title={isSpeaking ? 'Stop speaking' : `Listen to ${childName}'s bedtime affirmation`}
              aria-label={isSpeaking ? 'Stop speaking' : `Listen to ${childName}'s bedtime affirmation`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Listen</span>
                </>
              )}
            </button>

            {/* Star Breath Toggle */}
            <button
              type="button"
              id="affirmation-breath-btn"
              onClick={() => setShowBreathingGuide(!showBreathingGuide)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition-all ${
                showBreathingGuide
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'bg-indigo-950/60 hover:bg-indigo-900 border-indigo-900/80 text-slate-300 hover:text-white'
              }`}
              title="Take a starry bedtime breath"
              aria-label="Toggle starry breath exercise"
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Star Breath</span>
            </button>

            {/* Star Wish Micro-Action */}
            <button
              type="button"
              id="affirmation-wish-btn"
              onClick={() => setShowStarWishModal(!showStarWishModal)}
              className="p-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-900/80 text-amber-300 hover:text-amber-200 transition-colors"
              title="Make a bedtime star wish"
              aria-label="Make a bedtime star wish"
            >
              <Star className="w-4 h-4 fill-amber-400/30" />
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              id="affirmation-favorite-btn"
              onClick={handleToggleFavorite}
              className={`p-1.5 rounded-xl border transition-all ${
                isFavorited
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm shadow-rose-500/20'
                  : 'bg-indigo-950/60 hover:bg-indigo-900 border-indigo-900/80 text-slate-400 hover:text-white'
              }`}
              title={isFavorited ? 'Saved in bedtime memories' : 'Save to favorite affirmations'}
              aria-label={isFavorited ? 'Saved in bedtime memories' : 'Save to favorite affirmations'}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-400' : ''}`} />
            </button>

            {/* Spin / Next Curated Affirmation for this profile */}
            <button
              type="button"
              id="affirmation-spin-btn"
              onClick={handleSpinAnother}
              className="p-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-900/80 text-slate-300 hover:text-amber-300 transition-colors"
              title={`Explore another affirmation curated for ${childName}`}
              aria-label={`Explore another affirmation curated for ${childName}`}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHILD PROFILE SWITCHER ACCORDION */}
        <AnimatePresence>
          {showProfileSwitcher && availableProfiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Select Child Profile for Today&apos;s Affirmation:</span>
                  <button
                    type="button"
                    onClick={() => setShowProfileSwitcher(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableProfiles.map((p) => {
                    const isSelected = p.id === activeChildProfileId || p.name === childName;
                    const pAvatar = getAvatarById(p.avatar);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (onSwitchProfile) onSwitchProfile(p.id);
                          setShowProfileSwitcher(false);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-950/90 border-amber-400/70 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-800 hover:border-indigo-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{pAvatar.emoji}</span>
                          <div className="text-left">
                            <div className="text-xs font-bold">{p.name} (Age {p.age})</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[170px]">
                              {p.storyPreference}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PREFERENCE DETAILS DRAWER */}
        <AnimatePresence>
          {showPreferenceDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-800/50 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How this affirmation was chosen:</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed text-[11px]">
                    {profileDailyData.matchReason}.
                  </p>
                  <p className="text-slate-400 text-[10px]">
                    Preferences: <strong>{storyPreference}</strong> • Avatar: <strong>{companionAvatar.name}</strong> • Gentle Cadence: <strong>{gentleMode ? 'Active' : 'Standard'}</strong>
                  </p>
                </div>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-indigo-700/60 text-slate-200 hover:text-white text-[11px] shrink-0"
                  >
                    Adjust Profile
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN AFFIRMATION DISPLAY */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAffirmation.id + childName}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`py-3.5 px-4 sm:px-6 rounded-2xl bg-gradient-to-r ${
              currentAffirmation.color || 'from-indigo-950/50 via-purple-950/30 to-slate-950/40'
            } border border-indigo-900/40 shadow-inner`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-serif text-amber-400/40 select-none leading-none pt-1">
                &ldquo;
              </span>
              <div className="flex-1 space-y-2.5">
                {/* Personalized Hero Phrase */}
                <p className="text-lg sm:text-2xl font-playfair font-medium text-slate-100 leading-relaxed tracking-wide">
                  {formatAffirmationPhrase(currentAffirmation.phrase, childName)}
                </p>

                {/* Bedtime Whisper & Breath Guidance */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 pt-1 text-xs">
                  {currentAffirmation.breathGuidance && (
                    <div className="flex items-center gap-1.5 text-indigo-200/90 font-light italic">
                      <Sparkle className="w-3 h-3 text-amber-300 shrink-0" />
                      <span>{currentAffirmation.breathGuidance}</span>
                    </div>
                  )}

                  {currentAffirmation.bedtimeWhisper && (
                    <div className="flex items-center gap-1.5 text-amber-200/90 font-light">
                      <Moon className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Whisper: &ldquo;{currentAffirmation.bedtimeWhisper}&rdquo;</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-3xl sm:text-4xl font-serif text-amber-400/40 select-none leading-none self-end pb-1">
                &rdquo;
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* STAR WISH MINI MODAL / EXPANSION */}
        <AnimatePresence>
          {showStarWishModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-indigo-950/60 border border-amber-400/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{childName}&apos;s Bedtime Star Wish</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowStarWishModal(false)}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>

                {wishRecorded ? (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1">
                    <span className="text-xl">🌟</span>
                    <p className="text-xs font-bold text-emerald-300">
                      Your wish is sparkling among the constellations!
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Sweet dreams, {childName}. Sleep tight.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={starWishText}
                      onChange={(e) => setStarWishText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRecordWish()}
                      placeholder="Whisper a sweet bedtime wish or happy thought for tonight..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-indigo-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5 text-xs text-amber-300/80">
                        {['✨ Sweet Dreams', '🚀 Star Adventure', '🧸 Soft Slumber'].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => setStarWishText(suggestion)}
                            className="px-2 py-0.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-[10px] text-slate-300 hover:text-amber-200 border border-indigo-900"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleRecordWish}
                        disabled={!starWishText.trim()}
                        className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all"
                      >
                        Send Wish to Stars 🌟
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAR BREATH GUIDED OVERLAY */}
        <AnimatePresence>
          {showBreathingGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-indigo-950/50 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Expanding Breathing Circle */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                    <motion.div
                      animate={{
                        scale: breathingPhase === 'inhale' ? 1.35 : breathingPhase === 'hold' ? 1.35 : 0.85,
                        opacity: breathingPhase === 'inhale' ? 0.9 : breathingPhase === 'hold' ? 1 : 0.4,
                      }}
                      transition={{ duration: breathingDuration, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-emerald-400/20 border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20"
                    />
                    <motion.div
                      animate={{
                        scale: breathingPhase === 'inhale' ? 1.15 : breathingPhase === 'hold' ? 1.15 : 0.9,
                      }}
                      transition={{ duration: breathingDuration, ease: 'easeInOut' }}
                      className="absolute w-10 h-10 rounded-full bg-teal-400/30 blur-sm"
                    />
                    <div className="relative text-center">
                      <span className="text-sm sm:text-base font-mono font-bold text-white">
                        {breathingCountdown}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5" />
                      <span>
                        {breathingPhase === 'inhale' && `Breathe In Gentle Starlight, ${childName}...`}
                        {breathingPhase === 'hold' && 'Hold Softly & Snuggle in Cozy...'}
                        {breathingPhase === 'exhale' && 'Release & Melt into Your Pillow...'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-light">
                      {childAge <= 4
                        ? 'Soft little tummy breath... in and out.'
                        : 'Feel your chest gently rise and fall as calmness fills your room.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreathingGuide(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 shrink-0"
                >
                  Done with Breath
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER: Status & Wind Down Action */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            {isCustomSpun ? (
              <button
                type="button"
                onClick={handleResetToDaily}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 flex items-center gap-1"
              >
                <span>Back to {childName}&apos;s Daily Starlight Thought</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Rotates each sunset tailored to {childName}&apos;s dream preferences
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {onOpenWindDown && (
              <button
                type="button"
                onClick={onOpenWindDown}
                className="text-[11px] text-indigo-300 hover:text-white font-medium flex items-center gap-1 transition-colors"
              >
                <Moon className="w-3 h-3 text-amber-400" />
                <span>Evening Routine</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
