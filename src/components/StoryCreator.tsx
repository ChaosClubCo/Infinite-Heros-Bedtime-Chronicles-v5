import React, { useState } from 'react';
import { Story, StoryMode, ContentTheme, AgeRange } from '../types';
import { getHeroById } from '../data/heroes';
import { HeroSelector } from './HeroSelector';
import { SleepDurationEstimator } from './SleepDurationEstimator';
import { MADLIBS_TEMPLATES } from '../data/madlibsTemplates';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import {
  Sparkles,
  Compass,
  Smile,
  Moon,
  Shield,
  Heart,
  Users,
  Lightbulb,
  Wand2,
  Dice5,
  Waves,
  CloudRain,
  Wind,
  Flame,
  Train,
  Volume2,
} from 'lucide-react';

interface StoryCreatorProps {
  initialMode?: StoryMode;
  onStoryGenerated: (story: Story) => void;
  childName?: string;
  childAge?: number;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  initialMode = 'classic',
  onStoryGenerated,
  childName = 'Explorer',
  childAge = 5,
}) => {
  const [activeMode, setActiveMode] = useState<StoryMode>(initialMode);
  const [selectedHeroId, setSelectedHeroId] = useState<string>('hero-1');
  const [selectedTheme, setSelectedTheme] = useState<ContentTheme>('wonder');
  const [selectedAge, setSelectedAge] = useState<AgeRange>('4-6');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('Cosmic Star Reef');
  const [selectedSidekick, setSelectedSidekick] = useState('Baby Dragon');
  const [selectedAmbientSound, setSelectedAmbientSound] = useState<string>('ocean');
  const [ambientLoopMinutes, setAmbientLoopMinutes] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);

  // MadLibs State
  const [selectedMadLibIndex, setSelectedMadLibIndex] = useState(0);
  const [madlibAnswers, setMadlibAnswers] = useState<Record<string, string>>({});

  const currentMadLib = MADLIBS_TEMPLATES[selectedMadLibIndex] || MADLIBS_TEMPLATES[0];

  const themes: { id: ContentTheme; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'wonder', label: 'Wonder & Stars', icon: <Sparkles className="w-4 h-4" />, color: '#B388FF' },
    { id: 'courage', label: 'Brave Courage', icon: <Shield className="w-4 h-4" />, color: '#FFD54F' },
    { id: 'kindness', label: 'Warm Kindness', icon: <Heart className="w-4 h-4" />, color: '#4DD0E1' },
    { id: 'friendship', label: 'True Friendship', icon: <Users className="w-4 h-4" />, color: '#CE93D8' },
    { id: 'imagination', label: 'Silly Fun & Dreams', icon: <Lightbulb className="w-4 h-4" />, color: '#90CAF9' },
    { id: 'comfort', label: 'Peaceful Sleep', icon: <Moon className="w-4 h-4" />, color: '#A5D6A7' },
  ];

  const settingsList = [
    'Cosmic Star Reef',
    'Moonlit Attic Fort',
    'Candy Cloud Castle',
    'Whispering Pine Glade',
    'Glittering Crystal Caves',
    'Milky Way Dream Express',
  ];

  const sidekicksList = [
    'Baby Dragon',
    'Glowfish',
    'Friendly Clockwork Owl',
    'Little Cometeer',
    'Sleepy Bear Cub',
    'Fluffy Shadow Bunny',
  ];

  const handleRandomize = () => {
    const randomHero = HEROES[Math.floor(Math.random() * HEROES.length)];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)].id;
    const randomSetting = settingsList[Math.floor(Math.random() * settingsList.length)];
    const randomSidekick = sidekicksList[Math.floor(Math.random() * sidekicksList.length)];
    setSelectedHeroId(randomHero.id);
    setSelectedTheme(randomTheme);
    setSelectedSetting(randomSetting);
    setSelectedSidekick(randomSidekick);
  };

  const handleCreateClassicOrSleep = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCustomBedtimeStory({
        heroId: selectedHeroId,
        theme: selectedTheme,
        mode: activeMode,
        ageRange: selectedAge,
        customPrompt: customPrompt.trim() || undefined,
        setting: selectedSetting,
        sidekick: selectedSidekick,
        childName,
      });
      setIsGenerating(false);
      onStoryGenerated(generated);
    }, 600);
  };

  const handleCreateMadLib = () => {
    setIsGenerating(true);
    const hero = getHeroById(selectedHeroId);
    setTimeout(() => {
      const result = currentMadLib.storyGenerator(madlibAnswers, hero.name);
      const generatedStory: Story = {
        id: `madlib-${Date.now()}`,
        title: currentMadLib.title,
        category: "Mad Libs Tale",
        theme: "imagination",
        mode: "madlibs",
        ageRange: selectedAge,
        heroId: hero.id,
        heroName: hero.name,
        summary: `A super funny fill-in-the-blank bedtime story starring ${hero.name} and the ${madlibAnswers.funnyAnimal || "silly creature"}!`,
        isCustom: true,
        audioDurationMinutes: 4,
        scenes: result.scenes.map((s, idx) => ({
          id: `ml-scene-${idx + 1}`,
          sceneNumber: idx + 1,
          totalScenes: result.scenes.length,
          text: s.text,
          sleepAffirmation: s.sleepAffirmation,
          isFinal: idx === result.scenes.length - 1,
        })),
      };
      setIsGenerating(false);
      onStoryGenerated(generatedStory);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-1.5 shadow-lg">
        <button
          type="button"
          id="mode-tab-classic"
          onClick={() => setActiveMode('classic')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMode === 'classic'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Classic Adventure</span>
        </button>

        <button
          type="button"
          id="mode-tab-madlibs"
          onClick={() => setActiveMode('madlibs')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMode === 'madlibs'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>Mad Libs Fun</span>
        </button>

        <button
          type="button"
          id="mode-tab-sleep"
          onClick={() => setActiveMode('sleep')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeMode === 'sleep'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>Sleep Journey</span>
        </button>
      </div>

      {/* Mode 1 & Mode 3: Classic Adventure & Sleep Journey Creator */}
      {activeMode !== 'madlibs' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {activeMode === 'classic' ? 'Weave an Interactive Bedtime Adventure' : 'Craft a Calming Sleep Meditation'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeMode === 'classic'
                  ? 'Choose your guardian hero, theme, and world to embark on a starry quest.'
                  : 'Soft progressive relaxation, rhythmic breathing, and comforting starlight lullabies.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors"
              title="Surprise me with random hero and theme"
            >
              <Dice5 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Surprise Me</span>
            </button>
          </div>

          {/* Hero Selection */}
          <HeroSelector
            selectedHeroId={selectedHeroId}
            onSelectHero={(h) => setSelectedHeroId(h.id)}
            compact
          />

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Core Bedtime Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {themes.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedTheme(th.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                    selectedTheme === th.id
                      ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span style={{ color: th.color }}>{th.icon}</span>
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Age Range & Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Age Range</label>
              <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(e.target.value as AgeRange)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-400"
              >
                <option value="2-4">Ages 2-4 (Simple & Soothing)</option>
                <option value="4-6">Ages 4-6 (Wonder & Rhythm)</option>
                <option value="6-8">Ages 6-8 (Adventure & Choices)</option>
                <option value="8-10">Ages 8-10 (Epic Lore & Mystery)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Magical Setting</label>
              <select
                value={selectedSetting}
                onChange={(e) => setSelectedSetting(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-400"
              >
                {settingsList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gentle Companion</label>
              <select
                value={selectedSidekick}
                onChange={(e) => setSelectedSidekick(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-400"
              >
                {sidekicksList.map((sk) => (
                  <option key={sk} value={sk}>{sk}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Prompt */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Special bedtime idea or object (optional):
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. A lost golden telescope, a singing baby comet..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Sleep Journey Specific: Visual Sleep Duration & Horizon Estimator */}
          {activeMode === 'sleep' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Choose Ambient Soundscape For Drift-Off</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'ocean', label: 'Ocean', icon: Waves },
                    { id: 'rain', label: 'Rain', icon: CloudRain },
                    { id: 'wind', label: 'Breeze', icon: Wind },
                    { id: 'fire', label: 'Hearth', icon: Flame },
                    { id: 'train', label: 'Train', icon: Train },
                    { id: 'none', label: 'Quiet', icon: Moon },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = selectedAmbientSound === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedAmbientSound(s.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Sleep Duration & Bedtime Projection Component */}
              <SleepDurationEstimator
                storyDurationMinutes={6}
                ambientSound={selectedAmbientSound}
                ambientLoopMinutes={ambientLoopMinutes}
                childAge={childAge}
                childName={childName}
                variant="card"
                onAmbientLoopChange={(m) => setAmbientLoopMinutes(m)}
                interactive={true}
              />
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            id="generate-story-btn"
            onClick={handleCreateClassicOrSleep}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Weaving Story with Star Magic...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>Begin Bedtime Story Now</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Mode 2: Mad Libs Fun Creator */
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Mad Libs Giggle Forge</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the silly blanks or tap the fun kid suggestions below to generate a bedtime laugh!
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-500/30">
              Giggles Guaranteed 😄
            </span>
          </div>

          {/* Mad Lib Template Picker */}
          <div className="flex gap-3">
            {MADLIBS_TEMPLATES.map((tmpl, idx) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => {
                  setSelectedMadLibIndex(idx);
                  setMadlibAnswers({});
                }}
                className={`flex-1 p-3 rounded-2xl border text-left transition-all ${
                  selectedMadLibIndex === idx
                    ? 'bg-amber-950/60 border-amber-400 shadow-md shadow-amber-500/20 text-white'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-xs font-bold">{tmpl.title}</div>
                <div className="text-[11px] text-slate-400">Fill in {tmpl.fields.length} funny words</div>
              </button>
            ))}
          </div>

          {/* Hero Selection for Mad Libs */}
          <HeroSelector
            selectedHeroId={selectedHeroId}
            onSelectHero={(h) => setSelectedHeroId(h.id)}
            compact
          />

          {/* Word Blanks Form */}
          <div className="space-y-4 pt-2">
            {currentMadLib.fields.map((field) => (
              <div key={field.key} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300">{field.label}</label>
                  <span className="text-[11px] text-slate-400 italic">{field.placeholder}</span>
                </div>
                <input
                  type="text"
                  value={madlibAnswers[field.key] || ''}
                  onChange={(e) => setMadlibAnswers({ ...madlibAnswers, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-400">Quick suggestions:</span>
                  {field.suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setMadlibAnswers({ ...madlibAnswers, [field.key]: sug })}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-amber-950 text-slate-300 hover:text-amber-200 text-[11px] font-medium border border-slate-700/80 transition-colors"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            id="generate-madlib-btn"
            onClick={handleCreateMadLib}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Mixing Your Silly Words...</span>
              </>
            ) : (
              <>
                <Smile className="w-5 h-5 fill-current" />
                <span>Generate Hilarious Mad Libs Story</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
