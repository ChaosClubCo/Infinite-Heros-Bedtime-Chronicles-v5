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
  },
  {
    id: "cloud-castle-slumber",
    title: "The Cloud Castle Slumber Party",
    theme: "comfort",
    suggestedHeroId: "hero-1",
    fields: [
      {
        key: "cloudFlavor",
        label: "Cloud Flavor",
        type: "food",
        placeholder: "e.g. Vanilla Marshmallow",
        suggestions: ["Vanilla Marshmallow", "Lavender Honey", "Cinnamon Cocoa", "Strawberry Stardust"]
      },
      {
        key: "sleepyFriend",
        label: "Sleepy Sidekick",
        type: "animal",
        placeholder: "e.g. Fluffy Cloud Badger",
        suggestions: ["Fluffy Cloud Badger", "Yawning Moon Rabbit", "Sleepy Little Owl", "Dreamy Baby Panda"]
      },
      {
        key: "magicSpell",
        label: "Bedtime Magic Word",
        type: "sound",
        placeholder: "e.g. Shush-a-bye-zoom",
        suggestions: ["Shush-a-bye-zoom", "Puff-puff-snuggle", "Tuck-in-twinkle", "Lullaby-loo"]
      },
      {
        key: "cozyBed",
        label: "Dream Bedding",
        type: "item",
        placeholder: "e.g. Cotton Candy Hammock",
        suggestions: ["Cotton Candy Hammock", "Golden Silk Cloud Pillow", "Velvet Starlight Quilt", "Warm Moonlight Nest"]
      }
    ],
    storyGenerator: (answers, heroName) => ({
      scenes: [
        {
          text: `High above the sleepy world, ${heroName} climbed a rainbow staircase into the kingdom of clouds, where every puffy cloud tasted like delicious ${answers.cloudFlavor || "Vanilla Marshmallow"}. Waiting at the gates was a ${answers.sleepyFriend || "Fluffy Cloud Badger"} wearing tiny velvet nightcaps.`,
          sleepAffirmation: "Feel as light and relaxed as a floating cloud."
        },
        {
          text: `Together, they whispered the ancient bedtime chant: '${answers.magicSpell || "Puff-puff-snuggle"}!' Instantly, the castle's starry windows dimmed to a gentle golden glow, and the breeze began to play a soothing lullaby.`,
          sleepAffirmation: "Let your breath slow down into an easy rhythm."
        },
        {
          text: `${heroName} tucked the ${answers.sleepyFriend || "Fluffy Cloud Badger"} into a cozy ${answers.cozyBed || "Cotton Candy Hammock"}. With a soft yawn, the stars tucked their light behind silver mist, watching over dreamers everywhere.`,
          sleepAffirmation: "You are snug, warm, and safe in your bed. Goodnight."
        }
      ]
    })
  },
  {
    id: "whispering-dragon-garden",
    title: "The Gentle Dragon's Tea Garden",
    theme: "kindness",
    suggestedHeroId: "hero-3",
    fields: [
      {
        key: "dragonName",
        label: "Dragon's Nickname",
        type: "noun",
        placeholder: "e.g. Pip the Spark",
        suggestions: ["Pip the Spark", "Barnaby Bumbles", "Barnaby Paws", "Buttercup the Gentle"]
      },
      {
        key: "warmDrink",
        label: "Soothing Bedtime Drink",
        type: "food",
        placeholder: "e.g. Chamomile Star-Drop Tea",
        suggestions: ["Chamomile Star-Drop Tea", "Warm Cinnamon Oat Milk", "Sweet Honey Blossom Nectar", "Hot Vanilla Cocoa"]
      },
      {
        key: "gentleSound",
        label: "Calm Sound",
        type: "sound",
        placeholder: "e.g. Purr-whistle-hum",
        suggestions: ["Purr-whistle-hum", "Tinkle-tinkle-chime", "Swoosh-swoosh-sigh", "Chirp-chirp-hush"]
      },
      {
        key: "comfortGift",
        label: "Gift of Kindness",
        type: "item",
        placeholder: "e.g. Glowing Ember Crystal",
        suggestions: ["Glowing Ember Crystal", "Soft Knitted Scarf", "Lullaby Music Seed", "Star Moss Blanket"]
      }
    ],
    storyGenerator: (answers, heroName) => ({
      scenes: [
        {
          text: `In a quiet glade hidden by glowing silver ferns, ${heroName} met a tiny dragon named ${answers.dragonName || "Pip the Spark"}, who used gentle, smoke-free sparks to brew warm cups of ${answers.warmDrink || "Chamomile Star-Drop Tea"}.`,
          sleepAffirmation: "Breathe in warmth, breathe out the busy day."
        },
        {
          text: `Whenever the dragon took a sip, it let out a happy '${answers.gentleSound || "Purr-whistle-hum"}' that caused the night-blooming jasmine flowers to sway and release a sweet lavender fragrance.`,
          sleepAffirmation: "Feel a wave of calm relaxation from your head to your toes."
        },
        {
          text: `Before curling up for bed, ${heroName} gave ${answers.dragonName || "Pip the Spark"} a special ${answers.comfortGift || "Glowing Ember Crystal"} that cast soft amber shadows across the mossy ground. Together, they drifted into a restful and peaceful sleep.`,
          sleepAffirmation: "Kind thoughts bring the sweetest dreams. Sleep well."
        }
      ]
    })
  },
  {
    id: "dreamland-express",
    title: "The Midnight Starlight Express",
    theme: "wonder",
    suggestedHeroId: "hero-4",
    fields: [
      {
        key: "trainSound",
        label: "Train Rhythm Sound",
        type: "sound",
        placeholder: "e.g. Chugga-chugga-hush",
        suggestions: ["Chugga-chugga-hush", "Click-clack-lullaby", "Woo-woo-whisper", "Chug-chug-snooze"]
      },
      {
        key: "sleepyPassenger",
        label: "Funny Passenger",
        type: "animal",
        placeholder: "e.g. Pajama Koala",
        suggestions: ["Pajama Koala", "Sleepy Sloth Conductor", "Hedgehog in Slippers", "Gentle Giant Turtle"]
      },
      {
        key: "snuggleSnack",
        label: "Midnight Snack",
        type: "food",
        placeholder: "e.g. Moon Sugar Cookies",
        suggestions: ["Moon Sugar Cookies", "Starlight Berry Muffins", "Warm Apple Crisp", "Honey Crumpets"]
      },
      {
        key: "dreamStation",
        label: "Final Sleep Station",
        type: "place",
        placeholder: "e.g. Pillow Mountain Peak",
        suggestions: ["Pillow Mountain Peak", "Valley of Sweet Dreams", "Golden Cloud Harbor", "Starry Lagoon Station"]
      }
    ],
    storyGenerator: (answers, heroName) => ({
      scenes: [
        {
          text: `The golden train glided smoothly along tracks made of pure starlight with a soothing rhythm: '${answers.trainSound || "Chugga-chugga-hush"}'. ${heroName} held the golden ticket and walked into the cozy passenger car.`,
          sleepAffirmation: "Listen to the steady rhythm of your breathing."
        },
        {
          text: `Sitting in a velvet armchair was a ${answers.sleepyPassenger || "Pajama Koala"}, happily sharing a plate of fresh ${answers.snuggleSnack || "Moon Sugar Cookies"} while gazing out at colorful passing constellations.`,
          sleepAffirmation: "Let your body sink comfortably into your bed."
        },
        {
          text: `The train gently slowed down as it arrived at ${answers.dreamStation || "Pillow Mountain Peak"}. The conductor dimmed the lanterns, and all the passengers closed their eyes, ready for a night of wondrous adventures in dreamland.`,
          sleepAffirmation: "You are safely arrived in dreamland. Rest deep and sweet."
        }
      ]
    })
  }
];
