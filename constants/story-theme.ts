export type StoryMode = "classic" | "madlibs" | "sleep";

export type StoryState = "generating" | "ready" | "error";

export interface StoryTheme {
  accent: string;
  accentLight: string;
  gradient: [string, string, string];
  orbColor: string;
  choiceColors: [string, string][];
}

export interface ModeVoice {
  id: string;
  label: string;
  accent: string;
}

export const LOADING_MESSAGES: Record<StoryMode, string[]> = {
  classic: [
    "Charting the stars...",
    "Summoning your hero...",
    "Weaving the tale...",
    "Adding a sprinkle of magic...",
    "Almost ready for adventure...",
  ],
  madlibs: [
    "Mixing your silly words...",
    "Adding extra giggles...",
    "Stirring the funny pot...",
    "Sprinkling absurdity...",
    "Cooking up laughs...",
  ],
  sleep: [
    "Dimming the stars...",
    "Fluffing the clouds...",
    "Warming the moonbeams...",
    "Sprinkling sleepy dust...",
    "Preparing your dreamscape...",
  ],
};

export const MODE_THEME: Record<StoryMode, StoryTheme> = {
  classic: {
    accent: "#6366f1",
    accentLight: "#818cf8",
    gradient: ["#05051e", "#0a0a2e", "#05051e"],
    orbColor: "rgba(99, 102, 241, 0.08)",
    choiceColors: [
      ["#6366f1", "#4f46e5"],
      ["#8B5CF6", "#7C3AED"],
      ["#F59E0B", "#D97706"],
    ],
  },
  madlibs: {
    accent: "#F97316",
    accentLight: "#FB923C",
    gradient: ["#05051e", "#1A0A00", "#05051e"],
    orbColor: "rgba(249, 115, 22, 0.08)",
    choiceColors: [
      ["#F97316", "#EA580C"],
      ["#EF4444", "#DC2626"],
      ["#F59E0B", "#D97706"],
    ],
  },
  sleep: {
    accent: "#A855F7",
    accentLight: "#C084FC",
    gradient: ["#05051e", "#0D0520", "#05051e"],
    orbColor: "rgba(168, 85, 247, 0.08)",
    choiceColors: [
      ["#A855F7", "#7C3AED"],
      ["#8B5CF6", "#6D28D9"],
      ["#C084FC", "#9333EA"],
    ],
  },
};

export const MODE_VOICES: Record<StoryMode, ModeVoice[]> = {
  sleep: [
    { id: "moonbeam", label: "Moonbeam", accent: "American" },
    { id: "whisper", label: "Whisper", accent: "American" },
    { id: "stardust", label: "Stardust", accent: "American" },
  ],
  classic: [
    { id: "captain", label: "Captain", accent: "British" },
    { id: "professor", label: "Professor", accent: "British" },
    { id: "aurora", label: "Aurora", accent: "American" },
  ],
  madlibs: [
    { id: "giggles", label: "Giggles", accent: "American" },
    { id: "blaze", label: "Blaze", accent: "American" },
    { id: "ziggy", label: "Ziggy", accent: "British" },
  ],
};

export const SPEED_RATES: Record<string, number> = { gentle: 0.8, medium: 0.9, normal: 1.0 };
