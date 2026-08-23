import React, { useState } from 'react';
import { Story, AgeRange } from '../types';
import { generateCustomBedtimeStory } from '../services/aiStoryGenerator';
import { ArrowLeft, Sparkles, Mic, MicOff, RefreshCw } from 'lucide-react';

interface MadlibDiariesViewProps {
  onBack: () => void;
  onStoryGenerated: (story: Story) => void;
  childName?: string;
  childAge?: number;
}

interface MadlibSentenceTemplate {
  id: string;
  title: string;
  prefix1: string;
  slot1: { key: string; label: string; placeholder: string; suggestions: string[] };
  prefix2: string;
  slot2: { key: string; label: string; placeholder: string; suggestions: string[] };
  prefix3: string;
  slot3: { key: string; label: string; placeholder: string; suggestions: string[] };
  suffix: string;
}

const TEMPLATES: MadlibSentenceTemplate[] = [
  {
    id: 'dancing-creature',
    title: 'Dancing Creature',
    prefix1: 'Once upon a',
    slot1: {
      key: 'time_place',
      label: 'Time or Place',
      placeholder: 'time/place',
      suggestions: ['starlit midnight', 'cozy bedtime', 'dreamy forest', 'glowing lagoon'],
    },
    prefix2: ', there was a',
    slot2: {
      key: 'creature',
      label: 'Magical Creature',
      placeholder: 'creature',
      suggestions: ['silver moon fox', 'baby star whale', 'fluffy cloud kitten', 'singing owl'],
    },
    prefix3: 'who danced with the',
    slot3: {
      key: 'object',
      label: 'Magical Object',
      placeholder: 'object',
      suggestions: ['sparkling comet', 'golden music box', 'moonbeam blanket', 'glowing acorn'],
    },
    suffix: '...',
  },
  {
    id: 'cosmic-express',
    title: 'Cosmic Express',
    prefix1: 'Across the',
    slot1: {
      key: 'celestial_road',
      label: 'Cosmic Way',
      placeholder: 'celestial road',
      suggestions: ['Milky Way', 'starlight bridge', 'sea of clouds', 'crystal rainbow'],
    },
    prefix2: ', sailed a gentle',
    slot2: {
      key: 'vehicle_captain',
      label: 'Traveler',
      placeholder: 'dream traveler',
      suggestions: ['whistling train', 'moon sailboat', 'sleeping dragon', 'flying teacup'],
    },
    prefix3: 'carrying a secret basket of',
    slot3: {
      key: 'bedtime_treat',
      label: 'Cozy Surprise',
      placeholder: 'sleepy surprise',
      suggestions: ['warm star-milk', 'honey raindrops', 'fluffy marshmallow pillows', 'sweet dreams'],
    },
    suffix: '...',
  },
  {
    id: 'secret-castle',
    title: 'Secret Castle',
    prefix1: 'High atop the',
    slot1: {
      key: 'castle_location',
      label: 'Castle Hill',
      placeholder: 'dreamy peak',
      suggestions: ['cotton candy mountain', 'whispering pine', 'sleeping cloud', 'moonbeam tower'],
    },
    prefix2: ', lived a kind',
    slot2: {
      key: 'castle_keeper',
      label: 'Castle Friend',
      placeholder: 'gentle guardian',
      suggestions: ['star fairy', 'cozy hedgehog knight', 'sleepy prince', 'glowing bear'],
    },
    prefix3: 'who watched over the',
    slot3: {
      key: 'treasure',
      label: 'Night Treasure',
      placeholder: 'shining treasure',
      suggestions: ['North Star sparkle', 'lullaby harp', 'golden dream key', 'sleeping lantern'],
    },
    suffix: '...',
  },
];

export const MadlibDiariesView: React.FC<MadlibDiariesViewProps> = ({
  onBack,
  onStoryGenerated,
  childName = 'Little Explorer',
  childAge = 5,
}) => {
  const [templateIndex, setTemplateIndex] = useState(0);
  const currentTemplate = TEMPLATES[templateIndex];

  const [inputs, setInputs] = useState<Record<string, string>>({
    [currentTemplate.slot1.key]: '',
    [currentTemplate.slot2.key]: '',
    [currentTemplate.slot3.key]: '',
  });

  const [isListening, setIsListening] = useState(false);
  const [isWeaving, setIsWeaving] = useState(false);

  const handleInputChange = (key: string, val: string) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const handleRandomize = () => {
    const s1 = currentTemplate.slot1.suggestions[Math.floor(Math.random() * currentTemplate.slot1.suggestions.length)];
    const s2 = currentTemplate.slot2.suggestions[Math.floor(Math.random() * currentTemplate.slot2.suggestions.length)];
    const s3 = currentTemplate.slot3.suggestions[Math.floor(Math.random() * currentTemplate.slot3.suggestions.length)];

    setInputs({
      [currentTemplate.slot1.key]: s1,
      [currentTemplate.slot2.key]: s2,
      [currentTemplate.slot3.key]: s3,
    });
  };

  const toggleVoiceInput = (slotKey?: string) => {
    const targetSlot = slotKey || currentTemplate.slot1.key;
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      // Fallback: pick a funny suggestion
      const suggestions =
        targetSlot === currentTemplate.slot1.key
          ? currentTemplate.slot1.suggestions
          : targetSlot === currentTemplate.slot2.key
          ? currentTemplate.slot2.suggestions
          : currentTemplate.slot3.suggestions;
      const pick = suggestions[Math.floor(Math.random() * suggestions.length)];
      handleInputChange(targetSlot, pick);
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
          handleInputChange(targetSlot, transcript.trim());
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

  const handleWeaveStory = async () => {
    setIsWeaving(true);

    const val1 = inputs[currentTemplate.slot1.key] || currentTemplate.slot1.suggestions[0];
    const val2 = inputs[currentTemplate.slot2.key] || currentTemplate.slot2.suggestions[0];
    const val3 = inputs[currentTemplate.slot3.key] || currentTemplate.slot3.suggestions[0];

    const madlibPrompt = `${currentTemplate.prefix1} ${val1}, there was a ${val2} who danced with the ${val3}.`;

    try {
      const generated = generateCustomBedtimeStory({
        heroId: 'hero-1',
        theme: 'wonder',
        mode: 'madlibs',
        ageRange: (childAge <= 4 ? '2-4' : childAge <= 6 ? '4-6' : childAge <= 8 ? '6-8' : '8-10') as AgeRange,
        childName,
        customPrompt: `Madlib: ${madlibPrompt}`,
        setting: val1,
        sidekick: val2,
        problem: `finding the lost sparkle of the ${val3}`,
      });

      generated.title = `${val2.charAt(0).toUpperCase() + val2.slice(1)} and the ${val3.charAt(0).toUpperCase() + val3.slice(1)}`;
      generated.summary = `A cozy bedtime tale woven from your Madlib words: set during ${val1}, following a ${val2} and a magical ${val3}.`;
      generated.coverImage = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop';

      onStoryGenerated(generated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsWeaving(false);
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-between p-4 sm:p-8 bg-gradient-to-b from-[#1b103c]/90 via-[#120b2b]/95 to-[#09061c] rounded-3xl border border-purple-900/30 overflow-hidden select-none">
      
      {/* Background Starry Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/5 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
        
        {/* Subtle Star Dots */}
        {[
          { top: '10%', left: '15%' },
          { top: '15%', left: '78%' },
          { top: '25%', left: '82%' },
          { top: '35%', left: '14%' },
          { top: '48%', left: '88%' },
          { top: '74%', left: '8%' },
          { top: '82%', left: '84%' },
          { top: '90%', left: '42%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-200/70 rounded-full animate-twinkle"
            style={{ top: pos.top, left: pos.left, animationDelay: `${i * 0.7}s` }}
          />
        ))}
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white transition-transform group-hover:-translate-x-1" />
          <h1 className="text-xl sm:text-2xl font-normal font-playfair tracking-wide text-slate-100">
            Madlib Diaries
          </h1>
        </button>

        {/* Template Selector & Randomize Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-950/70 hover:bg-purple-900 border border-purple-800/60 text-purple-200 transition-colors"
            title="Randomize words"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inspire Me</span>
          </button>
        </div>
      </div>

      {/* Center Stage Sentence (Exact layout of Image 2) */}
      <div className="relative z-10 max-w-4xl mx-auto my-auto px-2 sm:px-6 py-12 text-center">
        
        {/* Large Display Sentence with White Input Boxes */}
        <div className="font-playfair text-3xl sm:text-5xl md:text-6xl text-white font-bold leading-[1.6] sm:leading-[1.7] tracking-tight">
          <span>{currentTemplate.prefix1} </span>

          {/* Slot 1 Input */}
          <span className="inline-block align-middle mx-1.5 sm:mx-2 my-1">
            <input
              type="text"
              value={inputs[currentTemplate.slot1.key] || ''}
              onChange={(e) => handleInputChange(currentTemplate.slot1.key, e.target.value)}
              placeholder={currentTemplate.slot1.placeholder}
              className="bg-white text-slate-900 placeholder:text-slate-400/80 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1 sm:py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300/60 transition-all text-center min-w-[140px] sm:min-w-[200px] max-w-[280px]"
            />
          </span>

          <span>{currentTemplate.prefix2} </span>

          {/* Slot 2 Input */}
          <span className="inline-block align-middle mx-1.5 sm:mx-2 my-1">
            <input
              type="text"
              value={inputs[currentTemplate.slot2.key] || ''}
              onChange={(e) => handleInputChange(currentTemplate.slot2.key, e.target.value)}
              placeholder={currentTemplate.slot2.placeholder}
              className="bg-white text-slate-900 placeholder:text-slate-400/80 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1 sm:py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300/60 transition-all text-center min-w-[140px] sm:min-w-[220px] max-w-[300px]"
            />
          </span>

          <span> {currentTemplate.prefix3} </span>

          {/* Slot 3 Input */}
          <span className="inline-block align-middle mx-1.5 sm:mx-2 my-1">
            <input
              type="text"
              value={inputs[currentTemplate.slot3.key] || ''}
              onChange={(e) => handleInputChange(currentTemplate.slot3.key, e.target.value)}
              placeholder={currentTemplate.slot3.placeholder}
              className="bg-white text-slate-900 placeholder:text-slate-400/80 placeholder:italic font-cormorant text-2xl sm:text-4xl md:text-5xl font-medium px-4 py-1 sm:py-1.5 rounded-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-300/60 transition-all text-center min-w-[140px] sm:min-w-[200px] max-w-[280px]"
            />
          </span>

          <span> {currentTemplate.suffix}</span>
        </div>

        {/* Action Button: Weave Story */}
        <div className="mt-10 sm:mt-12 flex justify-center">
          <button
            type="button"
            id="weave-story-btn"
            onClick={handleWeaveStory}
            disabled={isWeaving}
            className="flex items-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-widest bg-[#a38753] hover:bg-[#b89a62] text-[#1c1308] shadow-2xl shadow-amber-950/80 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isWeaving ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-[#1c1308]" />
                <span>Weaving Story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#1c1308]" />
                <span>Weave Story</span>
              </>
            )}
          </button>
        </div>

        {/* Word suggestions pill cloud */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
          <span className="text-xs text-purple-300/60">Quick Word Bank:</span>
          {[
            ...currentTemplate.slot1.suggestions.slice(0, 2),
            ...currentTemplate.slot2.suggestions.slice(0, 2),
            ...currentTemplate.slot3.suggestions.slice(0, 2),
          ].map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => {
                if (!inputs[currentTemplate.slot1.key]) handleInputChange(currentTemplate.slot1.key, word);
                else if (!inputs[currentTemplate.slot2.key]) handleInputChange(currentTemplate.slot2.key, word);
                else handleInputChange(currentTemplate.slot3.key, word);
              }}
              className="px-2.5 py-1 rounded-full bg-purple-950/50 hover:bg-purple-900 border border-purple-800/40 text-purple-200 text-xs font-serif transition-colors"
            >
              + {word}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Floating Voice Button (Bottom Right from Image 2) */}
      <div className="relative z-10 flex items-center justify-between pt-4">
        {/* Switch Template Chips */}
        <div className="flex items-center gap-2">
          {TEMPLATES.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTemplateIndex(idx);
                setInputs({
                  [TEMPLATES[idx].slot1.key]: '',
                  [TEMPLATES[idx].slot2.key]: '',
                  [TEMPLATES[idx].slot3.key]: '',
                });
              }}
              className={`px-3 py-1 rounded-full text-xs font-serif transition-all ${
                templateIndex === idx
                  ? 'bg-amber-400/90 text-slate-950 font-bold shadow-md'
                  : 'bg-purple-950/60 text-purple-300 hover:text-white border border-purple-900/60'
              }`}
            >
              {t.title}
            </button>
          ))}
        </div>

        {/* Floating Voice / Mic Icon (Glowing Violet Circle) */}
        <button
          type="button"
          onClick={() => toggleVoiceInput()}
          className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all shadow-xl ${
            isListening
              ? 'bg-red-600 border-red-400 text-white animate-pulse shadow-red-500/50'
              : 'bg-[#3b256d]/80 hover:bg-[#4d328c] border-purple-400/30 text-purple-200 shadow-purple-950/60 hover:scale-105'
          }`}
          title="Voice prompt dictation"
        >
          {isListening ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5 text-purple-200" />
          )}
        </button>
      </div>
    </div>
  );
};
