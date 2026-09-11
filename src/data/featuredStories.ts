import { Story } from '../types';

export const FEATURED_STORIES: Story[] = [
  {
    id: "story-starry-whales",
    title: "The Starry Whales",
    category: "Cosmic",
    theme: "wonder",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Nova",
    summary: "Two massive, translucent cosmic whales swim gracefully through a vibrant starry nebula, singing an ancient lullaby of starlight to soothe the dreaming cosmos.",
    badge: "Editor's Pick",
    isEditorPick: true,
    audioDurationMinutes: 12,
    rating: 4.9,
    tags: ["Cosmic", "Editor's Pick", "Lullaby"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDU01GMHkodjoEALGrW-gPsSWLA43av0ycB6PWWTGFWPyhqoxc75Dv98XXrZylRb_MBUkiZVD1hH6bnl11gQXQzw3uiHT_N_zDaTQdVYcfNTPNgTM0D820i1hGDb9NsRXpziCHmU8w4Sa6_LkgKo-BuV1rMMYKsW3vpWuDX7SALpoO4sg9PaKdHZswEmp-0NUwaPvj6IYVWvHgJ1d9LRbK2UKW39PmknMqZ84ITvTr95XdRCAAYtaUj8bjH1X-DJgYWlS2wsGRp4Hg",
    scenes: [
      {
        id: "scene-sw-1",
        sceneNumber: 1,
        totalScenes: 4,
        text: "Across the deep indigo expanse of the universe, two majestic whales of translucent starlight glided through glowing violet clouds. Their gentle fins left shimmering wakes of comet dust that sparkled like diamonds in the quiet dark.",
        sleepAffirmation: "Feel yourself drifting weightlessly, calm and deeply safe.",
        choices: [
          {
            id: "csw1",
            text: "Listen to their deep melodic cosmic song",
            action: "listen_song",
            nextSceneId: "scene-sw-2"
          }
        ]
      },
      {
        id: "scene-sw-2",
        sceneNumber: 2,
        totalScenes: 4,
        text: "The whales sang a low, rhythmic vibration that echoed through every star cluster. The sound was like warm ocean waves washing softly against a quiet shore, slowing down the pulse of the nighttime sky.",
        sleepAffirmation: "With every breath, let your worries dissolve into stardust.",
        choices: [
          {
            id: "csw2",
            text: "Swim alongside the luminous calf into the sleepy nebula",
            action: "swim_along",
            nextSceneId: "scene-sw-3"
          }
        ]
      },
      {
        id: "scene-sw-3",
        sceneNumber: 3,
        totalScenes: 4,
        text: "The smaller calf nudged a sleeping crescent moon, tucking it into a soft blanket of magenta space clouds. Little constellations turned down their lanterns, dimming to a sleepy golden glow.",
        sleepAffirmation: "Your room is filled with gentle starlight and tranquil peace.",
        choices: [
          {
            id: "csw3",
            text: "Rest peacefully in the warm glow of the cosmic current",
            action: "rest_current",
            nextSceneId: "scene-sw-4"
          }
        ]
      },
      {
        id: "scene-sw-4",
        sceneNumber: 4,
        totalScenes: 4,
        isFinal: true,
        text: "The starry whales circled one last time before resting on a bed of dark velvet space. Their song faded into a gentle whisper: 'Sleep now, little hero. The cosmos is peaceful, and tomorrow waits with open arms.'",
        sleepAffirmation: "Deep, soothing rest until the morning light."
      }
    ]
  },
  {
    id: "story-boy-caught-star",
    title: "The Boy Who Caught a Star",
    category: "Cosmic",
    theme: "wonder",
    mode: "classic",
    ageRange: "6-8",
    heroId: "hero-3",
    heroName: "Leo",
    summary: "Join Leo on an adventure across floating galactic islands to return a fallen star to its constellation before dawn.",
    badge: "Featured Story",
    isEditorPick: true,
    audioDurationMinutes: 10,
    rating: 4.8,
    tags: ["Cosmic", "Adventure"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAmSU3uL0LxNubjQztdBbC-mUFRoy3Y-b2M3D-7umWu7hReTuhXj--PekclI9A-Jz5k_JTuu3MGKc3LSki2Ru-pHJBZtxwlFxj_9CcKOa0O7A5x8OPudaMq4OEHgw_DOpqAlOXxcXI2jkKPdd2lS9B6HzpMX6q4MouEg00DOecFYlKnh4PKBsEAWAgOmhvl83mFXqRQkdQhkyzF4BeKJRcUEcbfZkXCjXtbGOfWs7tkc2TYTzUOM69HRybYNuzMiqQLv0AmML5RQlE",
    scenes: [
      {
        id: "scene-bcs-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "One quiet evening, a little star tumbled softly from the constellation Leo, landing like a warm glowing lantern in the palm of young Leo's hand. It chimed like tiny silver bells, whispering that it missed its home in the sky.",
        sleepAffirmation: "You hold a spark of wonder inside your heart.",
        choices: [
          {
            id: "cbcs1",
            text: "Step onto the floating moon-bridge upward",
            action: "climb_bridge",
            nextSceneId: "scene-bcs-2"
          }
        ]
      },
      {
        id: "scene-bcs-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Stepping across stepping-stones made of starlight and purple mist, Leo climbed past floating spires and friendly celestial foxes. With every step, the night grew quieter and warmer.",
        sleepAffirmation: "Each breath lifts you higher into peaceful quietude.",
        choices: [
          {
            id: "cbcs2",
            text: "Gently place the star back into its constellation cradle",
            action: "return_star",
            nextSceneId: "scene-bcs-3"
          }
        ]
      },
      {
        id: "scene-bcs-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The little star settled back into its starry crown, beaming with gratitude and showering Leo with warm golden sparkles. Leo curled up on a cloud hammock, safe under its friendly watchful glow.",
        sleepAffirmation: "You are home, warm, safe, and ready to dream."
      }
    ]
  },
  {
    id: "story-candy-cloud",
    title: "The Candy Cloud Kingdom",
    category: "Magical",
    theme: "imagination",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-2",
    heroName: "Rowan",
    summary: "A whimsical journey to a pastel wonderland with trees made of soft pink cotton candy and rivers of warm vanilla milk.",
    badge: "Dreamy",
    audioDurationMinutes: 8,
    rating: 4.8,
    tags: ["Dreamy", "Magical"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPh14WrUseNbrng76pw-xnng-FUUvw2gfQ0fZBifKO-t3LOdGlu1etQhoUmNPZ0kBgpO5JWYM03drhNpjCeHndieD9auWMR9GwWg8FgxquSQ4zLgVf1oSwUeEU5nXx6VNpTsA5o0vJtX5_5H377aNMFRpoOnnzztXHV_6JLJ5DH_mDJbfR5tzzFNH3w1ucp95rSzsHVpX4GR8Crvd-Rz3P7cuVOOtFaxxAUspJpvz0dqnK3BnvjEAf11dsJVj1zVsq4xTeG2gqwdY",
    scenes: [
      {
        id: "scene-cc-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "In the gentle pastel sunset, where clouds taste like strawberry spun sugar and breezes smell of sweet cinnamon, stands the great Candy Cloud Tree. Its leaves are soft and fluffy like giant pillows.",
        sleepAffirmation: "Let sweet, happy thoughts fill your imagination.",
        choices: [
          {
            id: "ccc1",
            text: "Take a restful nap beneath the cotton-candy boughs",
            action: "nap_tree",
            nextSceneId: "scene-cc-2"
          }
        ]
      },
      {
        id: "scene-cc-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Friendly sugar-sparrows flutter down, carrying ribbons of marshmallow fluff to tuck you in. The warm vanilla stream hums a slow, cozy lullaby as soft marshmallow snowflakes drift down.",
        sleepAffirmation: "Feel every muscle relax into soft comfort.",
        choices: [
          {
            id: "ccc2",
            text: "Drift away on a pink cloud boat down the honey stream",
            action: "drift_boat",
            nextSceneId: "scene-cc-3"
          }
        ]
      },
      {
        id: "scene-cc-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The cloud boat comes to rest in a sleepy lagoon of sweet warm dreams. The candy stars above glow with comforting rose-gold light. Goodnight, sweet dreamer.",
        sleepAffirmation: "Gentle dreams, soft pillows, and sweet rest."
      }
    ]
  },
  {
    id: "story-lunar-lullaby",
    title: "Lunar Lullaby",
    category: "Bedtime Calm",
    theme: "comfort",
    mode: "sleep",
    ageRange: "2-4",
    heroId: "hero-1",
    heroName: "Koda",
    summary: "A serene, glowing crescent moon nestled among soft purple clouds rocks the dreaming world gently into restful sleep.",
    badge: "Sleepy",
    audioDurationMinutes: 5,
    rating: 4.9,
    tags: ["Sleepy", "Bedtime Calm"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoULdQcAPoG7gsJWq9JcL7FxtXSPlI9tN64Ae0WrEWVLGmlMIwOI8ZQahfzZtzwYNUIs2P6xv_43VqKxanuFBL8rDzG-n7KmA1uQhjPiZlVH-zCSQHU0iRkUSvU_EToyQuCCKZkUD6I4RXVIDnXUMSScm8mPmoZmHjUgmOVfd1uPiYMh0cdqR4iSwyRI9mZpi1He3mXsu2_CnMVdrrARwIvi0xKth3a6LwFri6CADai-6A8Lk6Jbg74WV07mV9STkbYT1Kq6GYJrQ",
    scenes: [
      {
        id: "scene-ll-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "High in the quiet velvet sky, the golden crescent moon smiled kindly down on every bedroom window. It rocked slowly, back and forth, like a grand cradle made of pure light.",
        sleepAffirmation: "Breathe in peace, breathe out and rest.",
        choices: [
          {
            id: "cll1",
            text: "Climb into the soft velvet hollow of the moon",
            action: "climb_moon",
            nextSceneId: "scene-ll-2"
          }
        ]
      },
      {
        id: "scene-ll-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The clouds surrounding the moon were colored in shades of lavender and dusky plum. Each cloud wrapped around like the softest weighted blanket, keeping all worries far away.",
        sleepAffirmation: "You are snug, warm, and deeply cared for.",
        choices: [
          {
            id: "cll2",
            text: "Close your heavy eyes and listen to the star song",
            action: "listen_song",
            nextSceneId: "scene-ll-3"
          }
        ]
      },
      {
        id: "scene-ll-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The stars blinked in rhythm with your breathing: in... and out... in... and out. The world is fast asleep, and all is wonderfully peaceful. Goodnight.",
        sleepAffirmation: "Peaceful dreams, quiet night, sleep till morning light."
      }
    ]
  },
  {
    id: "story-constellation-quest",
    title: "Constellation Quest",
    category: "Cosmic",
    theme: "courage",
    mode: "classic",
    ageRange: "6-8",
    heroId: "hero-3",
    heroName: "Orion",
    summary: "Join Orion on a journey across starlit skies to find the missing stars of the Big Dipper and restore celestial harmony.",
    badge: "Adventure",
    audioDurationMinutes: 15,
    rating: 4.8,
    tags: ["Adventure", "Cosmic"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBho9mGv3GsAEfaSeVsOSGL9-dArgp6fVFZpWyizu8Qx1l5nzGEbmWdXmEJSQgHDfr5M7UetysyS3xzqtstFUjCu7-VGlrORuz1Gmv2hi18XOaB2kJpA16VMxacjViw--RvbIgUzruDQ4478jo7PEx-G-i61D83D34njP6K7c5qUktTr6U_5eUnti68kvBT1RuTSzNFyorZC3AVBXO8AJiqWZw0JFbpK6xxzqf-XvhHeltH2duCMDK_A9R7M5Fa9akQvMp5_XRit-0",
    scenes: [
      {
        id: "scene-cq-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Orion the starlight traveler looked through his brass cosmic telescope. Three bright pointer stars were missing from the great sky wagon, and the nocturnal skies needed their guidance to guide sleepy dreamers.",
        sleepAffirmation: "You are brave, kind, and capable.",
        choices: [
          {
            id: "ccq1",
            text: "Follow the trail of glowing meteor dust across the sky",
            action: "follow_trail",
            nextSceneId: "scene-cq-2"
          }
        ]
      },
      {
        id: "scene-cq-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Along the celestial rim, Orion found the missing stars resting in a nest of soft nebula dust, tired from their long year of shining. With a gentle touch of his staff, he rekindled their warm silver light.",
        sleepAffirmation: "Rest restores your strength and brightens your light.",
        choices: [
          {
            id: "ccq2",
            text: "Guide the stars back to their resting places in the Dipper",
            action: "guide_stars",
            nextSceneId: "scene-cq-3"
          }
        ]
      },
      {
        id: "scene-cq-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The Big Dipper shone complete once more, scooping up sweet dreams from the Milky Way to pour gently over the sleeping earth. Mission accomplished, Orion lowered his telescope and rested.",
        sleepAffirmation: "All is safe, all is guided, all is well."
      }
    ]
  },
  {
    id: "story-whispering-nebulas",
    title: "The Whispering Nebulas",
    category: "Cosmic",
    theme: "comfort",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Nova",
    summary: "A soothing tale of clouds that sing you to sleep with shimmering stardust particles and tranquil celestial melodies.",
    badge: "Sleepy",
    audioDurationMinutes: 10,
    rating: 4.9,
    tags: ["Sleepy", "Cosmic"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_QCBBgLSmxP0ONKEuOrnh0Dsg8MYiiMqlpZOCHLhpXB-5WkLm6d_XQc4b7s6U0LocANm1hPZvAfSppGMpbusWRxf7LKmgQogy9Efow7XyjoIN3DTPSbA2Q_-OKjibO8YoIMGqiA6KumJjV1OzGvKWMaH7XDkWgiO2d_58LH0a9RSHH-2CkHUOgSx47zj1WPjZjb1skneqeGlsJT7JabI-Gc8AiyZ6fhSF7Yg1dCncQO3ip8dMr4ak3oCf0--WXAAfslJHT5sHa_U",
    scenes: [
      {
        id: "scene-wn-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "In the far quiet corners of the cosmos, glowing amber and amethyst clouds float silently. Unlike earth clouds, these nebulas sing a soothing melody of quiet chimes and warm cosmic dust.",
        sleepAffirmation: "Listen to the quiet rhythm of the universe.",
        choices: [
          {
            id: "cwn1",
            text: "Drift gently through the warm glowing mist",
            action: "drift_mist",
            nextSceneId: "scene-wn-2"
          }
        ]
      },
      {
        id: "scene-wn-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Tiny floating stardust motes dance like fireflies in slow motion. When you breathe in, they glow softly with golden light; when you breathe out, they slowly dim to velvet purple.",
        sleepAffirmation: "Breathe in warm light, breathe out tension.",
        choices: [
          {
            id: "cwn2",
            text: "Nestle into the cloud of stardust for deep sleep",
            action: "nestle_stardust",
            nextSceneId: "scene-wn-3"
          }
        ]
      },
      {
        id: "scene-wn-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The nebula's whisper wraps you in cozy safety: 'Hush now, little dreamer, rest your eyes. The night is a blanket, the stars are your guide.' Sweet dreams.",
        sleepAffirmation: "Deep, quiet, peaceful sleep all through the night."
      }
    ]
  },
  {
    id: "story-journey-core",
    title: "Journey to the Core",
    category: "Cosmic",
    theme: "wonder",
    mode: "classic",
    ageRange: "6-8",
    heroId: "hero-4",
    heroName: "Sol",
    summary: "A dazzling deep-space exploration to the warm glowing heart of a gentle star nursery where new constellations are born.",
    badge: "Cosmic",
    audioDurationMinutes: 15,
    rating: 4.8,
    tags: ["Cosmic", "Exploration"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcazXklGr_dSyJDKKzV9nE6RRGi5mCvYfsHtgYtnUNpUY2ebB_2kRSMOgSU0gEw4jcTbJ82hze2WIkFftzv3hlTg1ClditxLWOkV2fI-d26I4OycWjfcMmw4DRw9EuZknxGh_Ag_9bP7AArY2jlmjDOCNQxPtfV1m_qMHsGvH7Jin_LuzxR9uUiboa3NayHIY-av2O8qRK6lcSHYJKRfcV5H4Y-H6kFXbdjT6ej-cw3YSXksDY93DiJ2yVbnu_4WPP4ot_MAE8WB8",
    scenes: [
      {
        id: "scene-jc-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Deep inside the Great Orion Nebula, swirls of golden star-gas illuminated a path toward the radiant Stellar Nursery. Sol the Sun Guardian adjusted his golden cape and steered his starlight glider forward.",
        sleepAffirmation: "You carry a warm, radiant light within yourself.",
        choices: [
          {
            id: "cjc1",
            text: "Glide toward the golden cradle of nascent stars",
            action: "glide_cradle",
            nextSceneId: "scene-jc-2"
          }
        ]
      },
      {
        id: "scene-jc-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Baby stars, no bigger than glowing lanterns, floated in gentle orbits around a crystal hearth. Sol gently sang a lullaby of warmth and protection, tucking each newborn star into its orbital crib.",
        sleepAffirmation: "Warmth and safety cradle you right now.",
        choices: [
          {
            id: "cjc2",
            text: "Rest by the radiant starlight hearth",
            action: "rest_hearth",
            nextSceneId: "scene-jc-3"
          }
        ]
      },
      {
        id: "scene-jc-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The radiant core settled into a soft, steady pulse, radiating calming warmth across galaxies. Sol folded his golden wings and smiled: 'Rest now, young star. You shine bright, and tomorrow brings new adventures.'",
        sleepAffirmation: "Warm, safe, and deeply peaceful sleep."
      }
    ]
  },
  {
    id: "story-astro-pups",
    title: "Astro Pups",
    category: "Cosmic",
    theme: "friendship",
    mode: "classic",
    ageRange: "4-6",
    heroId: "hero-5",
    heroName: "Pip",
    summary: "A playful, heartwarming journey of little puppy astronauts floating through zero gravity and bouncing on moon-beams.",
    badge: "New Arrival",
    audioDurationMinutes: 5,
    rating: 4.9,
    tags: ["New Arrivals", "Playful"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHemjcFVQty3bEzUQBmwEpkrUu6d36cFYYIcnjAkSJ6Clv-fAOrZeY0zFKKNiL4BnSxLyc2L-8O3nW3wAzCwNXC_imd1QNVmtwL49VxYDtjMSwLUBuOOa8IHJC4BfhJNK6-BXoKbglomE15C2L2ut8xO5Uyjt3NaBPPxAioBUkXn6AYRYm3LsRcHKEuQz1us7Jkg3SOU521FBQr3LrvukMvHGa7uloGDUwAgCaKINJx3XPOZRl848UtarqXC3Y0pkDDv_Z4VonA-I",
    scenes: [
      {
        id: "scene-ap-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Pip the Astro Pup wagged his tail inside his cozy round helmet. Floating gently in zero gravity, he did a slow mid-air somersault and barked happily at a passing cluster of rainbow space bubbles.",
        sleepAffirmation: "Happiness and lightness surround you like weightless bubbles.",
        choices: [
          {
            id: "cap1",
            text: "Pounce gently on a floating moon cheese treat",
            action: "pounce_treat",
            nextSceneId: "scene-ap-2"
          }
        ]
      },
      {
        id: "scene-ap-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "Pip and his puppy crew floated down onto a crater lined with soft space moss. They curled up into a warm puppy pile under the giant glowing blue earth above, their tiny paws twitching in happy dreams.",
        sleepAffirmation: "You are surrounded by comfort and friendly companionship.",
        choices: [
          {
            id: "cap2",
            text: "Close your eyes in the warm astronaut blanket",
            action: "sleep_blanket",
            nextSceneId: "scene-ap-3"
          }
        ]
      },
      {
        id: "scene-ap-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "Pip yawned a long, sleepy puppy yawn and tucked his nose under his paw. The stars blinked softly like a nighttime nightlight. Sleep tight, little astro pup.",
        sleepAffirmation: "Snug, sleepy, and dreaming sweet puppy dreams."
      }
    ]
  },
  {
    id: "story-planet-giggles",
    title: "Planet Giggles",
    category: "Cosmic",
    theme: "imagination",
    mode: "classic",
    ageRange: "2-4",
    heroId: "hero-5",
    heroName: "Pip",
    summary: "A friendly ringed planet with warm glowing crater smiles tickles passing comets and sings sleepy rhymes.",
    badge: "New Arrival",
    audioDurationMinutes: 8,
    rating: 4.8,
    tags: ["New Arrivals", "Gentle"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBz2xEBaRvwT_gIR5W88HRz6xY5TPjJiSO9rERAXFvCzpEOqOC2el81Q9oOJv2cMPuCwGLszvoHV1yzXj_t-XCEdiJmLm2kb6MWeYOUnq_z3K2XZw7XBC3_-TAMoxM40NG6QeQiaHFxfZkLe8f21OLLetVZYr7EyDlEXje_4zRR-S7n-vePc09yPbTAJux6KXZRsqBL11_i440hOTKMUrTTDpAcs-qqMysmUqPT8WUV0dcEMycvGLiWnR1QjNkHn1Gz04YHQzzUGcQ",
    scenes: [
      {
        id: "scene-pg-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "Out beyond Saturn, Planet Giggles spun with a happy glow. Its shiny planetary rings spun around like glowing hula hoops, and whenever a comet zoomed past, it would chuckle with a warm, rumbling laugh.",
        sleepAffirmation: "Smiles bring warmth to your chest and shoulders.",
        choices: [
          {
            id: "cpg1",
            text: "Slide down the smooth cyan rings of starlight",
            action: "slide_rings",
            nextSceneId: "scene-pg-2"
          }
        ]
      },
      {
        id: "scene-pg-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The slide was as gentle as a playground slide made of velvet ribbon. Little star-creatures giggled softly, blowing lavender bubbles of sleep into the night air.",
        sleepAffirmation: "Feel a gentle smile resting on your face as you relax.",
        choices: [
          {
            id: "cpg2",
            text: "Curl up in the soft crater cradle for bedtime",
            action: "sleep_crater",
            nextSceneId: "scene-pg-3"
          }
        ]
      },
      {
        id: "scene-pg-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "Planet Giggles slowly slowed its spin to a tranquil hum, closing its glowing crater eyes. 'Night night, little universe,' it whispered. Sweet dreams everywhere.",
        sleepAffirmation: "Rest easy, rest happy, and sleep until dawn."
      }
    ]
  },
  {
    id: "story-moon-owl",
    title: "The Moon Owl",
    category: "Winter",
    theme: "wonder",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-3",
    heroName: "Aria",
    summary: "Perched high upon the glowing golden crescent moon, the gentle robotic owl watches over snow-dusted mountains and quiet nights.",
    badge: "New Arrival",
    audioDurationMinutes: 12,
    rating: 4.9,
    tags: ["Winter", "New Arrivals"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5CJdNp2Xw118e-2CGSyLc2r8dQYOgomw1C6TS4u6zyKqehDq2pa8K6vg9y8WZwIHMwRQQxI1GhG9gQ1Txg8RGGYQ5-8sXm3HwbW7OPrA4TdwcDMIj51yOsvFNEzevpjrtiq3rSDRy8UPBMlEK19EJbm8yGnW6yNs7PklkcIcYnafc1qtjFWFpXNHyivUeac85-2SnmHEYJaVZcUxarQ5tN7oMpOuGCWGSk-N0nGk8LfwaoDJxkDTxQxtiyifxL54KP42TA0BAxvg",
    scenes: [
      {
        id: "scene-mo-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "On a snow-capped peak under a cold, brilliant sky of twinkling northern stars, the Moon Owl perched on a curved golden sickle moon. Its metallic feathers glowed with warm brass and gold, keeping the chill far away.",
        sleepAffirmation: "Warmth wraps around you like a feather coat.",
        choices: [
          {
            id: "cmo1",
            text: "Listen to the owl's gentle mechanical chime lullaby",
            action: "listen_chime",
            nextSceneId: "scene-mo-2"
          }
        ]
      },
      {
        id: "scene-mo-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The owl opened its beak and emitted a soft, chiming melody like a musical clock in a grand wooden lodge. The song drifted down over pine trees laden with heavy powdered snow.",
        sleepAffirmation: "Quiet snow falls silently, muffling every sound into peace.",
        choices: [
          {
            id: "cmo2",
            text: "Snuggle inside the warm feathered wing of the owl",
            action: "sleep_wing",
            nextSceneId: "scene-mo-3"
          }
        ]
      },
      {
        id: "scene-mo-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The Moon Owl lowered its eyelids, clicking with a soft, comforting whirr. The snowy mountain slept in peaceful silence beneath the starlight. Goodnight, sleepy explorer.",
        sleepAffirmation: "Deep, quiet, peaceful winter sleep."
      }
    ]
  },
  {
    id: "story-galaxy-book",
    title: "Galaxy Book",
    category: "Magical",
    theme: "wonder",
    mode: "classic",
    ageRange: "6-8",
    heroId: "hero-3",
    heroName: "Aria",
    summary: "Opening the ancient parchment book releases glowing spiral galaxies and constellations right into your cozy bedtime room.",
    badge: "All Crafted",
    audioDurationMinutes: 10,
    rating: 4.9,
    tags: ["Crafted", "Magical"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAJbftJCXV-t_76XZJ6G6SaRoqPI7-UEfRHZh1dM9Kagh9wGJrCUu25ZdEK_h90zu-eMoYmtmKW8r7bD_29mGvbrd_AoH7hMzoQt-akLm6KPvUjrzP4OVHrwkHnT5bj779w7TB1FBndiV1-EeTDFJMs_69CiMW-k7mYENxxPo28o48iIiedw2HwcxJh7r-cBDaNRK69kz-M_bKe5hCR6et0FbjJQJea1ddxqQrKYZqQ6WiKf9V2ci8iINCeRLvHBMjvgBPVHGBuuw",
    scenes: [
      {
        id: "scene-gb-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "On a small mahogany reading stand, a mysterious silver-bound book began to glow. As its front cover gently swung open on its own, a miniature spiral galaxy lifted from the pages, spinning slowly in mid-air.",
        sleepAffirmation: "Your mind is a doorway to endless peaceful realms.",
        choices: [
          {
            id: "cgb1",
            text: "Follow the glowing spiral arm of starlight",
            action: "follow_arm",
            nextSceneId: "scene-gb-2"
          }
        ]
      },
      {
        id: "scene-gb-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The room filled with glowing constellations of sleeping dragons, dancing foxes, and sailing ships. The light was as soft as a nightlight, gently illuminating your cozy bedroom ceiling.",
        sleepAffirmation: "You are sheltered beneath a ceiling of safe stars.",
        choices: [
          {
            id: "cgb2",
            text: "Let the celestial pages turn to the final chapter",
            action: "final_chapter",
            nextSceneId: "scene-gb-3"
          }
        ]
      },
      {
        id: "scene-gb-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The galaxy gently dissolved back into the parchment as the book closed with a soft whisper. 'Rest now, scholar of the stars. The universe will keep your stories safe until dawn.'",
        sleepAffirmation: "Peaceful mind, quiet heart, sweet dreams."
      }
    ]
  },
  {
    id: "story-earths-lullaby",
    title: "Earth's Lullaby",
    category: "Oceanic",
    theme: "comfort",
    mode: "sleep",
    ageRange: "4-6",
    heroId: "hero-1",
    heroName: "Marina",
    summary: "Looking down upon the blue planet nestled in starry silence as gentle ocean tides hum a global bedtime lullaby.",
    badge: "All Crafted",
    audioDurationMinutes: 7,
    rating: 4.7,
    tags: ["Crafted", "Oceanic"],
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTmd7d9ASvjMdacYzVhhGxMprnpKUE9cHTQV4IqcTTPQVB5s0yZ3Ean8dyPcJpw2xoF_IsI8AcvJLMymkVPXLE1uaddEAbRYJ66uW27V64lOIo3jbMBBgA7Hz_txVjYct7DLIZrXvnw3Xk0bCDLaeEP653g3v9_1qR3A7WdztQTzg4XYbCSBxtCLUwaWt4nyC4RdGx74ieuGJfGOWaK3Aexnj8AEouEdNM8NxHPSURZ5ReOYqBSh9Uvl3wnJ6_CEUxrIoGii8cZIE",
    scenes: [
      {
        id: "scene-el-1",
        sceneNumber: 1,
        totalScenes: 3,
        text: "From high above in orbit, planet Earth looks like a glowing blue and green marble surrounded by soft cotton clouds. As the night shadow sweeps across continents, city lights sparkle like friendly fireflies.",
        sleepAffirmation: "You are connected to millions of dreamers falling asleep tonight.",
        choices: [
          {
            id: "cel1",
            text: "Listen to the whisper of the world's great oceans",
            action: "listen_oceans",
            nextSceneId: "scene-el-2"
          }
        ]
      },
      {
        id: "scene-el-2",
        sceneNumber: 2,
        totalScenes: 3,
        text: "The oceans roll against sandy beaches across the globe in one continuous, soothing breath. In and out, the tides rock the great continents like a mother rocking a baby's cradle.",
        sleepAffirmation: "Roll with the rhythm of the tides into restful sleep.",
        choices: [
          {
            id: "cel2",
            text: "Tuck into your cozy bed beneath the earth's soft night",
            action: "tuck_bed",
            nextSceneId: "scene-el-3"
          }
        ]
      },
      {
        id: "scene-el-3",
        sceneNumber: 3,
        totalScenes: 3,
        isFinal: true,
        text: "The whole blue earth turns slowly toward the gentle night. Sleep wraps around every forest, ocean, and home. Sleep peacefully, dear child of Earth. Goodnight.",
        sleepAffirmation: "Deep, quiet, safe sleep for all of us tonight."
      }
    ]
  },
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
