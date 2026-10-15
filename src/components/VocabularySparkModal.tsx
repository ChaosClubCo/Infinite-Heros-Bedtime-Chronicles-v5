import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Volume2, X, Star } from 'lucide-react';
import { VocabularyWord } from '../types';
import { safeConfetti } from '../utils/confetti';

interface VocabularySparkModalProps {
  word: VocabularyWord | null;
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
}

export const VocabularySparkModal: React.FC<VocabularySparkModalProps> = ({
  word,
  isOpen,
  onClose,
  onContinue,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen && word) {
      try {
        safeConfetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FDE047', '#C084FC', '#67E8F9', '#F472B6'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen, word]);

  const speakWord = () => {
    if (!word || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word.toLowerCase());
      utterance.rate = 0.85; // Slightly slower, child-friendly pace
      utterance.pitch = 1.1; // Gentle, friendly tone
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  if (!isOpen || !word) return null;

  return (
    <AnimatePresence>
      <div
        id="vocabulary-spark-modal-container"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-xl"
      >
        {/* Animated starlight background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/15 rounded-full blur-[90px]" />
        </div>

        <motion.div
          id="vocabulary-spark-card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md my-auto rounded-[32px] p-6 sm:p-8 bg-gradient-to-b from-indigo-950/90 via-slate-900/95 to-slate-950/95 border-2 border-amber-400/40 shadow-[0_0_50px_rgba(245,158,11,0.25),0_20px_50px_rgba(0,0,0,0.8)] text-center overflow-hidden"
        >
          {/* Top Close Button */}
          <button
            id="close-vocab-spark-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative Top Sparkles */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
            <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-amber-300/90">
              Cosmic Discovery
            </span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin-slow" />
          </div>

          {/* Banner Title */}
          <h2 className="text-2xl sm:text-3xl font-bangers tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_2px_12px_rgba(253,224,71,0.5)] mb-1">
            YOU LEARNED A NEW WORD!
          </h2>

          <p className="text-xs sm:text-sm text-indigo-200/90 mb-6 font-medium">
            A new spark added to your cosmic knowledge.
          </p>

          {/* Golden Circle Star / Illustration Frame */}
          <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40 mb-6 flex items-center justify-center">
            {/* Outer golden halo ring */}
            <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 bg-gradient-to-tr from-amber-500/20 via-indigo-600/30 to-purple-500/20 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse" />
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border border-amber-300/40 p-1 bg-slate-950/80 flex items-center justify-center">
              {word.iconUrl ? (
                <img
                  src={word.iconUrl}
                  alt={word.word}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized SVG icon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-amber-300">
                  <Star className="w-16 h-16 fill-amber-400/80 stroke-amber-200 animate-bounce" />
                </div>
              )}
            </div>
            {/* Floating corner stars */}
            <Star className="absolute top-1 right-2 w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" />
            <Star className="absolute bottom-2 left-2 w-4 h-4 text-amber-400 fill-amber-400 animate-pulse delay-100" />
          </div>

          {/* Word Display in Bangers */}
          <div className="mb-3">
            <h3 className="text-3xl sm:text-4xl font-bangers tracking-widest text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {word.word}
            </h3>
          </div>

          {/* Pronunciation Capsule with Audio Speak Button */}
          <div className="flex items-center justify-center mb-5">
            <button
              id="speak-vocab-word-btn"
              type="button"
              onClick={speakWord}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/40 hover:border-amber-400/70 text-indigo-200 hover:text-amber-200 text-xs sm:text-sm font-mono tracking-wide shadow-md transition-all group ${
                isSpeaking ? 'ring-2 ring-amber-400 bg-indigo-950' : ''
              }`}
              title="Click to hear pronunciation"
            >
              <Volume2 className={`w-3.5 h-3.5 text-amber-400 ${isSpeaking ? 'animate-bounce' : 'group-hover:scale-110'}`} />
              <span>{word.pronunciation}</span>
            </button>
          </div>

          {/* Definition Card */}
          <div className="relative p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 mb-6 backdrop-blur-md">
            <p className="text-slate-100 text-sm sm:text-base font-medium leading-relaxed italic">
              &ldquo;{word.definition}&rdquo;
            </p>
            {word.exampleSentence && (
              <p className="mt-2 text-xs text-indigo-300/80 font-normal">
                {word.exampleSentence}
              </p>
            )}
          </div>

          {/* Action Button: CONTINUE JOURNEY */}
          <button
            id="continue-journey-btn"
            type="button"
            onClick={() => {
              if (onContinue) {
                onContinue();
              } else {
                onClose();
              }
            }}
            className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 text-slate-950 font-bangers text-lg sm:text-xl tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>CONTINUE JOURNEY</span>
            <span className="text-xl">🚀</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
