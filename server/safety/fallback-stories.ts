/**
 * Curated, known-safe fallback stories, one per mode. Served when the AI both
 * generates unsafe content AND fails to produce safe content on a single
 * stricter regeneration (see `story-guard.ts`). The child always receives a
 * complete, gentle story — never a raw error or a flagged passage.
 *
 * These are hand-written to be unambiguously safe and are pinned by a test that
 * runs every one of them through `moderateStory`. Kept server-side and typed
 * against a local structural shape so this module never drags client-only types
 * (constants/types.ts imports @/lib/badges) into the server bundle.
 */

export interface FallbackStoryPart {
  text: string;
  choices?: string[];
  partIndex: number;
}

export interface FallbackStory {
  title: string;
  parts: FallbackStoryPart[];
  vocabWord: { word: string; definition: string };
  joke: string;
  lesson: string;
  tomorrowHook: string;
  rewardBadge: { emoji: string; title: string; description: string };
}

export type FallbackMode = 'classic' | 'madlibs' | 'sleep';

const CLASSIC: FallbackStory = {
  title: 'The Kindness Garden',
  parts: [
    {
      text:
        'Once upon a time, a gentle helper named Poppy tended a garden where every flower hummed a happy tune. ' +
        'This morning the daisies waved hello and the sunflowers turned to greet the warm, golden light.\n\n' +
        'Poppy carried a little watering can and a heart full of cheer, ready to help her flower friends grow.',
      choices: ['Water the singing daisies', 'Say hello to the sunflowers', 'Follow the humming bees'],
      partIndex: 0,
    },
    {
      text:
        'Poppy chose to follow the friendly bees, who buzzed a cheerful thank-you and led her to a patch of ' +
        'sleepy tulips that had forgotten how to bloom.\n\n' +
        'With a soft song and a gentle drink of water, Poppy helped each tulip open its petals wide.',
      choices: ['Sing a growing song', 'Share a cool drink of water', 'Give each tulip a gentle hug'],
      partIndex: 1,
    },
    {
      text:
        'By evening the whole garden glowed with happy colors, and every flower nodded a grateful goodnight. ' +
        'Poppy curled up on a soft bed of clover as the moon rose kind and bright.\n\n' +
        'She closed her eyes, cozy and calm, dreaming of tomorrow’s gentle adventures in the Kindness Garden.',
      partIndex: 2,
    },
  ],
  vocabWord: { word: 'bloom', definition: 'when a flower opens up its pretty petals' },
  joke: 'Why was the little flower such a good friend? Because it always knew how to grow closer!',
  lesson: 'A little kindness helps everyone around us shine a little brighter.',
  tomorrowHook: 'Tomorrow, Poppy might discover a rainbow hiding among the morning dewdrops.',
  rewardBadge: { emoji: '🌼', title: 'Garden Helper', description: 'You spread kindness and helped friends grow.' },
};

const MADLIBS: FallbackStory = {
  title: 'The Giggly Pancake Parade',
  parts: [
    {
      text:
        'One sunny day, a bouncy bunny named Waffles decided to throw the silliest pancake parade the meadow had ever seen. ' +
        'The pancakes wore tiny party hats and wiggled like happy jellybeans.\n\n' +
        'Waffles laughed so hard that his ears did a wobbly little dance.',
      choices: ['Invite the giggling ducks', 'Toss the pancakes high', 'Play a silly kazoo tune'],
      partIndex: 0,
    },
    {
      text:
        'Waffles played a goofy kazoo tune, and all the pancakes flipped and flopped in a bouncy, buttery boogie. ' +
        'A family of ducks waddled over, quacking with delight.\n\n' +
        'Everyone giggled as syrup made the funniest squishy sounds.',
      choices: ['Do the pancake wiggle', 'Share the sweet syrup', 'Blow bubbly berry bubbles'],
      partIndex: 1,
    },
    {
      text:
        'When the parade wound down, the sleepy pancakes yawned tiny buttery yawns and snuggled into a warm, cozy stack. ' +
        'Waffles hummed a soft, happy tune.\n\n' +
        'He tucked himself in beside his silly friends and drifted off with a great big smile.',
      partIndex: 2,
    },
  ],
  vocabWord: { word: 'parade', definition: 'a happy march where everyone celebrates together' },
  joke: 'What did the pancake say at bedtime? "I’m all tuckered out — flip you tomorrow!"',
  lesson: 'Sharing silly fun with friends makes even an ordinary day sparkle.',
  tomorrowHook: 'Tomorrow, Waffles might plan a wobbly waffle picnic under the giggling clouds.',
  rewardBadge: { emoji: '🥞', title: 'Silly Star', description: 'You brought giggles and joy to the meadow.' },
};

const SLEEP: FallbackStory = {
  title: 'The Sleepy Cloud Boat',
  parts: [
    {
      text:
        'Softly, softly, a little cloud boat floated across the calm and quiet evening sky. ' +
        'The air was warm and gentle, and everything felt cozy and safe.\n\n' +
        'Breathe in slowly… and breathe out slowly… as the cloud boat rocks you ever so gently.',
      partIndex: 0,
    },
    {
      text:
        'The stars twinkled like tiny nightlights, calm and slow, humming a peaceful lullaby just for you. ' +
        'Your arms feel heavy and warm, your body soft as a pillow.\n\n' +
        'Slower… and slower… the cloud boat drifts, wrapping you in a snug and comfy hush.',
      partIndex: 1,
    },
    {
      text:
        'Now the gentle cloud boat settles into a soft and sleepy nest of moonlit mist. ' +
        'Everything is quiet, everything is calm, and you are cozy and completely at peace.\n\n' +
        'Close your eyes… rest now… and float softly into warm and happy dreams.',
      partIndex: 2,
    },
  ],
  vocabWord: { word: 'gentle', definition: 'soft, calm, and very kind' },
  joke: 'Why did the little cloud go to bed? Because it was feeling wonderfully light and sleepy.',
  lesson: 'Slow, gentle breaths help our bodies feel calm and ready for peaceful rest.',
  tomorrowHook: 'Tomorrow, the cloud boat might sail to a quiet meadow of soft, glowing flowers.',
  rewardBadge: { emoji: '☁️', title: 'Dream Sailor', description: 'You floated softly into calm and cozy dreams.' },
};

const FALLBACKS: Record<FallbackMode, FallbackStory> = {
  classic: CLASSIC,
  madlibs: MADLIBS,
  sleep: SLEEP,
};

/**
 * Return a deep copy of the known-safe fallback story for the given mode.
 * Unrecognized modes fall back to the classic story. A copy is returned so the
 * caller can mutate/strip fields (e.g. drop final-part choices) without
 * corrupting the shared template.
 */
export function getFallbackStory(mode: string): FallbackStory {
  const key: FallbackMode = mode === 'sleep' ? 'sleep' : mode === 'madlibs' ? 'madlibs' : 'classic';
  const template = FALLBACKS[key];
  return {
    ...template,
    parts: template.parts.map((p) => ({ ...p, choices: p.choices ? [...p.choices] : undefined })),
    vocabWord: { ...template.vocabWord },
    rewardBadge: { ...template.rewardBadge },
  };
}
