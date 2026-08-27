export interface AgeBedtimeGuide {
  ageRange: string;
  minAge: number;
  maxAge: number;
  label: string;
  sleepHours: string;
  recommendedBedtime: string;
  windDownMinutes: number;
  overview: string;
  keySleepChallenges: string[];
  recommendedHabits: {
    title: string;
    description: string;
    iconName: string;
  }[];
  starlightTalesAdvice: {
    recommendedTimerMins: number;
    narrationSpeed: string;
    soundscape: string;
    modeDescription: string;
  };
  bedtimeTimeline: {
    timeOffset: string;
    step: string;
    tip: string;
  }[];
}

export interface DateContextInfo {
  formattedDate: string;
  dayName: string;
  isWeekend: boolean;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonName: string;
  seasonIcon: string;
  seasonalSleepTip: string;
  dayContextTip: string;
  currentHour: number;
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'night';
  bedtimeReadinessTip: string;
}

export const AGE_BEDTIME_GUIDES: AgeBedtimeGuide[] = [
  {
    ageRange: '3-4',
    minAge: 3,
    maxAge: 4,
    label: 'Toddler & Preschooler (3–4 yrs)',
    sleepHours: '10 – 13 hours total (including nap)',
    recommendedBedtime: '7:00 PM – 7:45 PM',
    windDownMinutes: 35,
    overview:
      'Preschoolers have active imaginations and are transitioning away from daily naps. Consistency and comforting sensory cues are vital for smooth bedtime transitions.',
    keySleepChallenges: [
      'Bedtime resistance and requests for "one more story"',
      'Fear of the dark or active nighttime dreams',
      'Overtiredness if transitioning away from afternoon naps',
    ],
    recommendedHabits: [
      {
        title: 'Tactile & Visual Routine Chart',
        description: 'Use a predictable 3-step sequence: warm bath, pyjamas & teeth, then Starlight Tales in dim warm lighting.',
        iconName: 'Sparkles',
      },
      {
        title: 'Calming Sensory Soundscapes',
        description: 'Play continuous gentle rain or ocean waves so the room does not feel suddenly silent when parents exit.',
        iconName: 'Waves',
      },
      {
        title: 'Comfort Anchor Object',
        description: 'Pair story listening with a favorite soft bedtime companion or nightlight set to warm amber (not blue).',
        iconName: 'Heart',
      },
    ],
    starlightTalesAdvice: {
      recommendedTimerMins: 30,
      narrationSpeed: '0.75x (Gentle & Slow)',
      soundscape: 'Gentle Rain or Warm Fireplace',
      modeDescription: 'Enable Age-Appropriate Filtering and select Gentle Forest or Sleepy Animals themes with zero conflict.',
    },
    bedtimeTimeline: [
      { timeOffset: '6:30 PM (45m prior)', step: 'Digital Sunset', tip: 'Turn off televisions and tablets; switch house lights to soft warm illumination.' },
      { timeOffset: '6:45 PM (30m prior)', step: 'Bath & Pajamas', tip: 'Warm water helps drop the child’s core temperature, naturally triggering sleepiness.' },
      { timeOffset: '7:00 PM (15m prior)', step: 'Starlight Bedtime Tale', tip: 'Snuggle together and start a gentle hero story with auto-advance and voice narration.' },
      { timeOffset: '7:15 PM (Lights Out)', step: 'Ambient Transition', tip: 'Leave soft white noise or rain sounds running as child drifts into dreamland.' },
    ],
  },
  {
    ageRange: '5-6',
    minAge: 5,
    maxAge: 6,
    label: 'Early Elementary (5–6 yrs)',
    sleepHours: '10 – 12 hours',
    recommendedBedtime: '7:30 PM – 8:15 PM',
    windDownMinutes: 30,
    overview:
      'Kindergarten and first graders experience high sensory stimulation at school. Bedtime stories help them process the day and transition from physical activity to mental tranquility.',
    keySleepChallenges: [
      'Replaying daytime school stimulation and excitement',
      'Asking deep bedtime questions to delay sleep',
      'Difficulty slowing down energetic bodies',
    ],
    recommendedHabits: [
      {
        title: 'Guided Deep Breathing',
        description: 'Practice the "Starfish Breath" or the in-app breathing visualizer for 2 minutes before the story starts.',
        iconName: 'Wind',
      },
      {
        title: 'One Happy Memory Sharing',
        description: 'Ask your child for their favorite moment of the day and log it into the Starlight Dream Journal.',
        iconName: 'BookOpen',
      },
      {
        title: 'Predictable Bedtime Boundary',
        description: 'Agree beforehand: "We will listen to one heroic adventure and two peaceful affirmations, then lights out."',
        iconName: 'Clock',
      },
    ],
    starlightTalesAdvice: {
      recommendedTimerMins: 45,
      narrationSpeed: '0.88x (Calm & Soothing)',
      soundscape: 'Ocean Waves or Night Breeze',
      modeDescription: 'Cosmic Voyage and Enchanted Glade themes offer inspiring wonder while easing into sleep.',
    },
    bedtimeTimeline: [
      { timeOffset: '7:15 PM (45m prior)', step: 'Evening Wrap-Up', tip: 'Put away toys and prepare school backpack for tomorrow to clear mental clutter.' },
      { timeOffset: '7:35 PM (25m prior)', step: 'Brushing & Starlight Setup', tip: 'Get tucked into bed, select tonight\'s hero companion together.' },
      { timeOffset: '7:45 PM (15m prior)', step: 'Interactive Read-Aloud', tip: 'Listen to the tale with word highlights or record custom parent voice narration.' },
      { timeOffset: '8:00 PM (Lights Out)', step: 'Dream Journal & Sleep', tip: 'Recite tonight\'s affirmation: "I am safe, kind, and ready for restful dreams."' },
    ],
  },
  {
    ageRange: '7-8',
    minAge: 7,
    maxAge: 8,
    label: 'Mid Elementary (7–8 yrs)',
    sleepHours: '9 – 11 hours',
    recommendedBedtime: '8:00 PM – 8:45 PM',
    windDownMinutes: 25,
    overview:
      '7-8 year olds have expanding vocabulary and developing reading independence. They thrive on collaborative story choices, Mad Libs creativity, and reflective bedtime rituals.',
    keySleepChallenges: [
      'Homework, after-school activities pushing bedtime later',
      'Worrying about upcoming tests or social friendship dynamics',
      'Temptation of screen devices and bedtime reading bingeing',
    ],
    recommendedHabits: [
      {
        title: 'Worry-Release Ritual',
        description: 'If thoughts are racing, have them whisper their worry to their Hero companion or jot it down to review tomorrow.',
        iconName: 'ShieldCheck',
      },
      {
        title: 'Madlib Laughter then Calm',
        description: 'Play a quick silly Madlib adventure earlier during wind-down, then switch to a soothing classic adventure.',
        iconName: 'Smile',
      },
      {
        title: 'Autonomous Story Pacing',
        description: 'Allow them to control the scene reading pacing while keeping the ambient soundscape constant.',
        iconName: 'Sliders',
      },
    ],
    starlightTalesAdvice: {
      recommendedTimerMins: 45,
      narrationSpeed: '0.88x – 1.0x (Natural Flow)',
      soundscape: 'Dream Train or Cozy Fire',
      modeDescription: 'Enable Madlib Diaries for creative bonding, then switch to Dream Exploration for lights-out.',
    },
    bedtimeTimeline: [
      { timeOffset: '7:45 PM (45m prior)', step: 'Screen Lockdown', tip: 'All mobile devices and TVs off; switch bedroom lamp to warm 2700K amber glow.' },
      { timeOffset: '8:05 PM (25m prior)', step: 'Self-Care & Pyjamas', tip: 'Independent hygiene routine, glass of water, and comfortable temperature setting (65-68°F / 18-20°C).' },
      { timeOffset: '8:15 PM (15m prior)', step: 'Chapter Journey', tip: 'Read or listen to a 5-scene Hero epic; discuss the hero\'s virtue (courage, honesty).' },
      { timeOffset: '8:30 PM (Lights Out)', step: 'Affirmation & Rest', tip: 'Auto-fade ambient audio softly in the background to sustain deep delta sleep.' },
    ],
  },
  {
    ageRange: '9-10+',
    minAge: 9,
    maxAge: 12,
    label: 'Pre-Tween & Older (9–10+ yrs)',
    sleepHours: '9 – 10.5 hours',
    recommendedBedtime: '8:30 PM – 9:30 PM',
    windDownMinutes: 20,
    overview:
      'Pre-tweens undergo biological circadian phase shifts and higher academic demands. Fostering positive sleep hygiene agency and stress decompression builds lifelong healthy habits.',
    keySleepChallenges: [
      'Circadian rhythm shift (natural tendency to stay awake later)',
      'Digital blue light exposure and social texting late into evening',
      'Academic and extracurricular stress causing sleep-onset delay',
    ],
    recommendedHabits: [
      {
        title: 'Device Charge Station Outside Room',
        description: 'Keep phones and tablets charging in the living room or kitchen to prevent midnight notifications.',
        iconName: 'Tv',
      },
      {
        title: 'Dream Journaling & Goal Reflection',
        description: 'Encourage logging creative thoughts and tomorrow\'s positive intentions in the Dream Journal.',
        iconName: 'BookOpen',
      },
      {
        title: 'Progressive Muscle Relaxation',
        description: 'Guide them to tense and relax each muscle group from toes to forehead while ambient music plays.',
        iconName: 'Sparkles',
      },
    ],
    starlightTalesAdvice: {
      recommendedTimerMins: 60,
      narrationSpeed: '1.0x (Standard)',
      soundscape: 'Cosmic Ocean or Night Breeze',
      modeDescription: 'Deep Mythological tales, Astronomy chronicles, and calming Affirmation journeys.',
    },
    bedtimeTimeline: [
      { timeOffset: '8:30 PM (45m prior)', step: 'Digital Curfew', tip: 'Put away all school screens; dim room lighting to trigger natural melatonin release.' },
      { timeOffset: '8:50 PM (25m prior)', step: 'Evening Stretch & Hydration', tip: 'Light stretching or quiet reading in bed to release accumulated tension.' },
      { timeOffset: '9:05 PM (10m prior)', step: 'Starlight Audio Journey', tip: 'Listen to celestial mythologies or serene atmospheric narrative.' },
      { timeOffset: '9:15 PM (Lights Out)', step: 'Full Dark Sanctuary', tip: 'Ensure bedroom is cool and pitch dark with gentle audio timer set for 45-60 min.' },
    ],
  },
];

export function getGuideForAge(age: number): AgeBedtimeGuide {
  const found = AGE_BEDTIME_GUIDES.find((g) => age >= g.minAge && age <= g.maxAge);
  if (found) return found;
  if (age < 3) return AGE_BEDTIME_GUIDES[0];
  return AGE_BEDTIME_GUIDES[AGE_BEDTIME_GUIDES.length - 1];
}

export function getCurrentDateContext(now = new Date()): DateContextInfo {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const formattedDate = now.toLocaleDateString('en-US', options);
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dayOfWeek = now.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  const month = now.getMonth(); // 0-11
  let season: 'spring' | 'summer' | 'autumn' | 'winter' = 'spring';
  let seasonName = 'Spring Refresh';
  let seasonIcon = '🌱';
  let seasonalSleepTip = 'Spring daylight hours are lengthening. Use room-darkening shades to preserve bedtime rhythm.';

  if (month >= 2 && month <= 4) {
    season = 'spring';
    seasonName = 'Springtime Season';
    seasonIcon = '🌸';
    seasonalSleepTip =
      'Longer evening daylight can trick the brain into thinking it is still daytime. Draw blackout curtains 30 minutes before bedtime to trigger natural melatonin.';
  } else if (month >= 5 && month <= 7) {
    season = 'summer';
    seasonName = 'Late Summer Twilight';
    seasonIcon = '☀️';
    seasonalSleepTip =
      'Warm summer weather can elevate core body temperature. Keep the bedroom ventilated at 65–68°F (18–20°C) and use breathable cotton bedding.';
  } else if (month >= 8 && month <= 10) {
    season = 'autumn';
    seasonName = 'Autumn / Back-to-School';
    seasonIcon = '🍂';
    seasonalSleepTip =
      'Autumn school schedules require strict consistency. Maintaining a predictable bedtime protects memory consolidation and morning focus.';
  } else {
    season = 'winter';
    seasonName = 'Winter Slumber';
    seasonIcon = '❄️';
    seasonalSleepTip =
      'Cold dry winter air can cause nighttime awakenings. Consider a cool-mist humidifier and cozy layered blankets for optimal sleep depth.';
  }

  // Day context tip
  let dayContextTip = '';
  if (dayOfWeek === 5) {
    dayContextTip = 'Friday Evening: It is tempting to push bedtime late tonight, but keeping within 30 minutes of weekday schedule prevents Monday morning sleep jet-lag.';
  } else if (dayOfWeek === 6) {
    dayContextTip = 'Saturday Night: Weekend adventure time! Enjoy a slightly longer bedtime story together while maintaining relaxing wind-down cues.';
  } else if (dayOfWeek === 0) {
    dayContextTip = 'Sunday Reset: Ease back into the school week rhythm by starting the wind-down routine 15 minutes earlier tonight.';
  } else {
    dayContextTip = `School Night (${dayName}): Consistent sleep timing is the #1 predictor of mood stability and learning retention tomorrow.`;
  }

  const currentHour = now.getHours();
  let timePeriod: 'morning' | 'afternoon' | 'evening' | 'bedtime' | 'night' = 'evening';
  let bedtimeReadinessTip = '';

  if (currentHour >= 5 && currentHour < 12) {
    timePeriod = 'morning';
    bedtimeReadinessTip = 'Morning Sun Exposure: Getting 15+ minutes of natural morning sunlight today sets your child’s biological clock for easy sleep tonight.';
  } else if (currentHour >= 12 && currentHour < 17) {
    timePeriod = 'afternoon';
    bedtimeReadinessTip = 'Afternoon Routine: Encourage physical active play now so their body is naturally primed for rest when evening arrives.';
  } else if (currentHour >= 17 && currentHour < 19) {
    timePeriod = 'evening';
    bedtimeReadinessTip = 'Pre-Bedtime Wind-Down: Serve a light dinner and begin transitioning away from high-stimulus digital screens.';
  } else if (currentHour >= 19 && currentHour < 22) {
    timePeriod = 'bedtime';
    bedtimeReadinessTip = 'Active Bedtime Window: Dim home lights, launch your child’s favorite Starlight Tale, and let soothing narration lead the way.';
  } else {
    timePeriod = 'night';
    bedtimeReadinessTip = 'Quiet Hours: Sleep is in progress. Continuous ambient rain or white noise keeps sleep uninterrupted by sudden house noises.';
  }

  return {
    formattedDate,
    dayName,
    isWeekend,
    season,
    seasonName,
    seasonIcon,
    seasonalSleepTip,
    dayContextTip,
    currentHour,
    timePeriod,
    bedtimeReadinessTip,
  };
}
