import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  Sparkles,
  Download,
  Upload,
  Sliders,
  X,
  Film,
  Layers,
  Loader2,
} from 'lucide-react';
import {
  startTextToVideo,
  startAnimateImage,
  pollVideoStatus,
  downloadGeneratedVideoBlob,
} from '../services/geminiVideoService';
import { VoiceInputButton } from './VoiceInputButton';

interface VeoVideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string;
}

const VIDEO_PRESETS = [
  {
    title: 'Twinkling Starlight River',
    prompt: 'Cinematic bedtime animation of a glowing starlight river flowing peacefully under dancing auroras and constellations, gentle water motion',
  },
  {
    title: 'Sleeping Cloud Castle',
    prompt: 'Ethereal pastel clouds drifting slowly around a crescent moon and cozy floating castle in warm sunset hues',
  },
  {
    title: 'Magical Firefly Meadow',
    prompt: 'Gentle nighttime breeze swaying soft grass with glowing golden fireflies pulsing in sync with calm breathing rhythms',
  },
  {
    title: 'Peaceful Cosmic Voyage',
    prompt: 'Slow gentle panning view of a sleeping spaceship soaring past pastel nebulas and smiling star clusters',
  },
];

export const VeoVideoStudioModal: React.FC<VeoVideoStudioModalProps> = ({
  isOpen,
  onClose,
  initialImage,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'animate'>(initialImage ? 'animate' : 'text');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');

  // Generation status
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [operationName, setOperationName] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const startPolling = (opName: string) => {
    setStatusMessage('Veo 3 model is rendering frames and lighting (this may take 30-90 seconds)...');

    const checkStatus = async () => {
      try {
        const res = await pollVideoStatus(opName);
        if (res.done) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          if (res.hasError || res.error) {
            setError(`Video generation failed: ${res.error?.message || 'Provider error'}`);
            setIsProcessing(false);
            return;
          }

          setStatusMessage('Downloading rendered video stream...');
          const blob = await downloadGeneratedVideoBlob(opName);
          const url = URL.createObjectURL(blob);
          setVideoBlobUrl(url);
          setIsProcessing(false);
          setStatusMessage('Video generated successfully!');
        } else {
          setStatusMessage('Veo 3 neural renderer active... calculating cinematic starlight physics...');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    pollIntervalRef.current = window.setInterval(checkStatus, 5000);
  };

  const handleStartGeneration = async () => {
    if (!prompt.trim()) {
      setError('Please provide a video prompt or motion description');
      return;
    }

    if (activeTab === 'animate' && !uploadedImage) {
      setError('Please upload an image to animate into video');
      return;
    }

    setError(null);
    setVideoBlobUrl(null);
    setIsProcessing(true);
    setStatusMessage('Initiating video generation with Veo 3...');

    try {
      let opName: string;
      if (activeTab === 'animate' && uploadedImage) {
        opName = await startAnimateImage({
          imageBase64: uploadedImage,
          imageMimeType,
          prompt,
          aspectRatio,
          resolution,
        });
      } else {
        opName = await startTextToVideo({
          prompt,
          aspectRatio,
          resolution,
        });
      }

      setOperationName(opName);
      startPolling(opName);
    } catch (err: any) {
      console.error('Generation initiation error:', err);
      setError(err.message || 'Failed to start video generation with Veo 3.');
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setActiveTab('animate');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        {/* Glow Header */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Veo 3 Bedtime Video Studio
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-700/50">
                  veo-3.1-fast-generate-preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate soothing animated bedtime videos or animate photos into calming bedtime scenes
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
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'text'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Text to Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('animate')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'animate'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Animate Photo into Video
          </button>
        </div>

        {/* Animate Photo Uploader */}
        {activeTab === 'animate' && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Original"
                  className="w-16 h-16 rounded-xl object-cover border border-blue-500/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                  <Upload className="w-6 h-6" />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {uploadedImage ? 'Base Photo Ready for Animation' : 'Upload a Photo to Animate'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {uploadedImage
                    ? 'Veo will animate this image with natural, gentle motion'
                    : 'Choose a bedtime story illustration or portrait'}
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 border border-slate-700 transition"
              >
                {uploadedImage ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
          </div>
        )}

        {/* Presets for Text-to-Video */}
        {activeTab === 'text' && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Bedtime Video Ideas
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_PRESETS.map((vp) => (
                <button
                  key={vp.title}
                  type="button"
                  onClick={() => setPrompt(vp.prompt)}
                  className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/40 text-left transition"
                >
                  <p className="text-xs font-semibold text-blue-300">{vp.title}</p>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{vp.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Input */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              {activeTab === 'text' ? 'Video Scene Description' : 'Animation Motion Prompt'}
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
              activeTab === 'text'
                ? "Describe the peaceful bedtime video (e.g., 'A cozy bear drifting on a floating cloud under a soft glowing aurora with twinkling stars')..."
                : "Describe how to animate the scene (e.g., 'Gently animate floating stardust particles, soft breathing chest movement, and twinkling nighttime lights')..."
            }
            rows={3}
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-blue-900/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500 resize-none"
          />
        </div>

        {/* Aspect Ratio (16:9 landscape vs 9:16 portrait) & Resolution */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                  aspectRatio === '16:9'
                    ? 'bg-blue-900/40 border-blue-500 text-blue-200'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Landscape (16:9)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                  aspectRatio === '9:16'
                    ? 'bg-blue-900/40 border-blue-500 text-blue-200'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                Portrait (9:16)
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              {(['720p', '1080p'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setResolution(res)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                    resolution === res
                      ? 'bg-blue-900/40 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {res}
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

        {/* Action / Generate Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isProcessing}
            className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              isProcessing
                ? 'bg-slate-800 text-slate-400 cursor-wait'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>{statusMessage || 'Rendering Video with Veo 3.1...'}</span>
                </div>
                {operationName && (
                  <span className="text-[10px] text-blue-300 font-mono font-normal">
                    Job: {operationName.split('/').pop()}
                  </span>
                )}
              </div>
            ) : (
              <>
                <Video className="w-4 h-4" />
                {activeTab === 'text' ? 'Generate Veo 3 Video' : 'Animate Photo with Veo 3'} (veo-3.1-fast-generate-preview)
              </>
            )}
          </button>
        </div>

        {/* Result Video Player */}
        {videoBlobUrl && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-950 border border-blue-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-200">Generated Video Output</p>
                <p className="text-[10px] text-slate-400 font-mono">veo-3.1-fast-generate-preview ({aspectRatio})</p>
              </div>
              <a
                href={videoBlobUrl}
                download={`bedtime-veo-video-${aspectRatio.replace(':', 'x')}.mp4`}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
              <video
                src={videoBlobUrl}
                controls
                autoPlay
                loop
                className={`max-h-[380px] w-full ${aspectRatio === '9:16' ? 'max-w-[240px]' : ''} object-contain`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
