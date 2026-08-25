export interface BedtimeAffirmation {
  id: string;
  phrase: string;
  theme: 'peace' | 'courage' | 'kindness' | 'wonder' | 'love';
  breathGuidance?: string;
  iconName?: string;
  color?: string;
}

export const DAILY_AFFIRMATIONS: BedtimeAffirmation[] = [
  {
    id: 'aff-1',
    phrase: 'You are safe, deeply loved, and held by a night sky full of gentle stars.',
    theme: 'love',
    breathGuidance: 'Breathe in soft golden light, breathe out peaceful quiet.',
    color: 'from-amber-400/20 to-purple-900/30',
  },
  {
    id: 'aff-2',
    phrase: 'Your heart is kind, your mind is tranquil, and sleep is waiting with sweet dreams.',
    theme: 'peace',
    breathGuidance: 'Rest your hands on your chest and feel your calm, gentle heartbeat.',
    color: 'from-indigo-400/20 to-blue-900/30',
  },
  {
    id: 'aff-3',
    phrase: 'You did so many wonderful things today, and now it is time for a cozy rest.',
    theme: 'peace',
    breathGuidance: 'Let your shoulders drop down softly like falling stardust.',
    color: 'from-purple-400/20 to-indigo-900/30',
  },
  {
    id: 'aff-4',
    phrase: 'Like the soft silver moon, you bring a gentle and comforting light wherever you go.',
    theme: 'wonder',
    breathGuidance: 'Imagine the cool moonbeams wrapping you like a cozy blanket.',
    color: 'from-slate-300/20 to-indigo-950/40',
  },
  {
    id: 'aff-5',
    phrase: 'You are strong like a mighty oak tree and gentle like fresh falling snow.',
    theme: 'courage',
    breathGuidance: 'Take one deep breath in... and let all your muscles melt into bed.',
    color: 'from-emerald-400/20 to-teal-950/40',
  },
  {
    id: 'aff-6',
    phrase: 'Breathe in quiet starlight, breathe out any busy thoughts from today.',
    theme: 'peace',
    breathGuidance: 'Inhale for 4 twinkling counts... exhale for 4 quiet counts.',
    color: 'from-violet-400/20 to-purple-950/40',
  },
  {
    id: 'aff-7',
    phrase: 'You are a shining star in our galaxy, {name}, brave, curious, and true.',
    theme: 'love',
    breathGuidance: 'Smile softly and remember how special and loved you are.',
    color: 'from-amber-300/20 to-rose-950/30',
  },
  {
    id: 'aff-8',
    phrase: 'The night is peaceful, the stars are watching over you, and tomorrow brings new joys.',
    theme: 'wonder',
    breathGuidance: 'Picture the quiet stars blinking goodnight just for you.',
    color: 'from-blue-400/20 to-indigo-950/40',
  },
  {
    id: 'aff-9',
    phrase: 'You are creative, caring, and full of wonderful bedtime wonder.',
    theme: 'kindness',
    breathGuidance: 'Send a quiet wish of kindness to your friends and family tonight.',
    color: 'from-pink-400/20 to-purple-950/40',
  },
  {
    id: 'aff-10',
    phrase: 'Rest your sleepy eyes; your body is growing stronger and calmer with every breath.',
    theme: 'peace',
    breathGuidance: 'Feel your eyelids grow heavy, soft, and relaxed.',
    color: 'from-indigo-400/20 to-slate-950/50',
  },
  {
    id: 'aff-11',
    phrase: 'Your dreams tonight will be as soft as fluffy clouds and as sweet as honey.',
    theme: 'wonder',
    breathGuidance: 'Float weightlessly across a pastel sky of warm cloud pillows.',
    color: 'from-amber-400/20 to-yellow-950/30',
  },
  {
    id: 'aff-12',
    phrase: 'It is okay to let go of today; restful sleep is your secret superhero power.',
    theme: 'courage',
    breathGuidance: 'Let out a long, slow sigh... Ahhh. Everything is calm.',
    color: 'from-cyan-400/20 to-blue-950/40',
  },
  {
    id: 'aff-13',
    phrase: 'You are surrounded by love, warmth, and safe starry protection tonight.',
    theme: 'love',
    breathGuidance: 'Curl up cozy and feel the safe warmth around you.',
    color: 'from-rose-400/20 to-purple-950/40',
  },
  {
    id: 'aff-14',
    phrase: 'Your curiosity makes the world brighter, and your kindness makes it warmer.',
    theme: 'kindness',
    breathGuidance: 'Breathe in happy thoughts, breathe out quiet peacefulness.',
    color: 'from-teal-400/20 to-emerald-950/40',
  },
  {
    id: 'aff-15',
    phrase: 'Every single breath you take makes you feel lighter, cozier, and ready to sleep.',
    theme: 'peace',
    breathGuidance: 'Breathe in... 1, 2, 3. Breathe out... 1, 2, 3, 4.',
    color: 'from-purple-400/20 to-indigo-950/40',
  },
  {
    id: 'aff-16',
    phrase: 'You are enough just as you are, {name}, wonderful in every single way.',
    theme: 'love',
    breathGuidance: 'Whisper softly to yourself: "I am safe, I am loved."',
    color: 'from-amber-400/20 to-orange-950/30',
  },
  {
    id: 'aff-17',
    phrase: 'The sleepy forest animals are resting in their cozy dens, and so can you.',
    theme: 'peace',
    breathGuidance: 'Imagine curling up like a sleepy fox under gentle starlight.',
    color: 'from-emerald-500/20 to-slate-950/40',
  },
  {
    id: 'aff-18',
    phrase: 'You faced today with a brave heart, and now the quiet night belongs to you.',
    theme: 'courage',
    breathGuidance: 'Release any tight feelings and let your bed hold you softly.',
    color: 'from-blue-400/20 to-purple-950/40',
  },
  {
    id: 'aff-19',
    phrase: 'Gentle thoughts fill your pillow; sweet dreams are sailing in on silver sails.',
    theme: 'wonder',
    breathGuidance: 'Listen to the quiet sounds around you as you drift into slumber.',
    color: 'from-indigo-300/20 to-sky-950/40',
  },
  {
    id: 'aff-20',
    phrase: 'Tomorrow is full of new adventures, and sleep gives your spirit wings.',
    theme: 'wonder',
    breathGuidance: 'Take a soft, slow breath and let your eyes close naturally.',
    color: 'from-violet-400/20 to-fuchsia-950/30',
  },
];

/**
 * Calculates the deterministic daily affirmation index based on date string (YYYY-MM-DD)
 */
export function getDailyAffirmationForDate(date: Date = new Date()): BedtimeAffirmation {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}

/**
 * Formats affirmation phrase with personalized child name
 */
export function formatAffirmationPhrase(phrase: string, childName: string = 'Little Explorer'): string {
  return phrase.replace(/{name}/g, childName);
}
