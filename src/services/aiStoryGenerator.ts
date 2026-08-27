import { Story, StoryMode, ContentTheme, AgeRange } from '../types';
import { getHeroById } from '../data/heroes';

export interface GenerateStoryParams {
  heroId: string;
  theme: ContentTheme;
  mode: StoryMode;
  ageRange: AgeRange;
  customPrompt?: string;
  setting?: string;
  sidekick?: string;
  tone?: string;
  problem?: string;
  childName?: string;
}

export function generateCustomBedtimeStory(params: GenerateStoryParams): Story {
  const hero = getHeroById(params.heroId);
  const child = params.childName || "little explorer";
  const titleThemes: Record<ContentTheme, string[]> = {
    courage: ["The Brave Constellation", "Shield of the Midnight Sky", "The Quiet Hero's Spark"],
    kindness: ["The Warm Starlight Gift", "Waves of Gentleness", "The Shared Moonbeam"],
    friendship: ["Bridge Across the Stars", "The Cosmic Playmates", "Tale of Two Moons"],
    wonder: ["The Secret Nebula Bloom", "Chimes of the Aurora", "The Sparkling Horizon"],
    imagination: ["The Cloud Castle Journey", "Colors of the Velvet Sky", "The Whimsical Comet"],
    comfort: ["The Sleepy Stardust Blanket", "Cradle of the Moon", "The Dreamland Express"],
  };

  const titles = titleThemes[params.theme] || titleThemes.wonder;
  const pickedTitle = params.customPrompt ? `${hero.name} and ${params.customPrompt}` : `${hero.name} and ${titles[Math.floor(Math.random() * titles.length)]}`;
  const settingName = params.setting || (params.mode === 'sleep' ? "Peaceful Moonlit Meadow" : "Stardust Archipelago");
  const sidekickName = params.sidekick && params.sidekick !== 'none' ? params.sidekick : "a friendly baby star";

  if (params.mode === 'sleep') {
    return {
      id: `custom-story-${Date.now()}`,
      title: pickedTitle,
      category: "Sleep Journey",
      theme: params.theme,
      mode: "sleep",
      ageRange: params.ageRange,
      heroId: hero.id,
      heroName: hero.name,
      summary: `A soothing, rhythmic bedtime meditation where ${hero.name} guides ${child} into quiet relaxation and sweet starlit slumber.`,
      isCustom: true,
      audioDurationMinutes: 6,
      scenes: [
        {
          id: "s-1",
          sceneNumber: 1,
          totalScenes: 3,
          text: `The evening sky is turning a deep, comforting velvet indigo. ${hero.name} floats down on a gentle beam of starlight and smiles warmly at ${child}. '${hero.power} is here to keep you safe and peaceful tonight,' ${hero.name} whispers softly. Take a deep, gentle breath in... and slowly let it go.`,
          sleepAffirmation: "Inhale calm peace... Exhale and feel completely safe.",
          choices: [
            {
              id: "sc-1",
              text: `Drift together with ${hero.name} into the ${settingName}`,
              action: "drift_meadow",
              nextSceneId: "s-2"
            }
          ]
        },
        {
          id: "s-2",
          sceneNumber: 2,
          totalScenes: 3,
          text: `In the quiet stillness of the ${settingName}, every blade of grass is dusted with warm silver moonlight. ${sidekickName} cuddles up close, humming a slow, rhythmic lullaby. Feel your eyelids growing heavy and soft, like feathers settling on warm velvet cushions.`,
          sleepAffirmation: "Every thought is slowing down into deep stillness.",
          choices: [
            {
              id: "sc-2",
              text: "Weave the soft blanket of starlight over your bed",
              action: "starlight_blanket",
              nextSceneId: "s-3"
            }
          ]
        },
        {
          id: "s-3",
          sceneNumber: 3,
          totalScenes: 3,
          isFinal: true,
          text: `${hero.name} gently wraps a glowing blanket of moonbeams around ${child}. The stars outside your window blink with sleepy love. 'You are brave, you are kind, and you are loved,' ${hero.name} murmurs into the peaceful night. 'Rest deeply now. Goodnight, little dreamer.'`,
          sleepAffirmation: "You are deeply relaxed, safe, and ready for beautiful dreams."
        }
      ]
    };
  }

  // Classic Interactive Story with choices
  return {
    id: `custom-story-${Date.now()}`,
    title: pickedTitle,
    category: params.theme.charAt(0).toUpperCase() + params.theme.slice(1),
    theme: params.theme,
    mode: "classic",
    ageRange: params.ageRange,
    heroId: hero.id,
    heroName: hero.name,
    summary: `${hero.name} and ${sidekickName} explore the magical ${settingName} on a quest of ${params.theme} and wonder.`,
    isCustom: true,
    audioDurationMinutes: 5,
    scenes: [
      {
        id: "s-1",
        sceneNumber: 1,
        totalScenes: 4,
        text: `Underneath a sky full of dancing constellations, ${hero.name} and ${sidekickName} discovered a mysterious glowing path winding through the ${settingName}. A soft shimmering crystal beacon was asking for help to light up the night!`,
        sleepAffirmation: "Feel your body relaxing as the adventure begins.",
        choices: [
          {
            id: "sc-1a",
            text: `Use ${hero.power} to illuminate the starlit trail`,
            action: "use_power",
            nextSceneId: "s-2a"
          },
          {
            id: "sc-1b",
            text: `Ask ${sidekickName} to lead the way with a cheerful song`,
            action: "sing_path",
            nextSceneId: "s-2b"
          }
        ]
      },
      {
        id: "s-2a",
        sceneNumber: 2,
        totalScenes: 4,
        text: `${hero.name} activated ${hero.power}! A dazzling wave of gentle ${hero.color} light shimmered across the ground, revealing hidden stepping stones of sparkling moon-glass. Friendly night creatures cheered with delight!`,
        sleepAffirmation: "Kindness and courage light up every shadow.",
        choices: [
          {
            id: "sc-2a-next",
            text: `Step across the moon-glass to the Celestial Heart`,
            action: "cross_bridge",
            nextSceneId: "s-3"
          }
        ]
      },
      {
        id: "s-2b",
        sceneNumber: 2,
        totalScenes: 4,
        text: `${sidekickName} chirped a melodious nighttime tune. As the song echoed through the ${settingName}, glowing fireflies gathered together, forming an archway of pure golden light to guide the way safely.`,
        sleepAffirmation: "Harmony and friendship make every journey sweet.",
        choices: [
          {
            id: "sc-2b-next",
            text: `Walk beneath the archway toward the peaceful center`,
            action: "walk_archway",
            nextSceneId: "s-3"
          }
        ]
      },
      {
        id: "s-3",
        sceneNumber: 3,
        totalScenes: 4,
        text: `At the center stood the Great Dream Star. With a gentle touch of warmth and ${params.theme}, ${hero.name} and ${child} restored its golden glow. A slow, warm wave of bedtime magic cascaded across the universe, turning every night sky into a cozy cradle.`,
        sleepAffirmation: "Peace and warmth surround you everywhere.",
        choices: [
          {
            id: "sc-3-final",
            text: "Cuddle into bed under the glowing Dream Star",
            action: "cuddle_bed",
            nextSceneId: "s-4"
          }
        ]
      },
      {
        id: "s-4",
        sceneNumber: 4,
        totalScenes: 4,
        isFinal: true,
        text: `${hero.name} watched with a proud and gentle smile as the stars settled into place. 'You did wonderfully today, ${child},' said ${hero.name}. 'Now let your eyes rest and let your dreams soar among the constellations.'`,
        sleepAffirmation: "Sleep tight, sweet dreams, and rest peacefully tonight."
      }
    ]
  };
}
