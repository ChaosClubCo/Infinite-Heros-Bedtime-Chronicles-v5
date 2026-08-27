import React, { useState, useRef } from 'react';
import {
  Image,
  Sparkles,
  Download,
  Sliders,
  X,
  Layers,
  Wand2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { generateOrEditImage, GeneratedImageResult } from '../services/geminiImageService';
import { VoiceInputButton } from './VoiceInputButton';

interface FlashImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage?: (imageUrl: string) => void;
  initialImage?: string;
}

const STYLE_PRESETS = [
  {
    name: 'Whimsical Watercolor',
    promptSnippet: 'soft whimsical watercolor and gouache storybook illustration, gentle pastel colors, starry starlight highlights',
  },
  {
    name: 'Cosmic Nebula',
    promptSnippet: 'magical celestial cosmic painting with deep purple and indigo nebula, glowing stars, sparkling golden dust',
  },
  {
    name: 'Cozy Storybook',
    promptSnippet: 'classic bedtime storybook art, warm golden ambient lanterns, comforting woodland fairytale aesthetic',
  },
  {
    name: 'Bioluminescent Dreams',
    promptSnippet: 'ethereal glowing fantasy illustration, soft cyan and violet glow, gentle night luminescence',
  },
];

const ASPECT_RATIOS: { id: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'; label: string }[] = [
  { id: '1:1', label: 'Square (1:1)' },
  { id: '4:3', label: 'Classic (4:3)' },
  { id: '16:9', label: 'Widescreen (16:9)' },
  { id: '3:4', label: 'Portrait (3:4)' },
  { id: '9:16', label: 'Story (9:16)' },
];

export const FlashImageStudioModal: React.FC<FlashImageStudioModalProps> = ({
  isOpen,
  onClose,
  onApplyImage,
  initialImage,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>(initialImage ? 'edit' : 'create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '3:4' | '4:3' | '9:16' | '16:9'>('4:3');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K'>('1K');
  const [referenceImage, setReferenceImage] = useState<string | null>(initialImage || null);
  const [referenceMimeType, setReferenceMimeType] = useState<string>('image/png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the bedtime illustration');
      return;
    }

    if (activeTab === 'edit' && !referenceImage) {
      setError('Please upload or select an image to edit');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      const generated = await generateOrEditImage({
        prompt,
        aspectRatio,
        imageSize,
        referenceImage: activeTab === 'edit' && referenceImage ? referenceImage : undefined,
        referenceMimeType: activeTab === 'edit' && referenceImage ? referenceMimeType : undefined,
      });

      setResult(generated);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to generate/edit image with Gemini Flash Image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      setActiveTab('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleUseAsHeroOrCover = () => {
    if (!result || !onApplyImage) return;
    onApplyImage(result.imageUrl);
    setSuccessMessage('Artwork successfully applied!');
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-teal-500/30 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        {/* Glow Header */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600/20 border border-teal-500/30 text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Flash Image Studio
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-950 text-teal-400 border border-teal-700/50">
                  gemini-3.1-flash-image-preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Create new bedtime illustrations or edit existing pictures with text prompts
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

        {/* Mode Tabs */}
        <div className="mt-4 flex rounded-2xl bg-slate-950/60 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'create'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Create New Image
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'edit'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Edit Existing Image
          </button>
        </div>

        {/* Edit Reference Image Slot */}
        {activeTab === 'edit' && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {referenceImage ? (
                <img
                  src={referenceImage}
                  alt="Original"
                  className="w-16 h-16 rounded-xl object-cover border border-teal-500/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                  <Image className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {referenceImage ? 'Base Image Loaded' : 'Upload Image to Edit'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {referenceImage
                    ? 'Gemini will modify this image based on your text prompt'
                    : 'Select a bedtime illustration or photo to edit'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-teal-300 border border-slate-700 transition"
              >
                {referenceImage ? 'Change Image' : 'Upload Image'}
              </button>
            </div>
          </div>
        )}

        {/* Style Presets for Creation */}
        {activeTab === 'create' && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Bedtime Art Styles
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((st) => (
                <button
                  key={st.name}
                  type="button"
                  onClick={() => setPrompt((prev) => `${prev} Style: ${st.promptSnippet}`)}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/40 text-left transition"
                >
                  <p className="text-xs font-semibold text-teal-300">{st.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              {activeTab === 'create' ? 'Image Creation Prompt' : 'Editing Instruction Prompt'}
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
            placeholder={
              activeTab === 'create'
                ? "Describe your bedtime scene (e.g., 'A cozy bear sleeping on a glowing crescent moon surrounded by twinkling stardust')..."
                : "Describe your edits (e.g., 'Add a smiling crescent moon in the sky', 'Make the scene look like a dreamy watercolor', 'Add glowing fireflies')..."
            }
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-teal-900/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-500 resize-none"
          />
        </div>

        {/* Aspect Ratio & Resolution */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1.5">
              {ASPECT_RATIOS.slice(0, 3).map((ar) => (
                <button
                  key={ar.id}
                  type="button"
                  onClick={() => setAspectRatio(ar.id)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                    aspectRatio === ar.id
                      ? 'bg-teal-900/40 border-teal-500 text-teal-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">Output Size</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['512px', '1K', '2K'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setImageSize(sz)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition ${
                    imageSize === sz
                      ? 'bg-teal-900/40 border-teal-500 text-teal-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
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

        {/* Action Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isGenerating
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-900/40'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                {activeTab === 'create' ? 'Generating Bedtime Artwork...' : 'Applying Edits with Gemini Flash...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {activeTab === 'create' ? 'Generate Image' : 'Apply Edits to Image'} (gemini-3.1-flash-image-preview)
              </>
            )}
          </button>
        </div>

        {/* Result Image */}
        {result && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-teal-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-teal-200">Generated Artwork Result</p>
                <p className="text-[10px] text-slate-400 font-mono">{result.modelUsed}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={result.imageUrl}
                  download="bedtime-illustration.png"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                {onApplyImage && (
                  <button
                    type="button"
                    onClick={handleUseAsHeroOrCover}
                    className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to App</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center bg-black/40 max-h-[380px]">
              <img
                src={result.imageUrl}
                alt="Generated"
                className="w-full h-auto max-h-[380px] object-contain"
              />
            </div>

            {result.description && (
              <p className="text-xs text-slate-300 italic">{result.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
