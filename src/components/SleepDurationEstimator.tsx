import React, { useState, useMemo } from 'react';
import {
  Moon,
  Clock,
  Sunrise,
  Volume2,
  Sparkles,
  Waves,
  CloudRain,
  Wind,
  Flame,
  Train,
} from 'lucide-react';

interface SleepDurationEstimatorProps {
  storyDurationMinutes?: number;
  ambientSound?: string;
  ambientLoopMinutes?: number;
  childAge?: number;
  childName?: string;
  variant?: 'card' | 'compact' | 'hero';
  onAmbientLoopChange?: (minutes: number) => void;
  interactive?: boolean;
}

export const SleepDurationEstimator: React.FC<SleepDurationEstimatorProps> = ({
  storyDurationMinutes = 6,
  ambientSound = 'ocean',
  ambientLoopMinutes: initialLoopMinutes = 30,
  childAge = 5,
  childName = 'Little Explorer',
  variant = 'card',
  onAmbientLoopChange,
  interactive = true,
}) => {
  const [ambientLoop, setAmbientLoop] = useState<number>(initialLoopMinutes);
  const [bedtimeStart, setBedtimeStart] = useState<string>('20:00'); // 8:00 PM default

  const handleLoopChange = (minutes: number) => {
    setAmbientLoop(minutes);
    if (onAmbientLoopChange) {
      onAmbientLoopChange(minutes);
    }
  };

  // Recommended sleep hours based on pediatric guidelines by age
  const recommendedSleepHours = useMemo(() => {
    if (childAge <= 4) return 11.5;
    if (childAge <= 6) return 10.5;
    if (childAge <= 8) return 10.0;
    return 9.5;
  }, [childAge]);

  const calculations = useMemo(() => {
    const [startH, startM] = bedtimeStart.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startH || 20, startM || 0, 0, 0);

    // Wind-down duration = story length + ambient audio loop
    const totalWindDownMinutes = storyDurationMinutes + (ambientSound === 'none' ? 10 : ambientLoop);

    // Story end time
    const storyEndDate = new Date(startDate.getTime() + storyDurationMinutes * 60 * 1000);

    // Ambient loop end time (estimated sleep onset)
    const sleepOnsetDate = new Date(startDate.getTime() + totalWindDownMinutes * 60 * 1000);

    // Projected wake-up time based on age recommendation
    const totalSleepHours = recommendedSleepHours;
    const sleepDurationMs = totalSleepHours * 60 * 60 * 1000;
    const wakeUpDate = new Date(sleepOnsetDate.getTime() + sleepDurationMs);

    const formatTime = (d: Date) => {
      let hours = d.getHours();
      const mins = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${mins} ${ampm}`;
    };

    return {
      startTimeFormatted: formatTime(startDate),
      storyEndFormatted: formatTime(storyEndDate),
      sleepOnsetFormatted: formatTime(sleepOnsetDate),
      wakeUpFormatted: formatTime(wakeUpDate),
      totalWindDownMinutes,
      totalSleepHours,
      totalNightHours: (totalWindDownMinutes / 60 + totalSleepHours).toFixed(1),
    };
  }, [bedtimeStart, storyDurationMinutes, ambientSound, ambientLoop, recommendedSleepHours]);

  const getSoundName = (soundKey: string) => {
    switch (soundKey) {
      case 'ocean': return 'Ocean Waves';
      case 'rain': return 'Gentle Rain';
      case 'wind': return 'Night Breeze';
      case 'fire': return 'Cozy Hearth';
      case 'train': return 'Night Train';
      default: return 'Quiet Slumber';
    }
  };

  const getSoundIcon = (soundKey: string) => {
    switch (soundKey) {
      case 'ocean': return <Waves className="w-3.5 h-3.5" />;
      case 'rain': return <CloudRain className="w-3.5 h-3.5" />;
      case 'wind': return <Wind className="w-3.5 h-3.5" />;
      case 'fire': return <Flame className="w-3.5 h-3.5" />;
      case 'train': return <Train className="w-3.5 h-3.5" />;
      default: return <Volume2 className="w-3.5 h-3.5" />;
    }
  };

  if (variant === 'compact') {
    return (
      <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>Sleep Duration: ~{calculations.totalSleepHours}h Rest</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-900/80 text-[10px] text-purple-200 border border-purple-700">
                Age {childAge}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {storyDurationMinutes}m story + {ambientLoop}m {getSoundName(ambientSound)} loop → Wake at {calculations.wakeUpFormatted}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-amber-300 font-semibold flex items-center gap-1">
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span>{calculations.wakeUpFormatted} Wake-Up</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="sleep-duration-estimator"
      className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-purple-950/80 border border-indigo-500/30 shadow-2xl backdrop-blur-xl space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-500/40 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Projected Sleep Estimation</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Bedtime & Sleep Horizon for {childName}
            </h4>
          </div>
        </div>

        {/* Quick Bedtime Start Selector */}
        {interactive && (
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400 ml-2" />
            <span className="text-[11px] font-semibold text-slate-400">Bedtime Start:</span>
            <select
              value={bedtimeStart}
              onChange={(e) => setBedtimeStart(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold px-2.5 py-1 rounded-xl focus:outline-none focus:border-indigo-400"
            >
              <option value="19:30">7:30 PM</option>
              <option value="20:00">8:00 PM</option>
              <option value="20:30">8:30 PM</option>
              <option value="21:00">9:00 PM</option>
              <option value="21:30">9:30 PM</option>
            </select>
          </div>
        )}
      </div>

      {/* 3 Core Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Metric 1: Story & Wind-Down */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Wind-Down Transition
            </span>
            <span className="text-[10px] text-indigo-300 font-mono">Story + Sound</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {calculations.totalWindDownMinutes} <span className="text-xs font-medium text-slate-400">minutes</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {storyDurationMinutes}m narrative + {ambientLoop}m {getSoundName(ambientSound)}
          </div>
        </div>

        {/* Metric 2: Estimated Deep Sleep Duration */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-300 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-purple-400" />
              Estimated Sleep Need
            </span>
            <span className="text-[10px] bg-purple-950 px-2 py-0.5 rounded border border-purple-700/50 text-purple-200">
              Age {childAge}
            </span>
          </div>
          <div className="text-2xl font-black text-purple-200 mt-1">
            {calculations.totalSleepHours} <span className="text-xs font-medium text-purple-300">hours</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Restorative deep & REM cycles
          </div>
        </div>

        {/* Metric 3: Projected Morning Awakening */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Sunrise className="w-3.5 h-3.5 text-amber-400" />
              Projected Wake-Up
            </span>
            <span className="text-[10px] text-amber-400 font-mono">Morning Star</span>
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {calculations.wakeUpFormatted}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Refreshed & ready for morning adventures
          </div>
        </div>
      </div>

      {/* Interactive Visual Sleep Cycle Timeline */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider">
            Nighttime Sleep Cycle Breakdown
          </span>
          <span className="text-slate-400 text-[11px]">
            Total Night: <span className="text-white font-bold">{calculations.totalNightHours} hrs</span>
          </span>
        </div>

        {/* Visual Progress Bar Flow */}
        <div className="h-4 w-full rounded-full bg-slate-950 p-0.5 flex gap-1 border border-slate-800 overflow-hidden">
          {/* Phase 1: Story meditation */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 shadow-sm"
            style={{ width: '8%', minWidth: '24px' }}
            title={`Story Narration: ${storyDurationMinutes}m`}
          />
          {/* Phase 2: Ambient audio loop drift-off */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-500 shadow-sm"
            style={{ width: '18%', minWidth: '36px' }}
            title={`Ambient Soundscape Loop: ${ambientLoop}m`}
          />
          {/* Phase 3: Deep sleep rest */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-900 via-indigo-950 to-purple-900 shadow-sm flex-1"
            title={`Deep Sleep: ~${calculations.totalSleepHours} hrs`}
          />
          {/* Phase 4: Morning awakening */}
          <div
            className="h-full rounded-full bg-amber-400"
            style={{ width: '4%', minWidth: '12px' }}
            title={`Wake-up horizon: ${calculations.wakeUpFormatted}`}
          />
        </div>

        {/* Phase Legend Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
          {/* Step 1 */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-indigo-500/30 flex flex-col">
            <span className="font-bold text-indigo-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              1. Story Narration
            </span>
            <span className="text-slate-300 font-semibold mt-0.5">{calculations.startTimeFormatted}</span>
            <span className="text-slate-500 text-[10px]">{storyDurationMinutes} mins reading</span>
          </div>

          {/* Step 2 */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-purple-500/30 flex flex-col">
            <span className="font-bold text-purple-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              2. Ambient Drift Loop
            </span>
            <span className="text-slate-300 font-semibold mt-0.5">{calculations.storyEndFormatted}</span>
            <span className="text-slate-500 text-[10px]">{ambientLoop}m {getSoundName(ambientSound)}</span>
          </div>

          {/* Step 3 */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
            <span className="font-bold text-slate-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              3. Deep Starlight Sleep
            </span>
            <span className="text-slate-300 font-semibold mt-0.5">{calculations.sleepOnsetFormatted}</span>
            <span className="text-slate-500 text-[10px]">~{calculations.totalSleepHours}h sound slumber</span>
          </div>

          {/* Step 4 */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col">
            <span className="font-bold text-amber-300 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              4. Starlight Wake-Up
            </span>
            <span className="text-amber-300 font-bold mt-0.5">{calculations.wakeUpFormatted}</span>
            <span className="text-slate-500 text-[10px]">Bright & Rested</span>
          </div>
        </div>
      </div>

      {/* Interactive Ambient Soundscape Loop Adjuster */}
      {interactive && (
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60">
              {getSoundIcon(ambientSound)}
            </div>
            <div>
              <div className="font-semibold text-slate-200">
                Ambient Soundscape Loop: <span className="text-indigo-300">{getSoundName(ambientSound)}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Adjust loop duration to tailor your child&apos;s sleep drift window
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleLoopChange(mins)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                  ambientLoop === mins
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
