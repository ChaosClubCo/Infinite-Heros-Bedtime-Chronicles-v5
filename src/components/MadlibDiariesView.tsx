import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Story, AgeRange } from '../types';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import { ambientSoundEngine } from '../services/audioNarration';
import { MADLIBS_TEMPLATES, MadLibTemplate } from '../data/madlibsTemplates';
import { HEROES } from '../data/heroes';
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
  Wand2,
  BookOpen,
  Moon,
  Volume2,
  Trash2,
  Dice5,
  ChevronRight,
  Sparkle,
} from 'lucide-react';

export type MadlibMode = 'diary' | 'focus' | 'workshop' | 'arcade' | 'vault';

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
  tag: string;
}

interface VaultMadlibItem {
  id: string;
  title: string;
  timestamp: string;
  story: Story;
  mode: string;
  keywords: string[];
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
    tag: 'Cosmic Nature',
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
    tag: 'Sweet Dreams',
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
    tag: 'Ocean Calm',
  },
  {
    id: 'dragon-garden',
    title: "Gentle Dragon's Glen",
    noun: 'starlight wanderer',
    place: 'Jasmine Flower Valley',
    adjective: 'warm & fuzzy',
    animal: 'tea dragon',
    object: 'cinnamon crystal',
    action: 'sparkle like soft fireworks',
    sound: 'purr-purr-hum',
    tag: 'Fantasy Wonder',
  },
  {
    id: 'midnight-express',
    title: 'Milky Way Dream Express',
    noun: 'night conductor',
    place: 'Constellation Station',
    adjective: 'twinkling',
    animal: 'pajama koala',
    object: 'silver lantern',
    action: 'glide across glowing moonbeams',
    sound: 'chugga-chugga-hush',
    tag: 'Starry Journey',
  },
];

const NARRATORS = [
  { id: 'wise-owl', name: 'Wise Owl', emoji: '🦉', desc: 'Warm & gently calming', speed: 'gentle' },
  { id: 'sleepy-cloud', name: 'Sleepy Cloud', emoji: '☁️', desc: 'Soft & dreamy whisper', speed: 'gentle' },
  { id: 'cozy-bear', name: 'Cozy Bear', emoji: '🐻', desc: 'Deep & comforting resonance', speed: 'normal' },
  { id: 'star-turtle', name: 'Star Turtle', emoji: '🐢', desc: 'Slow, peaceful & meditative', speed: 'gentle' },
  { id: 'fairy-guide', name: 'Starlight Fairy', emoji: '🧚', desc: 'Playful yet soothing chime', speed: 'medium' },
];

const CANVAS_ARTWORKS = [
  {
    id: 'nebula-spiral',
    title: 'Cosmic Amber Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
    theme: 'wonder',
  },
  {
    id: 'dream-lagoon',
    title: 'Bioluminescent Glade',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    theme: 'comfort',
  },
  {
    id: 'starlight-aurora',
    title: 'Northern Lullaby Aurora',
    url: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=1000&auto=format&fit=crop',
    theme: 'courage',
  },
  {
    id: 'crystal-cave',
    title: 'Glittering Crystal Cavern',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop',
    theme: 'imagination',
  },
  {
    id: 'moonrise-peaks',
    title: 'Velvet Moonrise Mountain',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1000&auto=format&fit=crop',
    theme: 'comfort',
  },
];

const WORD_BANKS = {
  nouns: ['Little Wanderer', 'Dream Catcher', 'Starlight Knight', 'Sleepy Sailor', 'Moon Jumper', 'Pajama Pilot'],
  adjectives: ['Sparkly', 'Sleepy', 'Velvety', 'Glowing', 'Goofy', 'Featherlight', 'Giggle-filled', 'Cozy'],
  animals: ['Silver Owl', 'Fluffy Badger', 'Pajama Penguin', 'Dancing Hamster', 'Tea Dragon', 'Cloud Bunny', 'Star Turtle'],
  places: ['Whispering Grove', 'Marshmallow Mountain', 'Lullaby Lagoon', 'Pillow Cloud Fort', 'Milky Way Station', 'Lavender Meadow'],
  objects: ['Moonbeam Teapot', 'Golden Compass', 'Pearl Music Box', 'Crystal Lantern', 'Glow Bubble', 'Velvet Quilt'],
  sounds: ['Whoosh-whoosh', 'Squish-squish', 'Splish-splash', 'Chugga-chugga-hush', 'Bloop-a-doop', 'Purr-purr-hum'],
  actions: ['glow with soft starlight', 'bubble with sweet dreams', 'chime a peaceful tune', 'float across the clouds', 'twinkle gently'],
};

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
  const [backgroundAudio, setBackgroundAudio] = useState<'Celestial Hum' | 'Purring Galaxy' | 'Rain on Glass' | 'Whispering Pines'>('Purring Galaxy');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('wise-owl');
  const [activeCanvasIndex, setActiveCanvasIndex] = useState<number>(0);
  const [sillySleepyMeter, setSillySleepyMeter] = useState<number>(3); // 1 = Super Silly, 5 = Deep Sleep

  // Arcade Mode Selected Template & Answers
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [arcadeAnswers, setArcadeAnswers] = useState<Record<string, string>>({});
  const [activeArcadeFieldKey, setActiveArcadeFieldKey] = useState<string>('');

  // UI & Audio States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningSlot, setListeningSlot] = useState<string>('');
  const [audioPreviewPlaying, setAudioPreviewPlaying] = useState(false);
  const [generatingCoverArt, setGeneratingCoverArt] = useState(false);
  const [activeTabNotice, setActiveTabNotice] = useState<string | null>(null);

  // Saved Vault Stories
  const [vaultItems, setVaultItems] = useState<VaultMadlibItem[]>(() => {
    try {
      const stored = localStorage.getItem('infinite_heroes_madlib_vault');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const micRecognitionRef = useRef<any>(null);

  // Save vault to storage
  useEffect(() => {
    try {
      localStorage.setItem('infinite_heroes_madlib_vault', JSON.stringify(vaultItems));
    } catch {}
  }, [vaultItems]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientSoundEngine.stopAmbient();
    };
  }, []);

  const currentTemplate: MadLibTemplate = MADLIBS_TEMPLATES[selectedTemplateIndex] || MADLIBS_TEMPLATES[0];

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

    // Also populate arcade answers
    const answers: Record<string, string> = {};
    currentTemplate.fields.forEach((f) => {
      const randomSug = f.suggestions[Math.floor(Math.random() * f.suggestions.length)];
      answers[f.key] = randomSug;
    });
    setArcadeAnswers(answers);

    showNotice(`Inspired by ${preset.title}!`);
  };

  const showNotice = (msg: string) => {
    setActiveTabNotice(msg);
    setTimeout(() => setActiveTabNotice(null), 3000);
  };

  // Switch to new artwork
  const handleRegenerateCover = () => {
    setGeneratingCoverArt(true);
    setTimeout(() => {
      setActiveCanvasIndex((prev) => (prev + 1) % CANVAS_ARTWORKS.length);
      setGeneratingCoverArt(false);
    }, 450);
  };

  // Live Speech Recognition
  const toggleVoiceInput = (targetSlot: string = 'noun') => {
    if (isListening) {
      if (micRecognitionRef.current) {
        micRecognitionRef.current.stop();
      }
      setIsListening(false);
      setListeningSlot('');
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showNotice('Speech recognition unavailable. Using random word spark.');
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

      micRecognitionRef.current = recognition;
      setIsListening(true);
      setListeningSlot(targetSlot);

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
          else if (targetSlot.startsWith('arcade:')) {
            const key = targetSlot.replace('arcade:', '');
            setArcadeAnswers((prev) => ({ ...prev, [key]: clean }));
          }
          showNotice(`Heard: "${clean}"`);
        }
        setIsListening(false);
        setListeningSlot('');
      };

      recognition.onerror = () => {
        setIsListening(false);
        setListeningSlot('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setListeningSlot('');
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setListeningSlot('');
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
          : backgroundAudio === 'Whispering Pines'
          ? 'crickets'
          : 'night';
      ambientSoundEngine.playAmbient(soundType as any, 0.4);
      setAudioPreviewPlaying(true);
    }
  };

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

    const customPrompt = `Madlib Bedtime Chronicle: In ${effPlace}, a ${effNoun} embarks on a calming quest with a ${effAdjective} ${effAnimal}. They find a ${effObject} that started to ${effAction} with a gentle "${effSound}" sound. Calmness tone level: ${sillySleepyMeter}/5.`;

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

      // Save into vault
      const newVaultEntry: VaultMadlibItem = {
        id: `madlib-vault-${Date.now()}`,
        title: generated.title,
        timestamp: 'Just now',
        story: generated,
        mode: viewMode,
        keywords: [effAdjective, effAnimal, effPlace, effObject],
      };
      setVaultItems((prev) => [newVaultEntry, ...prev.slice(0, 15)]);

      onStoryGenerated(generated);
    } catch (err) {
      console.error('Error generating madlib:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Story from Arcade Template
  const handleGenerateArcadeStory = () => {
    setIsGenerating(true);
    try {
      const hero = HEROES.find((h) => h.id === currentTemplate.suggestedHeroId) || HEROES[0];
      const storyPayload = currentTemplate.storyGenerator(arcadeAnswers, hero.name);

      const generated: Story = {
        id: `story-arcade-${Date.now()}`,
        title: currentTemplate.title,
        category: 'Madlib Bedtime Chronicle',
        theme: (currentTemplate.theme as any) || 'imagination',
        mode: 'madlibs',
        ageRange: (childAge <= 4 ? '2-4' : childAge <= 6 ? '4-6' : childAge <= 8 ? '6-8' : '8-10') as AgeRange,
        heroId: hero.id,
        heroName: hero.name,
        summary: `A personalized bedtime tale starring ${hero.name} with fun words chosen by ${childName}.`,
        coverImage: CANVAS_ARTWORKS[activeCanvasIndex].url,
        audioDurationMinutes: 3,
        scenes: storyPayload.scenes.map((s, idx) => ({
          id: `scene-${idx + 1}`,
          sceneNumber: idx + 1,
          text: s.text,
          sleepAffirmation: s.sleepAffirmation,
          isFinal: idx === storyPayload.scenes.length - 1,
        })),
      };

      // Save into vault
      const newVaultEntry: VaultMadlibItem = {
        id: `madlib-vault-${Date.now()}`,
        title: generated.title,
        timestamp: 'Just now',
        story: generated,
        mode: 'arcade',
        keywords: Object.values(arcadeAnswers).filter(Boolean),
      };
      setVaultItems((prev) => [newVaultEntry, ...prev.slice(0, 15)]);

      onStoryGenerated(generated);
    } catch (err) {
      console.error('Error generating arcade madlib:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    showNotice('Madlib saved to Bedtime Vault!');
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDeleteVaultItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVaultItems((prev) => prev.filter((item) => item.id !== id));
    showNotice('Tale removed from Vault');
  };

  const currentCanvas = CANVAS_ARTWORKS[activeCanvasIndex];

  return (
    <div className="relative min-h-[90vh] flex flex-col justify-between p-3 sm:p-6 lg:p-8 bg-[#09081a] rounded-3xl border border-indigo-950/60 shadow-2xl text-slate-100 overflow-hidden font-sans">
      {/* Ambient background particles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl" />
        <div className="absolute top-1/2 right-10 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      {/* Top Header & 5-Mode Suite Switcher */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-indigo-950/50">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group px-2.5 py-1.5 rounded-xl hover:bg-white/5"
            aria-label="Back to Bedtime Chronicles"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-playfair text-lg text-slate-200">Bedtime Chronicles</span>
          </button>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
            <Wand2 className="w-3 h-3" />
            <span>Madlib Suite</span>
          </div>
        </div>

        {/* 5-Mode Switcher */}
        <div className="flex items-center bg-[#130f2d] p-1 rounded-2xl border border-purple-900/40 shadow-inner flex-wrap gap-1">
          {[
            { id: 'diary', label: 'Story Diaries', icon: BookOpen },
            { id: 'focus', label: 'Celestial Focus', icon: Moon },
            { id: 'workshop', label: 'Wonders Lab', icon: Sparkles },
            { id: 'arcade', label: 'Story Packs', icon: Wand2 },
            { id: 'vault', label: `Vault (${vaultItems.length})`, icon: Bookmark },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id as MadlibMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomizePreset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 border border-purple-800/40 transition-all shadow-sm active:scale-95"
            title="Randomize words with bedtime magic"
          >
            <Dice5 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inspire Me</span>
          </button>
        </div>
      </div>

      {/* Dynamic Toast Notice */}
      <AnimatePresence>
        {activeTabNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-30 my-2 py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-400/20 via-purple-900/40 to-indigo-900/20 border border-amber-400/40 text-amber-200 text-xs font-medium flex items-center justify-between shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Sparkle className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>{activeTabNotice}</span>
            </div>
            <span className="text-[10px] text-purple-300/70 font-mono">Bedtime Magic</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          VIEW 1: MADLIB DIARIES (Interactive Storybook Fill)
          ========================================================================= */}
      {viewMode === 'diary' && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto py-4">
          {/* Main Card: Story Blank Paragraph & Canvas */}
          <div className="lg:col-span-8 bg-[#120e2e]/80 border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              {/* Header Title */}
              <div className="text-center mb-6">
                <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  Madlib Diaries
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-purple-200/70 max-w-md mx-auto">
                  Co-create your dream. Fill in the blanks or speak aloud to weave a 3-minute bedtime chronicle.
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
                  </span>{' '}
                  with a gentle sound of &ldquo;{sillySound || 'whisper-hush'}&rdquo;!
                </p>
              </div>

              {/* Tonight's Canvas Preview Box */}
              <div className="mt-6 relative h-40 sm:h-48 w-full rounded-2xl overflow-hidden border border-purple-800/40 bg-black/40 group shadow-inner">
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
                <span>{isGenerating ? 'Weaving Dream...' : 'Generate & Read Story'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                className="w-full sm:w-1/3 py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-wider uppercase border border-amber-400/60 hover:bg-amber-400/10 text-amber-200 flex items-center justify-center gap-2 transition-all"
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSaved ? 'Saved to Vault!' : 'Save Story'}</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Story Settings */}
          <div className="lg:col-span-4 bg-[#110d2c]/90 border border-purple-900/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-purple-900/40 text-slate-200">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-playfair text-lg font-bold">Story Settings</h3>
              </div>

              {/* VOICE TYPE */}
              <div>
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70">
                    BACKGROUND AUDIO
                  </label>
                  <button
                    type="button"
                    onClick={toggleAudioPreview}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{audioPreviewPlaying ? 'Stop' : 'Preview'}</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { id: 'Celestial Hum', icon: '🌌', desc: 'Deep soft cosmic resonance' },
                    { id: 'Purring Galaxy', icon: '⭐', desc: 'Cosmic night warmth' },
                    { id: 'Rain on Glass', icon: '💧', desc: 'Gentle droplet rhythm' },
                    { id: 'Whispering Pines', icon: '🌲', desc: 'Soft breeze in cedar grove' },
                  ].map((audio) => (
                    <button
                      key={audio.id}
                      type="button"
                      onClick={() => {
                        setBackgroundAudio(audio.id as any);
                        const sType =
                          audio.id === 'Rain on Glass'
                            ? 'rain'
                            : audio.id === 'Celestial Hum'
                            ? 'wind'
                            : audio.id === 'Whispering Pines'
                            ? 'crickets'
                            : 'night';
                        ambientSoundEngine.playAmbient(sType as any, 0.4);
                        setAudioPreviewPlaying(true);
                      }}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all border ${
                        backgroundAudio === audio.id
                          ? 'bg-[#1e174b] border-amber-400/60 text-white shadow-md'
                          : 'bg-[#151036]/60 border-purple-900/40 text-slate-300 hover:bg-[#1a1443]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{audio.icon}</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-100">{audio.id}</p>
                          <p className="text-[10px] text-purple-300/60">{audio.desc}</p>
                        </div>
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          backgroundAudio === audio.id ? 'border-amber-400 bg-amber-400' : 'border-slate-500'
                        }`}
                      >
                        {backgroundAudio === audio.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SILLY TO SLEEPY CALM METER */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-purple-300/70 mb-1.5">
                  <span>SILLY-TO-SLEEPY METER</span>
                  <span className="text-amber-300">
                    {sillySleepyMeter <= 2 ? '😄 Silly Giggles' : sillySleepyMeter === 3 ? '✨ Balanced Bedtime' : '🌙 Deep Calming Sleep'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={sillySleepyMeter}
                  onChange={(e) => setSillySleepyMeter(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>1: Giggles</span>
                  <span>3: Cozy</span>
                  <span>5: Deep Slumber</span>
                </div>
              </div>

              {/* DURATION */}
              <div>
                <div className="p-3 rounded-2xl bg-[#151036] border border-purple-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium">Story Length</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800/40 text-amber-300 font-mono text-xs font-bold">
                    <span>3 min</span>
                    <Lock className="w-3 h-3 text-amber-400/80" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Word Bank suggestions */}
            <div className="pt-4 mt-4 border-t border-purple-900/40">
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300/60 block mb-2">
                Quick Word Sparks
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar pr-1">
                {[
                  ...WORD_BANKS.animals.slice(0, 3),
                  ...WORD_BANKS.places.slice(0, 2),
                  ...WORD_BANKS.adjectives.slice(0, 3),
                  ...WORD_BANKS.objects.slice(0, 2),
                ].map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      if (!noun) setNoun(word.toLowerCase());
                      else if (!place) setPlace(word);
                      else if (!adjective) setAdjective(word.toLowerCase());
                      else if (!animal) setAnimal(word.toLowerCase());
                      else setObject(word.toLowerCase());
                      showNotice(`Added: ${word}`);
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
          VIEW 2: CELESTIAL FOCUS MODE (Minimalist Zen Prompting)
          ========================================================================= */}
      {viewMode === 'focus' && (
        <div className="relative z-10 flex-1 flex flex-col justify-between py-6 px-4 sm:px-8 text-center max-w-4xl mx-auto w-full my-auto">
          <div>
            {/* Header Hint */}
            <div className="mb-8">
              <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/50 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider">
                Minimalist Bedtime Weave
              </span>
            </div>

            {/* Centered Large Display Sentence */}
            <div className="font-playfair text-2xl sm:text-4xl md:text-5xl text-white font-bold leading-[1.8] sm:leading-[2] tracking-tight">
              <span>Once upon a </span>

              {/* Time/Place Blank */}
              <span className="inline-block align-middle mx-1.5 my-1">
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="time or place"
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-xl sm:text-3xl md:text-4xl font-medium px-4 py-1 rounded-md shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
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
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-xl sm:text-3xl md:text-4xl font-medium px-4 py-1 rounded-md shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
                />
              </span>

              <span> who danced with the </span>

              {/* Object Blank */}
              <span className="inline-block align-middle mx-1.5 my-1">
                <input
                  type="text"
                  value={object}
                  onChange={(e) => setObject(e.target.value)}
                  placeholder="magical object"
                  className="bg-white text-slate-900 placeholder:text-slate-400 placeholder:italic font-cormorant text-xl sm:text-3xl md:text-4xl font-medium px-4 py-1 rounded-md shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300 text-center min-w-[160px] sm:min-w-[240px] max-w-[320px] transition-all"
                />
              </span>

              <span> ...</span>
            </div>

            {/* Floating Gold Weave Story Button */}
            <div className="mt-10 flex justify-center">
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

          {/* Bottom Floating Presets & Voice Dictation Trigger */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 border-t border-purple-900/30 mt-8">
            <div className="flex items-center flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-[10px] text-purple-300/60 uppercase font-bold tracking-wider">Presets:</span>
              {NARRATIVE_PRESETS.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setNoun(p.noun);
                    setPlace(p.place);
                    setAdjective(p.adjective);
                    setAnimal(p.animal);
                    setObject(p.object);
                    showNotice(`Loaded preset: ${p.title}`);
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shadow-xl ${
                isListening
                  ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-red-500/50'
                  : 'bg-[#3b256d]/80 hover:bg-[#4d328c] border-purple-400/40 text-purple-200 shadow-purple-950/80 hover:scale-105'
              }`}
              title="Voice Prompt Dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="text-xs font-semibold">{isListening ? 'Listening...' : 'Speak Word'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: WORKSHOP OF WONDERS (Silly Slumber Lab)
          ========================================================================= */}
      {viewMode === 'workshop' && (
        <div className="relative z-10 flex-1 flex flex-col justify-between py-2">
          {/* Main Stage Grid */}
          <div className="max-w-5xl mx-auto w-full">
            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-amber-200 tracking-tight">
                The Workshop of Wonders
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-purple-200/70">
                Build a whimsical bedtime story to gently settle your mind for sleep.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: 4 Distinct Themed Input Cards with Colored Left Borders */}
              <div className="lg:col-span-7 space-y-3.5">
                {/* 1. AN ADJECTIVE (Yellow border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-l-2xl" />
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
                      AN ADJECTIVE
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceInput('adjective')}
                      className={`p-1 rounded-md text-xs transition-colors ${
                        isListening && listeningSlot === 'adjective'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={adjective}
                    onChange={(e) => setAdjective(e.target.value)}
                    placeholder="e.g. sleepy, sparkly, wobbly..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 2. AN ANIMAL (Purple border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-400 rounded-l-2xl" />
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-purple-300/80">
                      AN ANIMAL
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceInput('animal')}
                      className={`p-1 rounded-md text-xs transition-colors ${
                        isListening && listeningSlot === 'animal'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={animal}
                    onChange={(e) => setAnimal(e.target.value)}
                    placeholder="e.g. badger, owl, hedgehog..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* 3. A PLACE (Blue border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-sky-400 rounded-l-2xl" />
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-sky-300/80">
                      A PLACE
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceInput('place')}
                      className={`p-1 rounded-md text-xs transition-colors ${
                        isListening && listeningSlot === 'place'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="e.g. marshmallow mountain, star reef..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-sky-400 transition-colors"
                  />
                </div>

                {/* 4. A SILLY SOUND (Pink border) */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg overflow-hidden flex flex-col justify-center">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400 rounded-l-2xl" />
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-pink-300/80">
                      A SILLY SOUND
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleVoiceInput('sound')}
                      className={`p-1 rounded-md text-xs transition-colors ${
                        isListening && listeningSlot === 'sound'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'text-purple-300 hover:text-white'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sillySound}
                    onChange={(e) => setSillySound(e.target.value)}
                    placeholder="e.g. boop, squish, whoosh..."
                    className="w-full bg-[#0d0a24]/80 border border-purple-900/50 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder:text-purple-300/40 focus:outline-none focus:border-pink-400 transition-colors"
                  />
                </div>
              </div>

              {/* Right Column: Generating Cover Art & Narrator Choice */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                {/* Generating Cover Art Box with Animated Portal */}
                <div className="relative bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-5 shadow-lg h-56 sm:h-60 flex flex-col justify-between overflow-hidden">
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
                    <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-amber-400/40 flex items-center justify-center shadow-inner overflow-hidden">
                      <img
                        src={currentCanvas.url}
                        alt="Generating"
                        className="absolute inset-0 w-full h-full object-cover opacity-70 blur-[1px]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/60 via-transparent to-black/80" />
                      <Sparkles className="relative z-10 w-7 h-7 text-amber-300 animate-pulse" />
                    </div>
                    <p className="mt-2 text-xs text-purple-200/70 italic max-w-xs">
                      Brewing up bedtime magic from your words...
                    </p>
                  </div>
                </div>

                {/* Choose Narrator Box */}
                <div className="bg-[#130f2f]/90 border border-purple-900/40 rounded-2xl p-4 shadow-lg">
                  <span className="text-xs font-semibold text-slate-200 block mb-2.5 font-playfair">
                    Choose Bedtime Narrator
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {NARRATORS.map((narrator) => {
                      const isSelected = selectedNarrator === narrator.id;
                      return (
                        <button
                          key={narrator.id}
                          type="button"
                          onClick={() => setSelectedNarrator(narrator.id)}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-purple-900/60 border border-amber-400/80 shadow-md'
                              : 'bg-[#0e0a27] border border-purple-900/30 hover:bg-purple-950/50'
                          }`}
                          title={`${narrator.name}: ${narrator.desc}`}
                        >
                          <span className="text-lg mb-0.5">{narrator.emoji}</span>
                          <span className="text-[10px] font-medium text-slate-200 text-center leading-tight truncate w-full">
                            {narrator.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating Music & Player Bar */}
          <div className="mt-6 max-w-2xl mx-auto w-full">
            <div className="bg-[#130f2e]/95 border border-purple-800/40 rounded-full py-2 px-5 shadow-2xl flex items-center justify-between gap-4">
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

              {/* Progress Bar & Status */}
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 font-mono mb-1">
                  READY TO WEAVE BEDTIME TALE
                </span>
                <div className="w-full bg-purple-950/80 h-1.5 rounded-full overflow-hidden border border-purple-900/60">
                  <div className="h-full bg-amber-400 rounded-full w-2/3 transition-all" />
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
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: MADLIB ARCADE & THEMED STORY PACKS
          ========================================================================= */}
      {viewMode === 'arcade' && (
        <div className="relative z-10 max-w-5xl mx-auto w-full my-auto py-4 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-4xl font-playfair font-bold text-amber-200">
              Themed Madlib Story Packs
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/70">
              Choose a bedtime adventure template and click word chips or type your own!
            </p>
          </div>

          {/* Template Selection Carousel Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {MADLIBS_TEMPLATES.map((tmpl, idx) => {
              const isSelected = selectedTemplateIndex === idx;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateIndex(idx);
                    setActiveArcadeFieldKey('');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 scale-[1.02]'
                      : 'bg-purple-950/40 text-slate-300 border-purple-900/50 hover:bg-purple-900/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{tmpl.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Template Form Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#120e2e]/90 border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            {/* Left side: Fields */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                <div>
                  <h3 className="font-playfair text-lg font-bold text-white">{currentTemplate.title}</h3>
                  <p className="text-xs text-purple-300/70">Theme: {currentTemplate.theme} • 3-Min Bedtime Story</p>
                </div>
                <button
                  type="button"
                  onClick={handleRandomizePreset}
                  className="p-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-amber-300 text-xs flex items-center gap-1 border border-purple-800"
                >
                  <Dice5 className="w-3.5 h-3.5" />
                  <span>Auto-Fill</span>
                </button>
              </div>

              {/* Template Input Fields */}
              <div className="space-y-3">
                {currentTemplate.fields.map((f) => {
                  const val = arcadeAnswers[f.key] || '';
                  const isActive = activeArcadeFieldKey === f.key;

                  return (
                    <div
                      key={f.key}
                      onClick={() => setActiveArcadeFieldKey(f.key)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-purple-950/80 border-amber-400/70 shadow-md'
                          : 'bg-[#0d0a24]/80 border-purple-900/40 hover:border-purple-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                          {f.label}
                        </label>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVoiceInput(`arcade:${f.key}`);
                          }}
                          className={`p-1 rounded text-xs ${
                            isListening && listeningSlot === `arcade:${f.key}`
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          <Mic className="w-3 h-3" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={val}
                        onChange={(e) => {
                          const v = e.target.value;
                          setArcadeAnswers((prev) => ({ ...prev, [f.key]: v }));
                        }}
                        placeholder={f.placeholder}
                        className="w-full bg-[#151036] border border-purple-900/60 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm text-slate-100 placeholder:text-purple-400/40 focus:outline-none focus:border-amber-400"
                      />

                      {/* Quick Suggestion Chips */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {f.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setArcadeAnswers((prev) => ({ ...prev, [f.key]: sug }));
                              showNotice(`Selected "${sug}"`);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] transition-colors border ${
                              val === sug
                                ? 'bg-amber-400 text-slate-950 font-bold border-amber-300'
                                : 'bg-purple-950/60 text-purple-200 border-purple-800/40 hover:bg-purple-900'
                            }`}
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right side: Live Story Blueprint Preview & Weave Action */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="bg-[#0e0a27] border border-purple-900/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" />
                  <span>Story Blueprint</span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  Your story will star{' '}
                  <strong className="text-amber-300">
                    {HEROES.find((h) => h.id === currentTemplate.suggestedHeroId)?.name || 'Nova'}
                  </strong>{' '}
                  with customized peaceful scenes, gentle sleep affirmations, and ambient music.
                </p>

                {/* Cover art thumbnail */}
                <div className="relative h-28 rounded-xl overflow-hidden border border-purple-800/40">
                  <img
                    src={currentCanvas.url}
                    alt={currentCanvas.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-3 text-[10px] text-amber-300 font-mono">
                    CANVAS: {currentCanvas.title}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateArcadeStory}
                  disabled={isGenerating}
                  className="w-full py-3.5 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase bg-[#FFD54F] hover:bg-[#ffe082] text-[#120e2e] flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <Wand2 className={`w-4 h-4 text-[#120e2e] ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating ? 'Weaving Story...' : 'Launch Bedtime Tale'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: MADLIB VAULT (My Created Madlibs)
          ========================================================================= */}
      {viewMode === 'vault' && (
        <div className="relative z-10 max-w-5xl mx-auto w-full my-auto py-4 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-purple-900/40">
            <div>
              <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-white">
                My Bedtime Madlib Vault
              </h2>
              <p className="text-xs text-purple-300/70">
                {vaultItems.length} created bedtime stories saved in your collection
              </p>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('diary')}
              className="px-4 py-2 rounded-full bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-300 shadow-md transition-transform hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Weave New Tale</span>
            </button>
          </div>

          {vaultItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#120e2e]/60 border border-purple-900/30 space-y-4">
              <div className="w-14 h-14 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center mx-auto text-amber-300">
                <Bookmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-playfair text-lg font-bold text-white">No Madlib Tales in Vault Yet</h3>
                <p className="text-xs text-purple-200/70 mt-1 max-w-sm mx-auto">
                  Fill in fun cutout words or choose a story pack to weave your very first bedtime chronicle!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('diary')}
                className="px-5 py-2.5 rounded-full bg-[#FFD54F] text-slate-950 font-bold text-xs hover:bg-[#ffe082] transition-colors"
              >
                Create Madlib Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vaultItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onStoryGenerated(item.story)}
                  className="group relative p-5 rounded-2xl bg-[#120e2e]/80 hover:bg-[#19143d] border border-purple-900/40 hover:border-amber-400/60 shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] text-purple-300/70 font-mono">
                      <span className="uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                        {item.mode}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>

                    <h4 className="font-playfair text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap gap-1">
                      {item.keywords.slice(0, 4).map((kw, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-950/60 border border-indigo-800/40 text-indigo-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-purple-900/30 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteVaultItem(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                      title="Delete from vault"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 mt-6 pt-4 border-t border-purple-950/50 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-300/40 gap-2">
        <span className="font-playfair text-slate-300/70">Bedtime Chronicles • Madlib Suite v5</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>COPPA Safe</span>
          <span>•</span>
          <span>Ambient Audio Sync</span>
          <span>•</span>
          <span>3-Min Pace</span>
        </div>
      </div>
    </div>
  );
};
