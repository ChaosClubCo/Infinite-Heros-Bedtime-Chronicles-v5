import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  Moon,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Wind,
  BookOpen,
  Sliders,
  Tv,
  Waves,
  Smile,
  Flame,
  Check,
  Info,
  CalendarDays,
} from 'lucide-react';
import {
  AGE_BEDTIME_GUIDES,
  getGuideForAge,
  getCurrentDateContext,
  AgeBedtimeGuide,
} from '../data/bedtimeTipsData';
import { ChildProfile } from '../types';

interface BedtimeTipsOverlayProps {
  childName?: string;
  childAge?: number;
  activeProfile?: ChildProfile | null;
  allProfiles?: ChildProfile[];
  onSelectProfile?: (profile: ChildProfile) => void;
  onApplyRecommendedSettings?: (recommended: {
    sleepTimerMinutes: number;
    ageFilteringEnabled: boolean;
  }) => void;
  onClose: () => void;
}

export const BedtimeTipsOverlay: React.FC<BedtimeTipsOverlayProps> = ({
  childName = 'Your Child',
  childAge = 5,
  activeProfile,
  allProfiles = [],
  onSelectProfile,
  onApplyRecommendedSettings,
  onClose,
}) => {
  const [selectedAge, setSelectedAge] = useState<number>(childAge);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'seasonal' | 'appSettings'>('overview');
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  const dateContext = useMemo(() => getCurrentDateContext(), []);
  const guide: AgeBedtimeGuide = useMemo(() => getGuideForAge(selectedAge), [selectedAge]);

  const handleApplySettings = () => {
    if (onApplyRecommendedSettings) {
      onApplyRecommendedSettings({
        sleepTimerMinutes: guide.starlightTalesAdvice.recommendedTimerMins,
        ageFilteringEnabled: selectedAge <= 8,
      });
      setAppliedNotice(`Applied ${guide.starlightTalesAdvice.recommendedTimerMins}m sleep timer & age filter`);
      setTimeout(() => setAppliedNotice(null), 3500);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return Sparkles;
      case 'Waves':
        return Waves;
      case 'Heart':
        return Heart;
      case 'Wind':
        return Wind;
      case 'BookOpen':
        return BookOpen;
      case 'Clock':
        return Clock;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Smile':
        return Smile;
      case 'Sliders':
        return Sliders;
      case 'Tv':
        return Tv;
      case 'Flame':
        return Flame;
      default:
        return Moon;
    }
  };

  return (
    <div
      id="bedtime-tips-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bedtime-tips-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-4xl rounded-3xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 text-slate-100 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Top Header Banner */}
        <div className="relative px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-800 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-purple-950/90 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
              <Moon className="w-3.5 h-3.5 fill-current" />
              <span>Evidence-Based Pediatric Bedtime Guide</span>
            </div>
            <h2 id="bedtime-tips-title" className="text-2xl sm:text-3xl font-playfair font-bold text-white tracking-tight">
              Bedtime Tips &amp; Sleep Science
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-xl leading-relaxed">
              Personalized evening routines tailored for <span className="font-semibold text-amber-300">{activeProfile?.name || childName}</span> based on child development and live calendar context.
            </p>
          </div>

          <button
            type="button"
            id="close-bedtime-tips-btn"
            onClick={onClose}
            aria-label="Close Bedtime Tips Overlay"
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Date Context Bar */}
        <div className="px-6 sm:px-8 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Formatted Date & Day */}
          <div className="flex items-center gap-2 text-indigo-200">
            <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium text-slate-200">{dateContext.formattedDate}</span>
            <span className="text-slate-500">&bull;</span>
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
              dateContext.isWeekend
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50'
            }`}>
              {dateContext.isWeekend ? 'Weekend Rhythm' : 'School Night Schedule'}
            </span>
          </div>

          {/* Season & Daylight Badge */}
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-base">{dateContext.seasonIcon}</span>
            <span className="font-medium text-amber-300">{dateContext.seasonName}</span>
          </div>
        </div>

        {/* Age Selector & Profile Switcher Strip */}
        <div className="px-6 sm:px-8 py-3.5 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Age Tier:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {AGE_BEDTIME_GUIDES.map((g) => {
                const isSelected = selectedAge >= g.minAge && selectedAge <= g.maxAge;
                return (
                  <button
                    key={g.ageRange}
                    type="button"
                    onClick={() => setSelectedAge(g.minAge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20 ring-1 ring-amber-300'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 hover:text-white'
                    }`}
                  >
                    {g.ageRange} yrs
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Profile Sync Selector if multiple profiles exist */}
          {allProfiles.length > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Child:</span>
              <div className="flex items-center gap-1">
                {allProfiles.map((p) => {
                  const isCur = p.id === activeProfile?.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (onSelectProfile) onSelectProfile(p);
                        setSelectedAge(p.age);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                        isCur
                          ? 'bg-indigo-600/50 border-indigo-400 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.name} ({p.age}y)
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Sleep Targets & Habits', icon: Moon },
            { id: 'timeline', label: 'Evening Routine Timeline', icon: Clock },
            { id: 'seasonal', label: 'Calendar & Seasonal Guidance', icon: CalendarDays },
            { id: 'appSettings', label: 'Recommended App Setup', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Overview & Habits */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Sleep Target</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">{guide.sleepHours}</div>
                  <p className="text-[11px] text-slate-400">Pediatric foundation for age {selectedAge}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Recommended Bedtime</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-amber-300">{guide.recommendedBedtime}</div>
                  <p className="text-[11px] text-slate-400">Optimal melatonin onset window</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Wind-Down Buffer</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-purple-300">{guide.windDownMinutes} minutes</div>
                  <p className="text-[11px] text-slate-400">Calm transition before lights out</p>
                </div>
              </div>

              {/* Age Summary Callout */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>Developmental Focus for {guide.label}:</span>
                </div>
                <p className="font-light text-slate-300">{guide.overview}</p>
              </div>

              {/* Recommended Habits for this Age */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>3 Evidence-Based Habits for Age {selectedAge}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {guide.recommendedHabits.map((habit, idx) => {
                    const Icon = getIconComponent(habit.iconName);
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 hover:border-indigo-500/40 transition-colors space-y-2"
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">{habit.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{habit.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Key Challenges and Solutions */}
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Common Bedtime Roadblocks for {guide.label}</span>
                </h3>
                <ul className="space-y-2">
                  {guide.keySleepChallenges.map((challenge, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: Evening Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Step-by-Step Evening Routine</span>
                  <span className="text-slate-400">Paced for optimal melatonin release and calm transitions</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-300 font-bold">
                  {guide.windDownMinutes}m Wind-Down
                </div>
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-500/30 space-y-6 py-2">
                {guide.bedtimeTimeline.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-400 flex items-center justify-center text-[10px] font-bold text-amber-300 shadow-md">
                      {idx + 1}
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 group-hover:border-indigo-500/40 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-sm">{step.step}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950/70 text-indigo-300 border border-indigo-800/40 text-[11px] font-mono font-medium">
                          {step.timeOffset}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">{step.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Seasonal & Calendar Guidance */}
          {activeTab === 'seasonal' && (
            <div className="space-y-6 animate-fade-in">
              {/* Today's Context Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/60 border border-indigo-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Calendar Context for Today ({dateContext.formattedDate})</span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-200">
                  <p className="font-medium text-white">{dateContext.dayContextTip}</p>
                  <p className="text-slate-300 font-light">{dateContext.bedtimeReadinessTip}</p>
                </div>
              </div>

              {/* Seasonal Factors */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{dateContext.seasonIcon}</span>
                  <div>
                    <h4 className="font-bold text-white text-sm">{dateContext.seasonName} Sleep Factors</h4>
                    <p className="text-xs text-slate-400">Daylight changes &amp; thermal comfort</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                  {dateContext.seasonalSleepTip}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="text-amber-300 font-bold block">Ideal Room Temperature</span>
                    <span className="text-slate-300 font-mono">65°F – 68°F (18°C – 20°C)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="text-indigo-300 font-bold block">Lighting Spectrum</span>
                    <span className="text-slate-300">Warm Amber (&lt;3000K), Zero Blue Light</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Recommended App Setup */}
          {activeTab === 'appSettings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Recommended Starlight Tales Settings for Age {selectedAge}</span>
                  </div>
                  <span className="text-xs text-amber-400 font-semibold">{guide.label}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Recommended Sleep Timer</span>
                    <div className="text-base font-bold text-white">
                      {guide.starlightTalesAdvice.recommendedTimerMins} minutes
                    </div>
                    <p className="text-[11px] text-slate-400">Allows story completion plus ambient drift-off buffer</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Narration Voice Speed</span>
                    <div className="text-base font-bold text-amber-300">
                      {guide.starlightTalesAdvice.narrationSpeed}
                    </div>
                    <p className="text-[11px] text-slate-400">Slower cadence lowers resting heart rate</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Optimal Soundscape</span>
                    <div className="text-base font-bold text-teal-300">
                      {guide.starlightTalesAdvice.soundscape}
                    </div>
                    <p className="text-[11px] text-slate-400">Continuous sound masks sudden household noises</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-xs text-slate-400 font-medium">Theme &amp; Mode Style</span>
                    <div className="text-xs font-semibold text-purple-300 leading-snug">
                      {guide.starlightTalesAdvice.modeDescription}
                    </div>
                  </div>
                </div>

                {/* Quick Apply Action Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Auto-sync settings to profile &amp; save preferences
                  </div>
                  <button
                    type="button"
                    id="apply-recommended-sleep-settings-btn"
                    onClick={handleApplySettings}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply Recommended Sleep Settings</span>
                  </button>
                </div>

                {appliedNotice && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{appliedNotice}</span>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Grounded in American Academy of Pediatrics (AAP) sleep guidelines.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
