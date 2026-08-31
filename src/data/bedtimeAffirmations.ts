export type AffirmationTheme = 'peace' | 'courage' | 'kindness' | 'wonder' | 'love' | 'coziness' | 'nature';

export interface BedtimeAffirmation {
  id: string;
  phrase: string;
  theme: AffirmationTheme;
  breathGuidance?: string;
  iconName?: string;
  color?: string;
  category?: 'animals' | 'stars' | 'ocean' | 'magic' | 'general' | 'forest' | 'adventure' | 'cozy';
  minAge?: number;
  maxAge?: number;
  recommendedAvatars?: string[];
  storyPreferenceKeywords?: string[];
  bedtimeWhisper?: string;
  targetPreferenceLabel?: string;
}

export interface ProfileAffirmationResult {
  affirmation: BedtimeAffirmation;
  matchReason: string;
  preferenceLabel: string;
  avatarEmoji: string;
  isPersonalized: boolean;
  alternativeCount: number;
}

export const DAILY_AFFIRMATIONS: BedtimeAffirmation[] = [
  // SLEEPY ANIMALS & FOREST (Matches "Gentle Stories • Sleepy Animals", avatars: bear, fox, bunny, owl)
  {
    id: 'aff-animal-1',
    phrase: 'Like a sleepy bear curled up in a warm den of soft moss, you are safe, cozy, and ready for sweet dreams.',
    theme: 'coziness',
    category: 'animals',
    minAge: 2,
    maxAge: 7,
    recommendedAvatars: ['bear', 'fox', 'bunny'],
    storyPreferenceKeywords: ['animal', 'sleepy', 'gentle', 'forest', 'cozy'],
    breathGuidance: 'Take one deep, slow bear breath in... and sigh out all the day’s wiggles.',
    bedtimeWhisper: 'Rest your paws, sleepy one. The quiet forest is fast asleep.',
    targetPreferenceLabel: 'Sleepy Animals & Cozy Dens',
    color: 'from-amber-500/20 to-yellow-950/40',
  },
  {
    id: 'aff-animal-2',
    phrase: 'The little silver moon fox steps softly across the velvet grass, whispering goodnight just to you, {name}.',
    theme: 'peace',
    category: 'animals',
    minAge: 3,
    maxAge: 8,
    recommendedAvatars: ['fox', 'owl', 'bunny'],
    storyPreferenceKeywords: ['fox', 'animal', 'gentle', 'moon', 'nature'],
    breathGuidance: 'Breathe in soft starlight, breathe out gentle stillness.',
    bedtimeWhisper: 'Tuck your chin in cozy like a fox with a bushy tail blanket.',
    targetPreferenceLabel: 'Gentle Forest Tales',
    color: 'from-orange-400/20 to-amber-950/40',
  },
  {
    id: 'aff-animal-3',
    phrase: 'Soft like a hopping bunny settling into clover, your body is warm, light, and peaceful from your head to your toes.',
    theme: 'peace',
    category: 'animals',
    minAge: 2,
    maxAge: 6,
    recommendedAvatars: ['bunny', 'bear', 'fox'],
    storyPreferenceKeywords: ['animal', 'gentle', 'sleepy', 'soft'],
    breathGuidance: 'Twitch your nose gently, then let your whole face relax and soften.',
    bedtimeWhisper: 'Snuggle down deep into your soft blankets.',
    targetPreferenceLabel: 'Sleepy Animal Wonders',
    color: 'from-emerald-400/20 to-teal-950/40',
  },
  {
    id: 'aff-animal-4',
    phrase: 'The wise night owl watches over the quiet trees from high in the branches, keeping all your dreams safe tonight.',
    theme: 'love',
    category: 'forest',
    minAge: 4,
    maxAge: 9,
    recommendedAvatars: ['owl', 'fox', 'astronaut'],
    storyPreferenceKeywords: ['owl', 'forest', 'wisdom', 'watchful', 'night'],
    breathGuidance: 'Close your eyes and listen to the peaceful hush of the evening breeze.',
    bedtimeWhisper: 'Quiet feathers, gentle night... everything is peaceful and right.',
    targetPreferenceLabel: 'Wise Night Forest',
    color: 'from-purple-400/20 to-indigo-950/40',
  },
  {
    id: 'aff-animal-5',
    phrase: 'All the sleepy forest creatures are yawning together under the moonlight, and bed is waiting with loving warmth.',
    theme: 'coziness',
    category: 'animals',
    minAge: 2,
    maxAge: 7,
    recommendedAvatars: ['bear', 'bunny', 'fox', 'owl'],
    storyPreferenceKeywords: ['animal', 'sleepy', 'bedtime', 'warmth'],
    breathGuidance: 'Take a long, sleepy yawn and let your shoulders drop into bed.',
    bedtimeWhisper: 'Sleep tight, little creature of the forest.',
    targetPreferenceLabel: 'Sleepy Creatures Slumber',
    color: 'from-amber-400/20 to-stone-950/50',
  },

  // STAR CONSTELLATIONS & ADVENTURE (Matches "Adventure Tales • Star Constellations", avatars: astronaut, dragon, star, fox)
  {
    id: 'aff-cosmic-1',
    phrase: 'Every great star explorer needs restful sleep to refuel their cosmic courage for tomorrow’s grand journeys, {name}.',
    theme: 'courage',
    category: 'stars',
    minAge: 5,
    maxAge: 10,
    recommendedAvatars: ['astronaut', 'dragon', 'fox'],
    storyPreferenceKeywords: ['adventure', 'star', 'constellation', 'cosmic', 'space', 'voyager'],
    breathGuidance: 'Inhale sparkling star dust for 4 counts... exhale quiet space peace.',
    bedtimeWhisper: 'Your constellation is shining bright above your window.',
    targetPreferenceLabel: 'Cosmic Constellations & Bravery',
    color: 'from-indigo-400/20 to-blue-950/50',
  },
  {
    id: 'aff-cosmic-2',
    phrase: 'You are brave like a supernova and gentle like a drifting nebula. Sleep will carry you across peaceful galaxies tonight.',
    theme: 'wonder',
    category: 'stars',
    minAge: 4,
    maxAge: 10,
    recommendedAvatars: ['astronaut', 'dragon', 'owl'],
    storyPreferenceKeywords: ['star', 'adventure', 'galaxy', 'wonder', 'space'],
    breathGuidance: 'Imagine floating weightlessly in a warm purple galaxy of calm.',
    bedtimeWhisper: 'Zero gravity, zero worries... only soft starlight.',
    targetPreferenceLabel: 'Galactic Wonder & Bravery',
    color: 'from-violet-400/20 to-fuchsia-950/40',
  },
  {
    id: 'aff-cosmic-3',
    phrase: 'The stars have spun a silver tapestry across the sky to celebrate how wonderfully brave and kind you were today.',
    theme: 'wonder',
    category: 'stars',
    minAge: 4,
    maxAge: 9,
    recommendedAvatars: ['astronaut', 'fox', 'unicorn'],
    storyPreferenceKeywords: ['star', 'constellation', 'adventure', 'kindness'],
    breathGuidance: 'Picture each twinkling star blinking a gentle goodnight to you.',
    bedtimeWhisper: 'The sky is smiling down on your sweet dreams.',
    targetPreferenceLabel: 'Star Constellation Wonders',
    color: 'from-amber-300/20 to-indigo-950/40',
  },
  {
    id: 'aff-cosmic-4',
    phrase: 'Like a dragon resting by a sleepy crystal cavern, your superpower tonight is peaceful, deep, restorative rest.',
    theme: 'courage',
    category: 'adventure',
    minAge: 5,
    maxAge: 10,
    recommendedAvatars: ['dragon', 'astronaut'],
    storyPreferenceKeywords: ['dragon', 'adventure', 'bravery', 'strength', 'superhero'],
    breathGuidance: 'Take a warm, slow dragon breath in... and exhale cool, soothing mist.',
    bedtimeWhisper: 'Rest your wings, brave hero. You did amazing today.',
    targetPreferenceLabel: 'Dragon Courage & Strength',
    color: 'from-rose-400/20 to-red-950/40',
  },

  // OCEAN WONDERS & DEEP CALM (Matches Ocean/Whale preferences)
  {
    id: 'aff-ocean-1',
    phrase: 'Like the gentle glowing whale singing beneath moonlit waves, your breath rises and falls in perfect bedtime calm.',
    theme: 'peace',
    category: 'ocean',
    minAge: 3,
    maxAge: 9,
    recommendedAvatars: ['whale', 'owl', 'bunny'],
    storyPreferenceKeywords: ['ocean', 'whale', 'water', 'calm', 'waves'],
    breathGuidance: 'Breathe in like a gentle wave coming to shore... breathe out as it drifts away.',
    bedtimeWhisper: 'Listen to the soothing rhythm of the ocean tide.',
    targetPreferenceLabel: 'Ocean Calm & Gentle Waves',
    color: 'from-cyan-400/20 to-blue-950/50',
  },
  {
    id: 'aff-ocean-2',
    phrase: 'Deep under the calm turquoise sea, the water is cool, quiet, and cradles your dreams like a soft lullaby.',
    theme: 'peace',
    category: 'ocean',
    minAge: 2,
    maxAge: 8,
    recommendedAvatars: ['whale', 'bear', 'unicorn'],
    storyPreferenceKeywords: ['ocean', 'lullaby', 'calm', 'water'],
    breathGuidance: 'Float softly on your back and feel the calm, comforting waters.',
    bedtimeWhisper: 'Drift away on gentle moonlit tides.',
    targetPreferenceLabel: 'Ocean Whispers & Tides',
    color: 'from-teal-400/20 to-indigo-950/40',
  },

  // MAGICAL WORLDS & FAIRY WONDERS (Matches Unicorn/Magic preferences)
  {
    id: 'aff-magic-1',
    phrase: 'The dream unicorn weaves a blanket of sparkling rainbow stardust to wrap you in warmth and wonder tonight, {name}.',
    theme: 'wonder',
    category: 'magic',
    minAge: 2,
    maxAge: 8,
    recommendedAvatars: ['unicorn', 'bunny', 'dragon'],
    storyPreferenceKeywords: ['magic', 'unicorn', 'fairy', 'wonder', 'sparkle'],
    breathGuidance: 'Inhale sparkling pastel light... exhale all thoughts into soft bubbles.',
    bedtimeWhisper: 'Magic lives in your heart and in your sweetest dreams.',
    targetPreferenceLabel: 'Magical Worlds & Rainbow Dreams',
    color: 'from-pink-400/20 to-purple-950/40',
  },
  {
    id: 'aff-magic-2',
    phrase: 'Your imagination is a magical garden where beautiful, peaceful dreams blossom under the starlight.',
    theme: 'wonder',
    category: 'magic',
    minAge: 4,
    maxAge: 9,
    recommendedAvatars: ['unicorn', 'owl', 'fox'],
    storyPreferenceKeywords: ['magic', 'garden', 'imagination', 'wonder'],
    breathGuidance: 'Smell the sweet night flowers as you breathe in soft calmness.',
    bedtimeWhisper: 'Plant a seed of a happy dream before you close your eyes.',
    targetPreferenceLabel: 'Enchanted Starlight Garden',
    color: 'from-fuchsia-400/20 to-indigo-950/40',
  },

  // GENTLE COZINESS & HEARTFELT LOVE (Universal & Younger Ages)
  {
    id: 'aff-love-1',
    phrase: 'You are safe, deeply loved, and held by a night sky full of gentle stars that glow just for you.',
    theme: 'love',
    category: 'general',
    minAge: 2,
    maxAge: 10,
    recommendedAvatars: ['bear', 'bunny', 'fox', 'unicorn', 'owl', 'astronaut', 'whale', 'dragon'],
    storyPreferenceKeywords: ['gentle', 'love', 'safe', 'cozy', 'comfort'],
    breathGuidance: 'Rest your hands on your heart and feel how loved and special you are.',
    bedtimeWhisper: 'You are our greatest treasure. Sleep peacefully tonight.',
    targetPreferenceLabel: 'Safe, Cherished & Loved',
    color: 'from-amber-400/20 to-rose-950/40',
  },
  {
    id: 'aff-love-2',
    phrase: 'You are enough just as you are, {name}, wonderful in every single way and cherished through all the stars.',
    theme: 'love',
    category: 'general',
    minAge: 3,
    maxAge: 10,
    recommendedAvatars: ['bear', 'fox', 'bunny', 'owl', 'whale', 'unicorn'],
    storyPreferenceKeywords: ['love', 'kindness', 'gentle', 'heart'],
    breathGuidance: 'Whisper softly to your pillow: "I am safe, I am loved, I am calm."',
    bedtimeWhisper: 'Your heart is a glowing star of kindness.',
    targetPreferenceLabel: 'Unconditional Love & Warmth',
    color: 'from-rose-400/20 to-purple-950/40',
  },
  {
    id: 'aff-courage-1',
    phrase: 'It takes bravery to explore the day, and it takes wisdom to rest peacefully tonight. You have both, {name}.',
    theme: 'courage',
    category: 'adventure',
    minAge: 5,
    maxAge: 10,
    recommendedAvatars: ['astronaut', 'dragon', 'fox', 'owl'],
    storyPreferenceKeywords: ['courage', 'brave', 'adventure', 'hero'],
    breathGuidance: 'Take one proud, slow breath in... and let out a gentle sigh of relief.',
    bedtimeWhisper: 'Tomorrow is another grand chapter, but tonight is your peaceful pause.',
    targetPreferenceLabel: 'Explorer Bravery & Inner Strength',
    color: 'from-cyan-400/20 to-slate-950/50',
  },
  {
    id: 'aff-peace-1',
    phrase: 'Your mind is tranquil like a mirror-still mountain lake, reflecting the soft silver moonbeams without a ripple.',
    theme: 'peace',
    category: 'general',
    minAge: 5,
    maxAge: 10,
    recommendedAvatars: ['owl', 'whale', 'bear'],
    storyPreferenceKeywords: ['peace', 'meditation', 'calm', 'nature', 'stillness'],
    breathGuidance: 'Watch any busy thoughts drift away like autumn leaves on a quiet stream.',
    bedtimeWhisper: 'Still waters, still mind, restful night.',
    targetPreferenceLabel: 'Mindful Stillness & Calm',
    color: 'from-indigo-400/20 to-blue-950/40',
  },
  {
    id: 'aff-kindness-1',
    phrase: 'Your kindness today made someone’s day brighter, and tonight the night sky returns that warmth right back to you.',
    theme: 'kindness',
    category: 'general',
    minAge: 4,
    maxAge: 10,
    recommendedAvatars: ['bunny', 'bear', 'fox', 'unicorn'],
    storyPreferenceKeywords: ['kindness', 'caring', 'heart', 'friendship'],
    breathGuidance: 'Send a quiet smile into the night sky for all your friends.',
    bedtimeWhisper: 'Kind hearts sleep with the sweetest dreams.',
    targetPreferenceLabel: 'Warm Heart & Kindness',
    color: 'from-emerald-400/20 to-teal-950/40',
  },
  {
    id: 'aff-wonder-1',
    phrase: 'Tomorrow holds new joys, funny surprises, and sunny smiles—and peaceful sleep tonight is your secret superpower.',
    theme: 'wonder',
    category: 'general',
    minAge: 3,
    maxAge: 9,
    recommendedAvatars: ['fox', 'astronaut', 'dragon', 'bunny'],
    storyPreferenceKeywords: ['wonder', 'adventure', 'dreams', 'curiosity'],
    breathGuidance: 'Breathe in tomorrow’s happy possibilities, breathe out today’s quiet rest.',
    bedtimeWhisper: 'Close your eyes and see where your dreams will take you.',
    targetPreferenceLabel: 'Starlight Wonder & Tomorrow’s Joys',
    color: 'from-yellow-400/20 to-purple-950/40',
  },
];

/**
 * Calculates a unique, deterministic daily affirmation for a child based on their profile preferences and the date.
 */
export function getDailyAffirmationForProfile(
  profile: {
    id?: string;
    name?: string;
    age?: number;
    avatar?: string;
    storyPreference?: string;
    gentleMode?: boolean;
  } = {},
  date: Date = new Date()
): ProfileAffirmationResult {
  const childName = profile.name || 'Little Explorer';
  const childAge = profile.age || 5;
  const avatar = profile.avatar || 'fox';
  const storyPref = (profile.storyPreference || '').toLowerCase();
  const isGentle = profile.gentleMode !== false;

  // Filter and score candidate affirmations matching the child's preferences
  const scoredCandidates = DAILY_AFFIRMATIONS.map((aff) => {
    let score = 10; // Baseline score

    // 1. Age compatibility scoring
    if (aff.minAge !== undefined && aff.maxAge !== undefined) {
      if (childAge >= aff.minAge && childAge <= aff.maxAge) {
        score += 30;
      } else if (Math.abs(childAge - aff.minAge) <= 2 || Math.abs(childAge - aff.maxAge) <= 2) {
        score += 10;
      } else {
        score -= 15;
      }
    }

    // 2. Avatar match scoring
    if (aff.recommendedAvatars && aff.recommendedAvatars.includes(avatar)) {
      score += 25;
    }

    // 3. Story Preference keyword scoring
    if (storyPref && aff.storyPreferenceKeywords) {
      for (const kw of aff.storyPreferenceKeywords) {
        if (storyPref.includes(kw)) {
          score += 20;
        }
      }
    }

    // 4. Gentle mode preference
    if (isGentle && (aff.theme === 'peace' || aff.theme === 'coziness' || aff.theme === 'love')) {
      score += 15;
    }

    // 5. Specific avatar theme mappings
    if (avatar === 'bear' && aff.category === 'animals') score += 15;
    if (avatar === 'astronaut' && aff.category === 'stars') score += 20;
    if (avatar === 'whale' && aff.category === 'ocean') score += 25;
    if (avatar === 'unicorn' && aff.category === 'magic') score += 20;
    if (avatar === 'dragon' && (aff.category === 'adventure' || aff.category === 'magic')) score += 20;
    if (avatar === 'owl' && (aff.category === 'forest' || aff.category === 'stars')) score += 15;

    return { aff, score };
  });

  // Sort descending by match score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Take top matching pool (at least top 4-8 affirmations)
  const topThreshold = Math.max(scoredCandidates[0]?.score * 0.65, 30);
  const topPool = scoredCandidates
    .filter((item) => item.score >= topThreshold)
    .map((item) => item.aff);

  const activePool = topPool.length > 0 ? topPool : DAILY_AFFIRMATIONS;

  // Calculate deterministic index using Date string + child profile attributes
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seedString = `${dateStr}-${childName.trim().toLowerCase()}-${childAge}-${avatar}-${storyPref}-${profile.id || 'default'}`;
  
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  const selectedIndex = Math.abs(hash) % activePool.length;
  const selectedAffirmation = activePool[selectedIndex];

  // Derive contextual match reason
  let matchReason = `Curated for ${childName} (Age ${childAge})`;
  if (storyPref.includes('animal') || avatar === 'bear' || avatar === 'fox' || avatar === 'bunny') {
    matchReason += ` • Tailored to Sleepy Animal & Nature comfort`;
  } else if (storyPref.includes('constellation') || storyPref.includes('adventure') || avatar === 'astronaut') {
    matchReason += ` • Tailored to Cosmic Explorer courage`;
  } else if (storyPref.includes('ocean') || avatar === 'whale') {
    matchReason += ` • Tailored to Ocean Calm lullaby tones`;
  } else if (storyPref.includes('magic') || avatar === 'unicorn' || avatar === 'dragon') {
    matchReason += ` • Tailored to Enchanted Wonder & Dreams`;
  } else {
    matchReason += ` • Personalized bedtime starlight`;
  }

  const preferenceLabel = selectedAffirmation.targetPreferenceLabel || 
    (storyPref.length > 0 ? storyPref.split('•')[0].trim() : 'Bedtime Starlight');

  const avatarEmojis: Record<string, string> = {
    fox: '🦊',
    astronaut: '🚀',
    owl: '🦉',
    bear: '🐻',
    unicorn: '🦄',
    whale: '🐋',
    bunny: '🐰',
    dragon: '🐉',
  };

  return {
    affirmation: selectedAffirmation,
    matchReason,
    preferenceLabel,
    avatarEmoji: avatarEmojis[avatar] || '✨',
    isPersonalized: true,
    alternativeCount: activePool.length,
  };
}

/**
 * Returns all affirmations relevant to the child's profile for spinning/browsing
 */
export function getCuratedAffirmationsForProfile(
  profile: {
    id?: string;
    name?: string;
    age?: number;
    avatar?: string;
    storyPreference?: string;
    gentleMode?: boolean;
  } = {}
): BedtimeAffirmation[] {
  const childAge = profile.age || 5;
  const avatar = profile.avatar || 'fox';
  const storyPref = (profile.storyPreference || '').toLowerCase();

  return DAILY_AFFIRMATIONS.filter((aff) => {
    if (aff.recommendedAvatars && aff.recommendedAvatars.includes(avatar)) return true;
    if (aff.storyPreferenceKeywords && storyPref) {
      if (aff.storyPreferenceKeywords.some((kw) => storyPref.includes(kw))) return true;
    }
    if (aff.minAge !== undefined && aff.maxAge !== undefined) {
      if (childAge >= aff.minAge && childAge <= aff.maxAge) return true;
    }
    return aff.theme === 'peace' || aff.theme === 'love' || aff.theme === 'coziness';
  });
}

/**
 * Legacy deterministic daily affirmation index based on date only
 */
export function getDailyAffirmationForDate(date: Date = new Date()): BedtimeAffirmation {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}

/**
 * Formats affirmation phrase with personalized child name
 */
export function formatAffirmationPhrase(
  phrase: string,
  childName: string = 'Little Explorer'
): string {
  return phrase.replace(/{name}/g, childName);
}

