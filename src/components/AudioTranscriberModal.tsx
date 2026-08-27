import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
  Radio,
  FileAudio,
} from 'lucide-react';
import { AudioRecorderHelper, transcribeAudio } from '../services/geminiTranscribeService';

interface AudioTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTranscript?: (text: string) => void;
}

export const AudioTranscriberModal: React.FC<AudioTranscriberModalProps> = ({
  isOpen,
  onClose,
  onApplyTranscript,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorderHelper | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  if (!isOpen) return null;

  const startMic = async () => {
    setError(null);
    try {
      const recorder = new AudioRecorderHelper();
      recorderRef.current = recorder;
      await recorder.startRecording();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic error:', err);
      setError('Could not access microphone: ' + (err.message || 'Permission denied'));
    }
  };

  const stopMic = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);
    setError(null);

    try {
      const { blob, base64, mimeType } = await recorderRef.current.stopRecording();
      recorderRef.current = null;
      setRecordedAudioUrl(URL.createObjectURL(blob));

      const result = await transcribeAudio({
        audioBase64: base64,
        mimeType,
      });

      setTranscript(result.transcript);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError('Transcription failed: ' + (err.message || 'Please check your connection and API key'));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsTranscribing(true);
    setRecordedAudioUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const result = await transcribeAudio({
          audioBase64: base64,
          mimeType: file.type || 'audio/mp3',
        });
        setTranscript(result.transcript);
      } catch (err: any) {
        console.error('Transcription error:', err);
        setError('Transcription failed: ' + (err.message || 'Error processing audio file'));
      } finally {
        setIsTranscribing(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read uploaded file');
      setIsTranscribing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl overflow-hidden text-slate-100">
        {/* Glow Header */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-indigo-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Bedtime Voice Transcriber
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-700/50">
                  gemini-3.5-transcribe
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Speak into the microphone or upload an audio file to transcribe thoughts into text
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

        {/* Center Microphone Action */}
        <div className="my-6 flex flex-col items-center justify-center py-6 px-4 rounded-2xl bg-slate-950/50 border border-indigo-900/40">
          <div className="relative mb-4">
            {isRecording && (
              <div className="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
            )}
            <button
              onClick={isRecording ? stopMic : startMic}
              disabled={isTranscribing}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/40'
                  : isTranscribing
                  ? 'bg-slate-700 text-slate-400 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/30'
              }`}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="text-center">
            {isRecording ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-400 flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  Recording Microphone ({formatTimer(recordingSeconds)})
                </p>
                <p className="text-xs text-slate-400">Click the microphone button when done speaking</p>
              </div>
            ) : isTranscribing ? (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-300 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                  Transcribing with Gemini 3.5 Transcribe...
                </p>
                <p className="text-xs text-slate-400">Extracting speech and converting to text</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">Tap to record bedtime story notes or memories</p>
                <p className="text-xs text-slate-400">Works with English, Spanish, French, and 50+ languages</p>
              </div>
            )}
          </div>

          {/* Or File Upload */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-slate-500">or</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording || isTranscribing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              Upload Audio File (.mp3, .wav, .m4a)
            </button>
          </div>
        </div>

        {/* Audio Playback If Recorded */}
        {recordedAudioUrl && (
          <div className="mb-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileAudio className="w-4 h-4 text-indigo-400" />
              <span>Recorded Audio Source</span>
            </div>
            <audio controls src={recordedAudioUrl} className="h-8 max-w-[240px]" />
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Transcription Output */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              Transcription Result
            </label>
            {transcript && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => setTranscript('')}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
            )}
          </div>

          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your transcribed text will appear here. You can also edit or refine it..."
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-slate-950/80 border border-indigo-900/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-600 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Close
          </button>
          {onApplyTranscript && transcript && (
            <button
              onClick={() => {
                onApplyTranscript(transcript);
                onClose();
              }}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-900/40 transition"
            >
              Use This Transcript
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
