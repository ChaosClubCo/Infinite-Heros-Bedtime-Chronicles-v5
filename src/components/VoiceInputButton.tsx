import React, { useState, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { AudioRecorderHelper, transcribeAudio } from '../services/geminiTranscribeService';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  placeholder?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<AudioRecorderHelper | null>(null);

  const startMic = async () => {
    try {
      const recorder = new AudioRecorderHelper();
      recorderRef.current = recorder;
      await recorder.startRecording();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone: ' + (err.message || 'Permission denied'));
    }
  };

  const stopMic = async () => {
    if (!recorderRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      const { base64, mimeType } = await recorderRef.current.stopRecording();
      recorderRef.current = null;

      const result = await transcribeAudio({
        audioBase64: base64,
        mimeType,
      });

      if (result.transcript) {
        onTranscript(result.transcript);
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      alert('Transcription failed: ' + (err.message || 'Network error'));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleToggle = () => {
    if (isTranscribing) return;
    if (isRecording) {
      stopMic();
    } else {
      startMic();
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isTranscribing}
      title={isRecording ? 'Click to stop recording and transcribe' : 'Click to speak using Gemini Transcribe'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        isRecording
          ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-900/50'
          : isTranscribing
          ? 'bg-indigo-700/60 text-indigo-200 cursor-wait'
          : 'bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/40'
      } ${className}`}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          <span>Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <MicOff className="w-3.5 h-3.5" />
          <span>Recording (tap to finish)</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-indigo-300" />
          <span>Speak Prompt</span>
        </>
      )}
    </button>
  );
};
