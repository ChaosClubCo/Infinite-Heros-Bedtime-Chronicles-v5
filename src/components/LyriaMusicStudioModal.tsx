import React, { useState, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  Sparkles,
  Download,
  Upload,
  Volume2,
  X,
  Sliders,
  Check,
} from 'lucide-react';
import { generateBedtimeMusic, GeneratedMusicResult } from '../services/geminiMusicService';
import { VoiceInputButton } from './VoiceInputButton';

interface LyriaMusicStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetAmbientMusic?: (audioUrl: string, title: string) => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Moonlit Lullaby',
    desc: 'Soft acoustic guitar and celestial celesta for deep sleep',
    prompt: 'Soothing bedtime lullaby with gentle classical acoustic guitar, ethereal celesta, warm ambient string pads, 60 bpm, calming and gentle for young children to fall asleep',
    mode: 'clip' as const,
  },
  {
    title: 'Cosmic Starlight Ambient',
    desc: 'Deep warm synth pad with soft twinkling chimes',
    prompt: 'Cosmic sleep ambient music, deep warm sub-bass drone, twinkling crystal chimes, relaxing starlight atmosphere, dreamy peaceful tempo',
    mode: 'pro' as const,
  },
  {
    title: 'Enchanted Forest Harp',
    desc: 'Whispering winds, soft harp glissandos and nighttime birds',
    prompt: 'Fairytale bedtime music with soothing Celtic harp, soft wooden flute, gentle crickets in the background, magical and serene',
    mode: 'clip' as const,
  },
  {
    title: 'Ocean Wave Melody',
    desc: 'Gentle rhythmic piano layered over soft rolling surf',
    prompt: 'Peaceful bedtime piano melody with soft ocean wave resonance, slow hypnotic rhythm, gentle relaxation for toddlers and kids',
    mode: 'pro' as const,
  },
];

export const LyriaMusicStudioModal: React.FC<LyriaMusicStudioModalProps> = ({
  isOpen,
  onClose,
  onSetAmbientMusic,
}) => {
  const [prompt, setPrompt] = useState('');
  const [modelType, setModelType] = useState<'clip' | 'pro'>('clip');
  const [inspirationImage, setInspirationImage] = useState<string | null>(null);
  const [inspirationMimeType, setInspirationMimeType] = useState<string>('image/jpeg');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<GeneratedMusicResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the bedtime music');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setIsPlaying(false);

    try {
      const result = await generateBedtimeMusic({
        prompt,
        modelType,
        imageBase64: inspirationImage || undefined,
        imageMimeType: inspirationImage ? inspirationMimeType : undefined,
      });

      setGenerationResult(result);
    } catch (err: any) {
      console.error('Lyria generation error:', err);
      setError(err.message || 'Failed to generate music with Lyria. Please ensure your API key has access to Lyria preview models.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setInspirationMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setInspirationImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleApplyAsAmbience = () => {
    if (!generationResult || !onSetAmbientMusic) return;
    onSetAmbientMusic(generationResult.audioUrl, prompt.slice(0, 30) || 'Custom Lyria Music');
    setSuccessMessage('Bedtime music applied as active ambient soundscape!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        {/* Glow Header */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Lyria Bedtime Music Studio
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-purple-950 text-purple-400 border border-purple-700/50">
                  Lyria 3
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate original bedtime lullabies & soothing ambient tracks with Google Lyria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Selector */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setModelType('clip')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              modelType === 'clip'
                ? 'bg-purple-900/40 border-purple-500 ring-2 ring-purple-500/30'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-200">Lyria 3 Clip</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                lyria-3-clip-preview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Short bedtime themes & sleep cues (up to 30s)</p>
          </button>

          <button
            type="button"
            onClick={() => setModelType('pro')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              modelType === 'pro'
                ? 'bg-indigo-900/40 border-indigo-500 ring-2 ring-indigo-500/30'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-indigo-200">Lyria 3 Pro</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">
                lyria-3-pro-preview
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Full-length soothing bedtime compositions</p>
          </button>
        </div>

        {/* Presets */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Quick Bedtime Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  setPrompt(preset.prompt);
                  setModelType(preset.mode);
                }}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-left transition group"
              >
                <p className="text-xs font-semibold text-purple-300 group-hover:text-purple-200">{preset.title}</p>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{preset.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Music Prompt Description
            </label>
            <VoiceInputButton
              onTranscript={(transcript) => {
                setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
              }}
            />
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the desired bedtime music (instruments, mood, tempo, feeling, e.g., 'Soft music box melody under a starry sky with gentle rainfall')..."
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-purple-900/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 resize-none"
          />
        </div>

        {/* Optional Image Inspiration (Image-to-Music) */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-950/40 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {inspirationImage ? (
              <img
                src={inspirationImage}
                alt="Inspiration"
                className="w-12 h-12 rounded-xl object-cover border border-purple-500/40"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                <Upload className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {inspirationImage ? 'Inspiration Image Attached' : 'Inspiration Image (Optional)'}
              </p>
              <p className="text-[10px] text-slate-400">
                Lyria can generate music inspired by your bedtime story illustration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {inspirationImage ? (
              <button
                type="button"
                onClick={() => setInspirationImage(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-300 text-xs hover:bg-slate-700 transition"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-purple-300 border border-slate-700 transition"
              >
                Upload Artwork
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                Composing Bedtime Music with {modelType === 'pro' ? 'Lyria 3 Pro' : 'Lyria 3 Clip'}...
              </>
            ) : (
              <>
                <Music className="w-4 h-4" />
                Generate Bedtime Music ({modelType === 'pro' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview'})
              </>
            )}
          </button>
        </div>

        {/* Generated Result Audio Player */}
        {generationResult && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-purple-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md transition"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <div>
                  <p className="text-xs font-bold text-purple-200">Generated Bedtime Track</p>
                  <p className="text-[10px] text-slate-400 font-mono">{generationResult.modelUsed}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={generationResult.audioUrl}
                  download="bedtime-music-lyria.wav"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WAV</span>
                </a>
                {onSetAmbientMusic && (
                  <button
                    type="button"
                    onClick={handleApplyAsAmbience}
                    className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Set as Ambience</span>
                  </button>
                )}
              </div>
            </div>

            <audio
              ref={audioRef}
              src={generationResult.audioUrl}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              controls
              className="w-full h-9 mt-2"
            />

            {generationResult.lyrics && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <p className="font-semibold text-purple-300 mb-1">Generated Notes / Lyrics:</p>
                <p className="italic">{generationResult.lyrics}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
