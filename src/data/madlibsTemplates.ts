export interface MadLibField {
  key: string;
  label: string;
  type: string;
  placeholder: string;
  suggestions: string[];
}

export interface MadLibTemplate {
  id: string;
  title: string;
  theme: string;
  suggestedHeroId: string;
  fields: MadLibField[];
  storyGenerator: (answers: Record<string, string>, heroName: string) => {
    scenes: { text: string; sleepAffirmation: string }[];
  };
}

export const MADLIBS_TEMPLATES: MadLibTemplate[] = [
  {
    id: "silly-space-picnic",
    title: "The Silly Starlight Picnic",
    theme: "imagination",
    suggestedHeroId: "hero-3",
    fields: [
      {
        key: "sillyFood",
        label: "Funny Snack",
        type: "food",
        placeholder: "e.g. Marshmallow Pizza",
        suggestions: ["Marshmallow Pizza", "Giggle Tacos", "Rainbow Jellybeans", "Bubblegum Pancakes"]
      },
      {
        key: "funnyAnimal",
        label: "Funny Animal",
        type: "animal",
        placeholder: "e.g. Pajama Penguin",
        suggestions: ["Pajama Penguin", "Dancing Hamster", "Snoring Dragon", "Glitter Hippo"]
      },
      {
        key: "goofySound",
        label: "Silly Sound",
        type: "sound",
        placeholder: "e.g. Boing-boing-squish",
        suggestions: ["Boing-boing-squish", "Honk-whistle-pop", "Bloop-a-doop", "Zippity-zap"]
      },
      {
        key: "cozyItem",
        label: "Cozy Bed Item",
        type: "item",
        placeholder: "e.g. Fuzzy Dino Blanket",
        suggestions: ["Fuzzy Dino Blanket", "Cloud Pillow", "Velvet Bunny Slippers", "Starry Nightcap"]
      }
    ],
    storyGenerator: (answers, heroName) => ({
      scenes: [
        {
          text: `One evening along the Milky Way, ${heroName} decided to pack a cosmic picnic basket filled to the brim with ${answers.sillyFood || "Giggle Tacos"}. Flying through the stardust, they landed on a bouncy purple asteroid where a friendly ${answers.funnyAnimal || "Pajama Penguin"} was doing bedtime stretches.`,
          sleepAffirmation: "Giggle and relax your shoulders."
        },
        {
          text: `Every time the asteroid bounced, it made a hilarious sound: '${answers.goofySound || "Bloop-a-doop"}!' ${heroName} and the ${answers.funnyAnimal || "Pajama Penguin"} shared the delicious ${answers.sillyFood || "Giggle Tacos"} until their bellies were full and warm. The stars twinkled like cheerful smiling eyes in the quiet sky.`,
          sleepAffirmation: "Your belly is warm, and your mind is at ease."
        },
        {
          text: `As the asteroid slowed to a gentle floating glide, ${heroName} unfolded a giant ${answers.cozyItem || "Fuzzy Dino Blanket"} that covered both friends in pure snuggly comfort. 'Time for sweet starry dreams,' yawned the ${answers.funnyAnimal || "Pajama Penguin"}, drifting off into a peaceful sleep.`,
          sleepAffirmation: "Cuddle into your bed, warm and completely cozy. Goodnight!"
        }
      ]
    })
  },
  {
    id: "underwater-bubble-dance",
    title: "The Underwater Bubble Ball",
    theme: "wonder",
    suggestedHeroId: "hero-2",
    fields: [
      {
        key: "sillyColor",
        label: "Glowing Color",
        type: "color",
        placeholder: "e.g. Neon Sparkle Purple",
        suggestions: ["Neon Sparkle Purple", "Golden Sunshine Yellow", "Cotton Candy Blue", "Emerald Mint"]
      },
      {
        key: "sillyDance",
        label: "Goofy Dance Move",
        type: "action",
        placeholder: "e.g. The Jellyfish Wiggle",
        suggestions: ["The Jellyfish Wiggle", "The Penguin Shimmy", "The Slow Sloth Sway", "The Octopus Twirl"]
      },
      {
        key: "soothingThing",
        label: "Peaceful Object",
        type: "item",
        placeholder: "e.g. Glowing Pearl Lamp",
        suggestions: ["Glowing Pearl Lamp", "Seashell Lullaby Box", "Warm Tidepool Sponge", "Velvet Seaweed Hammock"]
      }
    ],
    storyGenerator: (answers, heroName) => ({
      scenes: [
        {
          text: `${heroName} dove beneath the moonlit ocean waves into a lagoon glowing in shades of ${answers.sillyColor || "Neon Sparkle Purple"}. All the gentle sea turtles and friendly sea otters were gathered for the annual Sleepy Bubble Ball.`,
          sleepAffirmation: "Feel floating in gentle, supportive water."
        },
        {
          text: `To start the calm celebration, ${heroName} showed everyone the funniest slow-motion move: ${answers.sillyDance || "The Jellyfish Wiggle"}! Everyone laughed quietly underwater with soft, glowing bubbles that floated up to the moon.`,
          sleepAffirmation: "Release all the tension from your hands and feet."
        },
        {
          text: `At last, ${heroName} placed the ${answers.soothingThing || "Glowing Pearl Lamp"} in the center of the reef. Its gentle amber glow made every wave whisper a soft bedtime song, tucking every sea creature into sweet and restful slumber.`,
          sleepAffirmation: "Drift gently with the calm tide into peaceful dreams."
        }
      ]
    })
  }
];
