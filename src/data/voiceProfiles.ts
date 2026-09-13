import { StoryVoiceProfile, VoiceProfileCategory } from '../types';

export const STORY_VOICE_PROFILES: StoryVoiceProfile[] = [
  {
    id: 'soothing-narrator',
    name: 'Soothing Bedtime Narrator',
    category: 'soothing',
    categoryLabel: 'Soothing Narrator',
    iconEmoji: '🌙',
    tagline: 'Whispering Starlight & Melodic Calming Cadence',
    description: 'Soft, slow, and hypnotic bedtime whisper designed to calm active thoughts and guide children gently into deep slumber.',
    defaultNarratorId: 'luna',
    defaultPitch: 0.96,
    defaultRate: 0.84,
    stylePrompt: 'gentle bedtime whisper with long soothing pauses',
    bedtimeSuitability: 'sleep',
    samplePhrase: 'Close your eyes, little dreamer. The velvet night sky wraps you in gentle starlight.',
    color: '#818cf8',
    accentBg: 'bg-indigo-950/70',
    borderActive: 'border-indigo-400',
  },
  {
    id: 'soothing-breeze',
    name: 'Featherlight Breeze Whisper',
    category: 'soothing',
    categoryLabel: 'Soothing Narrator',
    iconEmoji: '🍃',
    tagline: 'Airy, Hypnagogic Wind Melodies',
    description: 'Featherlight airy narration with softened vowels that mimics a calming evening breeze through quiet willow trees.',
    defaultNarratorId: 'zephyr',
    defaultPitch: 0.94,
    defaultRate: 0.82,
    stylePrompt: 'featherlight airflow whisper',
    bedtimeSuitability: 'sleep',
    samplePhrase: 'A gentle evening breeze carries peace across the hills, breathing calmness into your dreams.',
    color: '#06b6d4',
    accentBg: 'bg-cyan-950/70',
    borderActive: 'border-cyan-400',
  },
  {
    id: 'animated-playful',
    name: 'Animated & Playful Companion',
    category: 'animated',
    categoryLabel: 'Animated Voices',
    iconEmoji: '🐰',
    tagline: 'Lively Character Inflections & Joyful Energy',
    description: 'Engaging, expressive character acting with playful inflection for active story engagement and cheerful bedtime fun.',
    defaultNarratorId: 'pip',
    defaultPitch: 1.20,
    defaultRate: 1.02,
    stylePrompt: 'expressive, cheerful and dynamic character acting',
    bedtimeSuitability: 'interactive',
    samplePhrase: 'Snuggle under your cozy blanket, little bunny! The stars are smiling down on you.',
    color: '#a855f7',
    accentBg: 'bg-purple-950/70',
    borderActive: 'border-purple-400',
  },
  {
    id: 'animated-scholar',
    name: 'Animated Storybook Scholar',
    category: 'animated',
    categoryLabel: 'Animated Voices',
    iconEmoji: '🦉',
    tagline: 'Enchanted Storybook Discovery & Character Dialogue',
    description: 'Expressive enchanted scholar voice that emphasizes wonder, discovery, and spirited storybook voices.',
    defaultNarratorId: 'barnaby',
    defaultPitch: 1.06,
    defaultRate: 0.96,
    stylePrompt: 'curious animated storyteller with lively accents',
    bedtimeSuitability: 'winddown',
    samplePhrase: 'Hoo-hoo! Let us turn the page together and discover the enchanted mystery of the stars!',
    color: '#10b981',
    accentBg: 'bg-emerald-950/70',
    borderActive: 'border-emerald-400',
  },
  {
    id: 'cozy-hearth',
    name: 'Cozy Hearthside Baritone',
    category: 'cozy-hearth',
    categoryLabel: 'Cozy Hearthside',
    iconEmoji: '🐻',
    tagline: 'Deep, Grounded & Reassuring Hearth Tone',
    description: 'A warm, resonant baritone cadence like a crackling fireside and a weighted blanket, instilling deep safety.',
    defaultNarratorId: 'orion',
    defaultPitch: 0.80,
    defaultRate: 0.86,
    stylePrompt: 'deep resonant soothing baritone',
    bedtimeSuitability: 'sleep',
    samplePhrase: 'You did such a wonderful job today. You are completely safe, cozy, and ready to rest.',
    color: '#f59e0b',
    accentBg: 'bg-amber-950/70',
    borderActive: 'border-amber-400',
  },
  {
    id: 'nurturing-guide',
    name: 'Loving Starlight Guide',
    category: 'nurturing',
    categoryLabel: 'Nurturing Guide',
    iconEmoji: '✨',
    tagline: 'Maternal Warmth & Tender Bedtime Affirmations',
    description: 'Tender maternal melody filled with affectionate reassurance, loving pauses, and comforting bedtime encouragement.',
    defaultNarratorId: 'stella',
    defaultPitch: 1.12,
    defaultRate: 0.92,
    stylePrompt: 'warm loving maternal reassurance',
    bedtimeSuitability: 'winddown',
    samplePhrase: 'Every little star is shining just for you tonight. Rest your head and drift into sweet wonder.',
    color: '#ec4899',
    accentBg: 'bg-pink-950/70',
    borderActive: 'border-pink-400',
  },
];

export const VOICE_PROFILE_CATEGORIES: { id: VoiceProfileCategory | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: 'All Profiles', emoji: '🎙️' },
  { id: 'soothing', label: 'Soothing Narrator', emoji: '🌙' },
  { id: 'animated', label: 'Animated Voices', emoji: '🎭' },
  { id: 'cozy-hearth', label: 'Cozy Hearth', emoji: '🐻' },
  { id: 'nurturing', label: 'Nurturing Guide', emoji: '✨' },
];

export function getVoiceProfileById(id?: string): StoryVoiceProfile {
  return (
    STORY_VOICE_PROFILES.find((p) => p.id === id) ||
    STORY_VOICE_PROFILES[0]
  );
}

export function getVoiceProfileForNarratorId(narratorId?: string): StoryVoiceProfile {
  return (
    STORY_VOICE_PROFILES.find((p) => p.defaultNarratorId === narratorId) ||
    STORY_VOICE_PROFILES[0]
  );
}
