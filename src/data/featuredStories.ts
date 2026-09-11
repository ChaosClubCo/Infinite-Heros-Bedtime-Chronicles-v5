import { Story } from '../types';

export const FEATURED_STORIES: Story[] = [
  {
    id: "story-silver-moon-fox",
    title: "The Silver Moon Fox",
    category: "Bedtime Calm",
    theme: "wonder",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Koda",
    summary: "Follow Koda on a whispering journey through the starlit forest to find the missing sparkle of the North Star.",
    badge: "Bedtime Calm",
    audioDurationMinutes: 12,
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-fox-1",
        sceneNumber: 1,
        totalScenes: 4,
        text: "Deep in the whispering Whispering Pines, where silver moss glows like fairy lanterns, Koda the young celestial fox curled his fluffy tail around a slumbering pine cone. High above, the North Star flickered softly, missing its brightest golden sparkle.",
        sleepAffirmation: "Inhale the quiet midnight forest air. You are safe and snug.",
        choices: [
          {
            id: "cf1",
            text: "Follow the trail of glowing stardust across the mossy brook",
            action: "follow_stardust",
            nextSceneId: "scene-fox-2a"
          },
          {
            id: "cf2",
            text: "Ask the sleepy Barn Owl perched in the Ancient Willow",
            action: "ask_owl",
            nextSceneId: "scene-fox-2b"
          }
        ]
      },
      {
        id: "scene-fox-2a",
        sceneNumber: 2,
        totalScenes: 4,
        text: "Koda padded silently across stepping stones bathed in moonlit water. Each step made tiny ripples of starlight sparkle. The river hummed a gentle lullaby, washing away all the noisy thoughts from the day.",
        sleepAffirmation: "Let your mind drift like gentle leaves on cool clear water.",
        choices: [
          {
            id: "cf3",
            text: "Climb the Silver Birch hill to reach the starlight pond",
            action: "climb_hill",
            nextSceneId: "scene-fox-3"
          }
        ]
      },
      {
        id: "scene-fox-2b",
        sceneNumber: 2,
        totalScenes: 4,
        text: "The old Barn Owl blinked slowly with kind amber eyes. 'The sparkle drifted down into the Moonlit Clearing,' the owl whispered softly. 'Go quietly, little fox, and carry the warmth of your heart.'",
        sleepAffirmation: "Feel your shoulders soften and your breathing grow slow and steady.",
        choices: [
          {
            id: "cf4",
            text: "Trot softly toward the shimmering Moonlit Clearing",
            action: "enter_clearing",
            nextSceneId: "scene-fox-3"
          }
        ]
      },
      {
        id: "scene-fox-3",
        sceneNumber: 3,
        totalScenes: 4,
        text: "In the heart of the clearing, resting gently on a bed of glowing bluebell flowers, was the lost sparkle. Koda nudged it with his velvety silver nose. The sparkle chimed like tiny silver chimes and rose into the sky, settling perfectly atop the North Star.",
        sleepAffirmation: "The whole night sky is watching over you with peaceful light.",
        choices: [
          {
            id: "cf5",
            text: "Curle up in the cozy hollow of the crescent moon for sweet dreams",
            action: "sleep_moon",
            nextSceneId: "scene-fox-4"
          }
        ]
      },
      {
        id: "scene-fox-4",
        sceneNumber: 4,
        totalScenes: 4,
        isFinal: true,
        text: "Koda nestled down inside the golden cradle of the crescent moon, his silver fur glowing warm and bright. The forest settled into deep, velvety sleep. 'Rest well, little dreamers everywhere,' Koda whispered. 'The stars are shining, and all is well. Goodnight.'",
        sleepAffirmation: "Close your eyes, breathe gently, and sleep peacefully all night long."
      }
    ]
  },
  {
    id: "story-glow-whale",
    title: "The Glow Whale's Song",
    category: "Ocean Wonders",
    theme: "wonder",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Nova",
    summary: "Follow the majestic glowing whale through the celestial ocean as it sings the ancient melody of peaceful sleep.",
    badge: "Ocean Wonders",
    audioDurationMinutes: 8,
    coverImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-gw-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "In the deep tranquil ocean of the night sky, a gentle blue glow began to hum. A majestic celestial whale, its back dappled with twinkling starlight, swam through silent turquoise currents, sending peaceful waves across the cosmos.",
        sleepAffirmation: "Breathe in the calm cool ocean air. You are peaceful and weightless.",
        choices: [
          {
            id: "cgw1",
            text: "Listen to the whale's deep soothing lullaby",
            action: "listen_lullaby",
            nextSceneId: "scene-gw-2"
          }
        ]
      },
      {
        id: "scene-gw-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The whale's song resonated like soft chime bowls beneath the water. Luminous jellyfish floated in harmony, illuminating a safe path to the sleepy coral reefs where star-turtles were already dreaming.",
        sleepAffirmation: "Feel every muscle in your arms and legs growing heavy and relaxed.",
        choices: [
          {
            id: "cgw2",
            text: "Drift down into the cozy starlight lagoon",
            action: "drift_lagoon",
            nextSceneId: "scene-gw-3"
          }
        ]
      },
      {
        id: "scene-gw-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The gentle waves rocked the starlight lagoon into tranquil silence. The Glow Whale settled onto a soft seabed of glowing velvet sand, sending one last sleepy ripple to tuck you in. Sweet dreams in the quiet deep.",
        sleepAffirmation: "Deep, calm, restful sleep until the morning sun."
      }
    ]
  },
  {
    id: "story-hollow-tree",
    title: "The Hollow Tree Inn",
    category: "Forest & Nature",
    theme: "friendship",
    mode: "classic",
    ageRange: "4-6",
    heroId: "hero-2",
    heroName: "Rowan",
    summary: "Inside the grand glowing ancient oak lies the warmest haven where weary woodland travelers rest among fairy lights.",
    badge: "Forest & Nature",
    audioDurationMinutes: 15,
    coverImage: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-ht-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "High up in the branches of the Great Ancient Oak, glowing lanterns flickered warmly. Mrs. Hedgehog opened the wooden door of The Hollow Tree Inn, welcoming tired squirrel messengers and sleepy dormice to a hearth of crackling cedar embers.",
        sleepAffirmation: "You are welcomed, warm, and cozy right where you are.",
        choices: [
          {
            id: "cht1",
            text: "Sip a cup of hot chamomile tea with honey",
            action: "sip_tea",
            nextSceneId: "scene-ht-2"
          }
        ]
      },
      {
        id: "scene-ht-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The fragrant steam of sweet chamomile filled the wooden room. Soft acorn-shell lamps dimmed to a sleepy amber glow as each woodland guest climbed into hammocks lined with goose-down and dried lavender.",
        sleepAffirmation: "Breathe in warmth and breathe out all worries.",
        choices: [
          {
            id: "cht2",
            text: "Snuggle into the feather-soft moss bed",
            action: "moss_bed",
            nextSceneId: "scene-ht-3"
          }
        ]
      },
      {
        id: "scene-ht-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "Outside, rain tapped softly against the oak leaves, making the inn feel even more warm and sheltered. Mrs. Hedgehog pulled the woolen quilt up to your chin and smiled. 'Safe and sound in the hollow tree. Sleep well, dear friend.'",
        sleepAffirmation: "Warm, safe, protected, and deeply relaxed."
      }
    ]
  },
  {
    id: "story-library-stars",
    title: "Library of Stars",
    category: "Cosmic Adventures",
    theme: "wonder",
    mode: "classic",
    ageRange: "6-8",
    heroId: "hero-3",
    heroName: "Aria",
    summary: "A celestial owl guides you through corridors of glowing star scrolls and constellations resting in nighttime silence.",
    badge: "Cosmic Adventures",
    audioDurationMinutes: 10,
    coverImage: "https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-ls-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Through the floating archway of the Great Celestial Library, tall crystal shelves stretched upward toward infinity. Floating scrolls tied with ribbon made of comet tails gently drifted past in silent reverence.",
        sleepAffirmation: "Knowledge and peace surround you like a quiet starry night.",
        choices: [
          {
            id: "cls1",
            text: "Open the Glowing Constellation Book of Sweet Dreams",
            action: "open_book",
            nextSceneId: "scene-ls-2"
          }
        ]
      },
      {
        id: "scene-ls-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "As the pages turned, gentle starlight lifted from the paper, forming images of floating clouds, quiet castles, and sleeping dragons. The Grand Celestial Owl fluttered down silently and landed atop the velvet desk.",
        sleepAffirmation: "Your thoughts are quiet and peaceful now.",
        choices: [
          {
            id: "cls2",
            text: "Rest on the starlight reading lounge",
            action: "rest_lounge",
            nextSceneId: "scene-ls-3"
          }
        ]
      },
      {
        id: "scene-ls-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The library's golden chandeliers dimmed one by one, leaving only the soft sapphire glow of distant nebulae. The owl folded its wings and closed its eyes. 'Every story for today is finished,' it hummed. 'Time for your own peaceful dreams to begin.'",
        sleepAffirmation: "Tomorrow holds new wonders. Rest peacefully tonight."
      }
    ]
  },
  {
    id: "story-zen-garden",
    title: "Midnight Zen Garden",
    category: "Bedtime Calm",
    theme: "comfort",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-6",
    heroName: "Zenith",
    summary: "Drift into tranquil stillness with gently raked gravel sand, drifting cherry blossom petals, and moonlight.",
    badge: "Bedtime Calm",
    audioDurationMinutes: 20,
    coverImage: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-zg-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Step through the wooden bamboo gate into the quiet Midnight Garden. Beneath your feet, smooth warm river stones guide the way. The air smells of rain on stone and fresh pine needles.",
        sleepAffirmation: "Step by step, leaving all tension behind.",
        choices: [
          {
            id: "czg1",
            text: "Sit by the gently raked concentric gravel circles",
            action: "sit_gravel",
            nextSceneId: "scene-zg-2"
          }
        ]
      },
      {
        id: "scene-zg-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "A single bamboo water fountain sounds a gentle hollow 'tok'... followed by the quiet trickle of spring water. Pink cherry blossom petals drift down through the moonlit mist, landing soundlessly on the still garden pond.",
        sleepAffirmation: "Feel the calm rhythm of the garden water flowing through you.",
        choices: [
          {
            id: "czg2",
            text: "Close your eyes and breathe with the nighttime breeze",
            action: "breathe_breeze",
            nextSceneId: "scene-zg-3"
          }
        ]
      },
      {
        id: "scene-zg-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The stone lantern glows with a warm, steady candlelight. The night is still, cool, and perfectly balanced. Breathe in calm... breathe out peace. You are completely centered and ready for restful sleep.",
        sleepAffirmation: "Mind still, body light, peaceful dreams all through the night."
      }
    ]
  },
  {
    id: "story-coral-lagoon",
    title: "The Coral Lagoon Lullaby",
    category: "Ocean Wonders",
    theme: "wonder",
    mode: "sleep",
    ageRange: "2-4",
    heroId: "hero-1",
    heroName: "Nova",
    summary: "Float with sleepy sea turtles and glowing pearl shells through a warm, calm turquoise lagoon.",
    badge: "Ocean Wonders",
    audioDurationMinutes: 6,
    coverImage: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-cl-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Beneath the moonlit waves, the warm lagoon water gently rocks back and forth. A little sea turtle paddles slowly, tucking its sleepy head inside its cozy shell.",
        sleepAffirmation: "Floating soft and calm, like gentle waves on the sand.",
        choices: [
          {
            id: "ccl1",
            text: "Rest near the glowing pearl reef",
            action: "rest_reef",
            nextSceneId: "scene-cl-2"
          }
        ]
      },
      {
        id: "scene-cl-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Soft pink anemones sway in the tide like dreaming flowers. The water is cozy, warm, and crystal clear. Every little fish has found its resting alcove for the night.",
        sleepAffirmation: "Let your breath roll in and out like gentle ocean waves.",
        choices: [
          {
            id: "ccl2",
            text: "Close your eyes in the warm velvet current",
            action: "warm_current",
            nextSceneId: "scene-cl-3"
          }
        ]
      },
      {
        id: "scene-cl-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The moonbeams reach down to the seafloor, lighting up a blanket of golden sand. All is peaceful beneath the waves. Goodnight, little ocean explorer.",
        sleepAffirmation: "Deep, quiet, peaceful sleep all night long."
      }
    ]
  },
  {
    id: "story-bear-lantern",
    title: "The Little Bear's Pocket Lantern",
    category: "Heartwarming Fables",
    theme: "kindness",
    mode: "classic",
    ageRange: "4-6",
    heroId: "hero-5",
    heroName: "Pip",
    summary: "Barnaby the little bear shares glowing firefly sparks with his woodland neighbors on a frosty evening.",
    badge: "Heartwarming Fables",
    audioDurationMinutes: 7,
    coverImage: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-bl-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Barnaby the little brown bear held his tin pocket lantern carefully between his paws. Inside, three friendly fireflies buzzed with warm honey-yellow light, lighting his way along the pinecone path.",
        sleepAffirmation: "Kindness is a warm spark that lights up every room.",
        choices: [
          {
            id: "cbl1",
            text: "Share a spark with the shivering baby hedgehog",
            action: "share_spark",
            nextSceneId: "scene-bl-2"
          }
        ]
      },
      {
        id: "scene-bl-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Barnaby tipped his lantern and let a warm golden spark land on the hedgehog's cozy leaf nest. 'Thank you, Barnaby,' the hedgehog yawned happily, curling into a round ball of warmth.",
        sleepAffirmation: "Sharing warmth makes your own heart glow brightest.",
        choices: [
          {
            id: "cbl2",
            text: "Trot home to the snug cave bed",
            action: "trot_home",
            nextSceneId: "scene-bl-3"
          }
        ]
      },
      {
        id: "scene-bl-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "Back in his cozy den, Mama Bear tucked Barnaby into a blanket lined with soft clover. The lantern dimmed to a quiet whisper. 'You shared your light today, little bear,' she whispered. 'Sleep sweet and warm.'",
        sleepAffirmation: "You are snug, you are loved, and you are safe."
      }
    ]
  },
  {
    id: "story-cloud-hopper",
    title: "The Moonbeam Cloud Hopper",
    category: "Cosmic Adventures",
    theme: "wonder",
    mode: "classic",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Nova",
    summary: "Hop across fluffy lavender cumulus clouds on a journey to the silvery Moon Palace.",
    badge: "Cosmic Adventures",
    audioDurationMinutes: 5,
    coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
    scenes: [
      {
        id: "scene-ch-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "High above the sleepy rooftops, the clouds turned from peach to pastel purple. Each cloud was softer than a feather pillow, bouncing gently underfoot.",
        sleepAffirmation: "Feel yourself floating high above all daily cares.",
        choices: [
          {
            id: "cch1",
            text: "Leap onto the glowing rainbow cloud bridge",
            action: "leap_bridge",
            nextSceneId: "scene-ch-2"
          }
        ]
      },
      {
        id: "scene-ch-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The cloud bridge shimmered with lavender and gold. Floating star-bubbles drifted past, popping with tiny musical notes of peaceful lullabies.",
        sleepAffirmation: "Every breath lifts you into calm, quiet comfort.",
        choices: [
          {
            id: "cch2",
            text: "Snuggle into the giant moon-cloud cradle",
            action: "moon_cradle",
            nextSceneId: "scene-ch-3"
          }
        ]
      },
      {
        id: "scene-ch-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The giant moon-cloud wrapped softly around you like a warm embrace. The silver stars winked goodnight from above. Tomorrow will be wonderful; sleep deeply tonight.",
        sleepAffirmation: "Soft clouds, gentle dreams, peaceful night."
      }
    ]
  }
];
