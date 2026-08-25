import React, { useState, useEffect } from 'react';
import { Story, AgeRange } from '../types';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import { ambientSoundEngine } from '../services/audioNarration';
import {
  Sparkles,
  ArrowLeft,
  RefreshCw,
  Mic,
  MicOff,
  Music,
  Bookmark,
  Play,
  Lock,
  Sliders,
  Clock,
} from 'lucide-react';

export type MadlibMode = 'diary' | 'focus' | 'workshop';

interface MadlibDiariesViewProps {
  onBack: () => void;
  onStoryGenerated: (story: Story) => void;
  childName?: string;
  childAge?: number;
  initialMode?: MadlibMode;
}

interface NarrativePreset {
  id: string;
  title: string;
  noun: string;
  place: string;
  adjective: string;
  animal: string;
  object: string;
  action: string;
  sound: string;
}

const NARRATIVE_PRESETS: NarrativePreset[] = [
  {
    id: 'starlight-owl',
    title: 'The Starlight Forest',
    noun: 'little dreamer',
    place: 'Whispering Willow Grove',
    adjective: 'glimmering',
    animal: 'silver owl',
    object: 'golden compass',
    action: 'glow with warm starlight',
    sound: 'whoosh-whoosh',
  },
  {
    id: 'marshmallow-cloud',
    title: 'Cloud Kingdom',
    noun: 'cozy bear',
    place: 'Marshmallow Mountain',
    adjective: 'sleepy',
    animal: 'fluffy badger',
    object: 'moonbeam teapot',
    action: 'bubble with sweet lavender dreams',
    sound: 'squish-squish',
  },
  {
    id: 'ocean-tide',
    title: 'Lullaby Lagoon',
    noun: 'baby dolphin',
    place: 'Crystal Coral Reef',
    adjective: 'sparkling',
    animal: 'star sea turtle',
    object: 'pearl music box',
    action: 'chime a peaceful night tune',
    sound: 'splish-splash',
  },
];

const NARRATORS = [
  { id: 'wise-owl', name: 'Wise Owl', emoji: '🦉', desc: 'Warm & gently calming' },
  { id: 'sleepy-cloud', name: 'Sleepy Cloud', emoji: '☁️', desc: 'Soft & dreamy whisper' },
  { id: 'cozy-bear', name: 'Cozy Bear', emoji: '🐻', desc: 'Deep & comforting' },
];

const CANVAS_ARTWORKS = [
  {
    id: 'nebula-spiral',
    title: 'Cosmic Amber Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'dream-lagoon',
    title: 'Bioluminescent Glade',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'starlight-aurora',
    title: 'Northern Lullaby Aurora',
    url: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=1000&auto=format&fit=crop',
  },
];

export const MadlibDiariesView: React.FC<MadlibDiariesViewProps> = ({
  onBack,
  onStoryGenerated,
  childName = 'Little Explorer',
  childAge = 5,
  initialMode = 'diary',
}) => {
  const [viewMode, setViewMode] = useState<MadlibMode>(initialMode);

  // Common Madlib Fields
  const [noun, setNoun] = useState('');
  const [place, setPlace] = useState('');
  const [adjective, setAdjective] = useState('');
  const [animal, setAnimal] = useState('');
  const [object, setObject] = useState('');
  const [action, setAction] = useState('');
  const [sillySound, setSillySound] = useState('');

  // Story Settings (Sidebar)
  const [voiceType, setVoiceType] = useState<'Ethereal' | 'Warm' | 'Playful' | 'Deep'>('Warm');
  const [backgroundAudio, setBackgroundAudio] = useState<'Celestial Hum' | 'Purring Galaxy' | 'Rain on Glass'>('Purring Galaxy');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('wise-owl');
  const [activeCanvasIndex, setActiveCanvasIndex] = useState<number>(0);
  
  // UI & Audio States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const [generatingCoverArt, setGeneratingCoverArt] = useState(false);

  // Randomize all inputs
  const handleRandomizePreset = () => {
    const preset = NARRATIVE_PRESETS[Math.floor(Math.random() * NARRATIVE_PRESETS.length)];
    setNoun(preset.noun);
    setPlace(preset.place);
    setAdjective(preset.adjective);
    setAnimal(preset.animal);
    setObject(preset.object);
    setAction(preset.action);
    setSillySound(preset.sound);
    setActiveCanvasIndex((prev) => (prev + 1) % CANVAS_ARTWORKS.length);
  };

  // Switch to new artwork
  const handleRegenerateCover = () => {
    setGeneratingCoverArt(true);
    setTimeout(() => {
      setActiveCanvasIndex((prev) => (prev + 1) % CANVAS_ARTWORKS.length);
      setGeneratingCoverArt(false);
    }, 600);
  };

  // Live Speech Recognition
  const toggleVoiceInput = (targetSlot: string = 'noun') => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // Fallback
      handleRandomizePreset();
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          const clean = transcript.trim().toLowerCase();
          if (targetSlot === 'noun') setNoun(clean);
          else if (targetSlot === 'place') setPlace(clean);
          else if (targetSlot === 'adjective') setAdjective(clean);
          else if (targetSlot === 'animal') setAnimal(clean);
          else if (targetSlot === 'object') setObject(clean);
          else if (targetSlot === 'action') setAction(clean);
          else if (targetSlot === 'sound') setSillySound(clean);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Preview Audio
  const toggleAudioPreview = () => {
    if (audioPreviewPlaying) {
      ambientSoundEngine.stopAmbient();
      setAudioPreviewPlaying(false);
    } else {
      const soundType =
        backgroundAudio === 'Rain on Glass'
          ? 'rain'
          : backgroundAudio === 'Celestial Hum'
          ? 'wind'
          : 'night';
      ambientSoundEngine.playAmbient(soundType as any, 0.4);
      setAudioPreviewPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      ambientSoundEngine.stopAmbient();
    };
  }, []);

  // Generate & Weave Full Story
  const handleGenerateStory = async () => {
    setIsGenerating(true);

    const effNoun = noun.trim() || 'little wanderer';
    const effPlace = place.trim() || 'starlit meadow';
    const effAdjective = adjective.trim() || 'sleepy';
    const effAnimal = animal.trim() || 'silver fox';
    const effObject = object.trim() || 'crystal lantern';
    const effAction = action.trim() || 'twinkle gently';
    const effSound = sillySound.trim() || 'hush-hush';

    const customPrompt = `Madlib Bedtime Chronicle: In ${effPlace}, a ${effNoun} embarks on a calming quest with a ${effAdjective} ${effAnimal}. They find a ${effObject} that started to ${effAction} with a gentle "${effSound}" sound.`;

    try {
      const generated = generateCustomBedtimeStory({
        heroId: 'hero-1',
        theme: 'imagination',
        mode: 'madlibs',
        ageRange: (childAge <= 4 ? '2-4' : childAge <= 6 ? '4-6' : childAge <= 8 ? '6-8' : '8-10') as AgeRange,
        childName,
        customPrompt,
        setting: effPlace,
        sidekick: `${effAdjective} ${effAnimal}`,
        problem: `helping the ${effObject} ${effAction}`,
      });

      generated.title = `${effAdjective.charAt(0).toUpperCase() + effAdjective.slice(1)} ${effAnimal.charAt(0).toUpperCase() + effAnimal.slice(1)} of ${effPlace}`;
      generated.summary = `A special 3-minute bedtime madlib tale crafted for ${childName}, featuring a ${effNoun} in ${effPlace} who discovered a magical ${effObject}.`;
      generated.coverImage = CANVAS_ARTWORKS[activeCanvasIndex].url;
      generated.audioDurationMinutes = 3;

      onStoryGenerated(generated);
    } catch (err) {
      console.error('Error generating madlib:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const currentCanvas = CANVAS_ARTWORKS[activeCanvasIndex];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between p-3 sm:p-6 lg:p-8 bg-[#09081a] rounded-3xl border border-indigo-950/60 shadow-2xl text-slate-100 overflow-hidden font-sans">
      
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl" />
      </div>

      {/* Top Header & Mode Switcher */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-indigo-950/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group px-2.5 py-1.5 rounded-xl hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-playfair text-lg text-slate-200">Bedtime Chronicles</span>
          </button>
        </div>

        {/* 3-View Mode Switcher */}
        <div className="flex items-center bg-[#130f2d] p-1 rounded-2xl border border-purple-900/40 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode('diary')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'diary'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Madlib Diaries
          </button>
          <button
            type="button"
            onClick={() => setViewMode('focus')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'focus'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Celestial Focus
          </button>
          <button
            type="button"
            onClick={() => setViewMode('workshop')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === 'workshop'
                ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                : 'text-purple-300 hover:text-white'
            }`}
          >
            Workshop of Wonders
          </button>
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomizePreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/40 transition-all"
            title="Randomize words"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inspire Me</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: MADLIB DIARIES WITH STORY SETTINGS SIDEBAR (Exact Image 1 layout)
          ========================================================================= */}
      {viewMode === 'diary' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-4">
          
          {/* Main Card: Story Blank Paragraph & Canvas */}
          <div className="lg:col-span-8 bg-[#120e2e]/80 border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-8">
                <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  Madlib Diaries
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-purple-200/70 max-w-md mx-auto">
                  Co-create your dream. Fill in the blanks to weave a 3-minute whimsical tale.
                </p>
              </div>

              {/* Inline Interactive Story Paragraphs */}
              <div className="text-base sm:text-lg md:text-xl text-slate-200 leading-[2.2] sm:leading-[2.5] font-playfair font-normal">
                <p className="mb-4">
                  Once upon a time, there was a goofy{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={noun}
                      onChange={(e) => setNoun(e.target.value)}
                      placeholder="Noun"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-28 sm:w-36 transition-all"
                    />
                  </span>{' '}
                  who lived in a magical{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="Place"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-32 sm:w-40 transition-all"
                    />
                  </span>
                  . Every night, they would look up at the stars and dream of finding the{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={adjective}
                      onChange={(e) => setAdjective(e.target.value)}
                      placeholder="Adjective"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-28 sm:w-36 transition-all"
                    />
                  </span>{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={animal}
                      onChange={(e) => setAnimal(e.target.value)}
                      placeholder="Animal"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-28 sm:w-36 transition-all"
                    />
                  </span>
                  .
                </p>

                <p>
                  One evening, while walking through the glowing forest, they stumbled upon a hidden{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={object}
                      onChange={(e) => setObject(e.target.value)}
                      placeholder="Object"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-32 sm:w-44 transition-all"
                    />
                  </span>{' '}
                  that hummed with a strange energy. Suddenly, it started to{' '}
                  <span className="inline-block mx-1">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => setAction(e.target.value)}
                      placeholder="Action/Verb"
                      className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-base sm:text-lg font-medium px-3 py-0.5 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400 text-center w-36 sm:w-48 transition-all"
                    />
                  </span>
                  !
                </p>
              </div>

              {/* Tonight's Canvas Preview Box */}
              <div className="mt-6 relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-purple-800/40 bg-black/40 group shadow-inner">
                <img
                  src={currentCanvas.url}
                  alt={currentCanvas.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                
                <div className="absolute bottom-3 left-4 flex items-center justify-between right-4">
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-amber-300/90 font-mono">
                    TONIGHT&apos;S CANVAS: {currentCanvas.title}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateCover}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
                    title="Change Canvas"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingCoverArt ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="w-full sm:w-2/3 py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#FFD54F] hover:bg-[#ffe082] text-[#120e2e] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-[#120e2e] ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Weaving Dream...' : 'Generate Story'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full sm:w-1/3 py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-wider uppercase border border-amber-400/60 hover:bg-amber-400/10 text-amber-200 flex items-center justify-center gap-2 transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSaved ? 'Saved!' : 'Save Story'}</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Story Settings */}
          <div className="lg:col-span-4 bg-[#110d2c]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-purple-900/40 text-slate-200">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-playfair text-lg font-bold">Story Settings</h3>
              </div>

              {/* VOICE TYPE */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 block mb-2">
                  VOICE TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Ethereal', 'Warm', 'Playful', 'Deep'] as const).map((vt) => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setVoiceType(vt)}
                      className={`py-2 px-3 rounded-full text-xs font-medium transition-all ${
                        voiceType === vt
                          ? 'border border-amber-400 bg-amber-400/15 text-amber-300 font-bold shadow-sm'
                          : 'border border-purple-900/50 bg-purple-950/30 text-slate-300 hover:border-purple-700'
                      }`}
                    >
                      {vt}
                    </button>
                  ))}
                </div>
              </div>

              {/* BACKGROUND AUDIO */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 block mb-2">
                  BACKGROUND AUDIO
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'Celestial Hum', icon: '|||', desc: 'Deep soft resonance' },
                    { id: 'Purring Galaxy', icon: '⭐', desc: 'Cosmic night warmth' },
                    { id: 'Rain on Glass', icon: '💧', desc: 'Gentle droplet rhythm' },
                  ].map((audio) => (
                    <button
                      key={audio.id}
                      type="button"
                      onClick={() => {
                        setBackgroundAudio(audio.id as any);
                        const sType = audio.id === 'Rain on Glass' ? 'rain' : audio.id === 'Celestial Hum' ? 'wind' : 'night';
                        ambientSoundEngine.playAmbient(sType as any, 0.4);
                        setAudioPreviewPlaying(true);
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all border ${
                        backgroundAudio === audio.id
                          ? 'bg-[#1e174b] border-amber-400/60 text-white shadow-md'
                          : 'bg-[#151036]/60 border-purple-900/40 text-slate-300 hover:bg-[#1a1443]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{audio.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{audio.id}</p>
                          <p className="text-[10px] text-purple-300/60">{audio.desc}</p>
                        </div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        backgroundAudio === audio.id ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                      }`}>
                        {backgroundAudio === audio.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* DURATION */}
              <div className="mt-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 block mb-2">
                  DURATION
                </label>
                <div className="p-3.5 rounded-2xl bg-[#151036] border border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium">Story Length</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-800/40 text-amber-300 font-mono text-xs font-bold">
                    <span>3m</span>
                    <Lock className="w-3 h-3 text-amber-400/80" />
                  </div>
                </div>
                <p className="text-[11px] text-purple-300/60 mt-2 italic px-1">
                  Madlib stories are perfectly paced for a 3-minute drift-off.
                </p>
              </div>
            </div>

            {/* Quick Word Bank suggestions */}
            <div className="pt-6 border-t border-purple-900/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300/60 block mb-2">
                Quick Word Sparks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Marshmallow', 'Glow-Worm', 'Starlight', 'Sleepy Sloth', 'Lavender'].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      if (!noun) setNoun(word.toLowerCase());
                      else if (!place) setPlace(word);
                      else if (!adjective) setAdjective(word.toLowerCase());
                      else if (!animal) setAnimal(word.toLowerCase());
                      else setObject(word.toLowerCase());
                    }}
                    className="px-2.5 py-1 rounded-full bg-purple-950/50 hover:bg-purple-900 border border-purple-800/40 text-purple-200 text-[11px] font-serif transition-colors"
                  >
                    + {word}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: MINIMALIST CELESTIAL FOCUS MODE (Exact Image 2 layout)
          ========================================================================= */}
      {viewMode === 'focus' && (
        <div className="relative z-10 flex-1 flex flex-col justify-between py-8 px-4 sm:px-8 text-center max-w-4xl mx-auto w-full">
          
          <div className="my-auto">
            {/* Centered Large Display Sentence */}
            <div className="font-playfair text-3xl sm:text-5xl md:text-6xl text-white font-bold leading-[1.7] tracking-tight">
              <span>Once upon a </span>

              {/* Time/Place Blank */}
              <span className="inline-block align-middle mx-1.5 my-1">
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="time/place"
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
                />
              </span>

              <span>, there was a </span>

              {/* Creature Blank */}
              <span className="inline-block align-middle mx-1.5 my-1">
                <input
                  type="text"
                  value={animal ? `${adjective} ${animal}`.trim() : ''}
                  onChange={(e) => {
                    const parts = e.target.value.split(' ');
                    if (parts.length > 1) {
                      setAdjective(parts[0]);
                      setAnimal(parts.slice(1).join(' '));
                    } else {
                      setAnimal(e.target.value);
                    }
                  }}
                  placeholder="creature"
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
                />
              </span>

              <span> who danced with the </span>

              {/* Object Blank */}
              <span className="inline-block align-middle mx-1.5 my-1">
                <input
                  type="text"
                  value={object}
                  onChange={(e) => setObject(e.target.value)}
                  placeholder="object"
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
                />
              </span>

              <span> ...</span>
            </div>

            {/* Floating Gold Weave Story Button */}
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="flex items-center gap-2.5 px-10 py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest bg-[#a38753] hover:bg-[#b89a62] text-[#1c1308] shadow-2xl shadow-amber-950/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-[#1c1308]" />
                <span>{isGenerating ? 'Weaving Story...' : 'WEAVE STORY'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Floating Voice Dictation Trigger */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-2">
              {NARRATIVE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setNoun(p.noun);
                    setPlace(p.place);
                    setAdjective(p.adjective);
                    setAnimal(p.animal);
                    setObject(p.object);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-serif bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/60 transition-all"
                >
                  {p.title}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => toggleVoiceInput('place')}
              className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all shadow-2xl ${
                isListening
                  ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-red-500/50'
                  : 'bg-[#3b256d]/80 hover:bg-[#4d328c] border-purple-400/40 text-purple-200 shadow-purple-950/80 hover:scale-105'
              }`}
              title="Voice Prompt Dictation"
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: THE WORKSHOP OF WONDERS (Exact Image 3 layout)
          ========================================================================= */}
      {viewMode === 'workshop' && (
        <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
          
          {/* Main Stage Grid */}
          <div className="max-w-5xl mx-auto w-full">
            
            {/* Title & Subtitle */}
            <div className="text-center mb-8">
              <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-amber-200 tracking-tight">
                The Workshop of Wonders
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-purple-200/70">
                Build a silly story to settle your mind.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: 4 Distinct Themed Input Cards with Colored Left Borders */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* 1. AN ADJECTIVE (Yellow border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-l-2xl" />
                  <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80 block mb-1">
                    AN ADJECTIVE
                  </label>
                  <input
                    type="text"
                    value={adjective}
                    onChange={(e) => setAdjective(e.target.value)}
                    placeholder="e.g. sleepy, sparkly, wobbly..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 2. AN ANIMAL (Purple border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-400 rounded-l-2xl" />
                  <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/80 block mb-1">
                    AN ANIMAL
                  </label>
                  <input
                    type="text"
                    value={animal}
                    onChange={(e) => setAnimal(e.target.value)}
                    placeholder="e.g. badger, owl, hedgehog..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* 3. A PLACE (Blue border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-400 rounded-l-2xl" />
                  <label className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80 block mb-1">
                    A PLACE
                  </label>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. marshmallow mountain, star reef..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                {/* 4. A SILLY SOUND (Pink border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 sm:p-5 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400 rounded-l-2xl" />
                  <label className="text-[10px] font-bold uppercase tracking-widest text-pink-300/80 block mb-1">
                    A SILLY SOUND
                  </label>
                  <input
                    type="text"
                    value={sillySound}
                    onChange={(e) => setSillySound(e.target.value)}
                    placeholder="e.g. boop, squish, whoosh..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
              </div>

              {/* Right Column: Generating Cover Art & Narrator Choice */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                
                {/* Generating Cover Art Box with Animated Portal */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-5 shadow-lg h-60 sm:h-64 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300/80 font-mono">
                      {generatingCoverArt ? 'BREWING ARTWORK...' : 'GENERATING COVER ART...'}
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateCover}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generatingCoverArt ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Portal Artwork Display */}
                  <div className="relative my-auto flex flex-col items-center justify-center text-center">
                    <div className="relative w-28 h-28 rounded-full border-2 border-dashed border-amber-400/40 flex items-center justify-center shadow-inner overflow-hidden">
                      <img
                        src={currentCanvas.url}
                        alt="Generating"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 blur-[1px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-transparent to-black/80" />
                      <Sparkles className="relative z-10 w-8 h-8 text-amber-300 animate-pulse" />
                    </div>
                    <p className="mt-3 text-xs text-purple-200/70 italic max-w-xs">
                      Brewing up something magical based on your words...
                    </p>
                  </div>
                </div>

                {/* Choose Narrator Box */}
                <div className="bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg">
                  <span className="text-xs font-semibold text-slate-200 block mb-3 font-playfair">
                    Choose Narrator
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {NARRATORS.map((narrator) => {
                      const isSelected = selectedNarrator === narrator.id;
                      return (
                        <button
                          key={narrator.id}
                          type="button"
                          onClick={() => setSelectedNarrator(narrator.id)}
                          className={`p-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-purple-900/60 border border-amber-400/80 shadow-md'
                              : 'bg-[#0e0a27] border border-purple-900/30 hover:bg-purple-950/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl mb-1 ${
                            isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : ''
                          }`}>
                            {narrator.emoji}
                          </div>
                          <span className="text-[11px] font-medium text-slate-200 text-center leading-tight">
                            {narrator.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating Music & Player Bar (Bottom of Image 3) */}
          <div className="mt-6 max-w-2xl mx-auto w-full">
            <div className="bg-[#130f2e]/95 border border-purple-800/40 rounded-full py-2.5 px-5 shadow-2xl flex items-center justify-between gap-4">
              
              {/* Music Audio Toggle */}
              <button
                type="button"
                onClick={toggleAudioPreview}
                className={`p-2 rounded-full transition-colors ${
                  audioPreviewPlaying ? 'bg-amber-400 text-slate-950' : 'text-purple-300 hover:text-white'
                }`}
                title="Toggle Ambient Track"
              >
                <Music className="w-4 h-4" />
              </button>

              {/* Progress Slider */}
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-mono mb-1">
                  READY TO READ
                </span>
                <div className="w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden border border-purple-900/60">
                  <div className="h-full bg-amber-400 rounded-full w-1/3 transition-all" />
                </div>
              </div>

              {/* Gold Circular Play Button */}
              <button
                type="button"
                onClick={handleGenerateStory}
                disabled={isGenerating}
                className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                title="Generate & Read Story"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>

              {/* Sound Settings Indicator */}
              <button
                type="button"
                onClick={() => setViewMode('diary')}
                className="text-purple-300 hover:text-white p-1"
                title="Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-purple-950/50 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-300/40 gap-2">
        <span className="font-playfair text-slate-300/70">Bedtime Chronicles</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="hover:text-purple-200 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-purple-200 cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </div>
  );
};
