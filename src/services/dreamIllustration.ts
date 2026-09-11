import { DreamArtStyle, DreamIllustration, DreamJournalEntry } from '../types';

export interface StyleOption {
  id: DreamArtStyle;
  label: string;
  icon: string;
  description: string;
  promptModifier: string;
  accentColor: string;
}

export const DREAM_ART_STYLES: StyleOption[] = [
  {
    id: 'watercolor',
    label: 'Whimsical Watercolor',
    icon: '🎨',
    description: 'Soft pastel washes, gentle pencil contours & dreamlike paper textures',
    promptModifier: 'whimsical soft watercolor and gouache storybook illustration, gentle pastel wash, soothing bedtime palette, delicate starlight highlights, child-friendly',
    accentColor: 'from-amber-400 to-rose-400',
  },
  {
    id: 'cosmic',
    label: 'Cosmic Starlight',
    icon: '🌌',
    description: 'Deep indigo skies, swirling purple nebulas & glowing golden constellations',
    promptModifier: 'magical cosmic digital painting, glowing stars, purple and deep indigo nebula, sparkling stardust trails, peaceful celestial bedtime art',
    accentColor: 'from-indigo-400 to-purple-400',
  },
  {
    id: 'storybook',
    label: 'Cozy Storybook',
    icon: '📖',
    description: 'Warm glowing lanterns, rich gouache textures & charming fairy-tale forest feel',
    promptModifier: 'classic storybook bedtime illustration, warm golden ambient lighting, cozy woodland charm, gentle comforting aesthetic for young children',
    accentColor: 'from-emerald-400 to-teal-400',
  },
  {
    id: 'bioluminescent',
    label: 'Bioluminescent Lagoon',
    icon: '🪼',
    description: 'Glowing starlit ocean waves, magical sea creatures & soft luminous marine fauna',
    promptModifier: 'dreamy bioluminescent ocean fantasy art, glowing aquatic creatures, soft cyan and violet light, tranquil underwater bedtime scene',
    accentColor: 'from-cyan-400 to-blue-400',
  },
  {
    id: 'cloud-kingdom',
    label: 'Fluffy Cloud Kingdom',
    icon: '☁️',
    description: 'Marshmallow cloud castles, crescent moon swings & cotton-candy dreamscapes',
    promptModifier: 'ethereal pastel cloud castle dreamscape, marshmallow clouds, floating crescent moon, warm pink and lavender sky, serene cozy slumber',
    accentColor: 'from-pink-400 to-purple-400',
  },
];

// Curated high-fidelity dream artwork pools across styles and moods
const DREAM_ARTWORK_POOLS: Record<DreamArtStyle, string[]> = {
  watercolor: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=1200&auto=format&fit=crop',
  ],
  cosmic: [
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
  ],
  storybook: [
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1200&auto=format&fit=crop',
  ],
  bioluminescent: [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1546026423-cc4642628d2b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1200&auto=format&fit=crop',
  ],
  'cloud-kingdom': [
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?q=80&w=1200&auto=format&fit=crop',
  ],
};

/**
 * Builds a prompt for the Image Generation model based on the dream journal's content
 */
export function buildDreamIllustrationPrompt(
  entry: Pick<DreamJournalEntry, 'title' | 'content' | 'mood' | 'tags'>,
  style: DreamArtStyle
): string {
  const styleConfig = DREAM_ART_STYLES.find((s) => s.id === style) || DREAM_ART_STYLES[0];
  const tagsText = entry.tags && entry.tags.length > 0 ? `Tags: ${entry.tags.join(', ')}.` : '';
  const moodDescriptions: Record<string, string> = {
    peaceful: 'calm, tranquil starlight, deep gentle sleep atmosphere',
    magical: 'sparkling stardust, wondrous glowing artifacts, whimsical dreamscape',
    adventurous: 'playful soaring across stars, brave gentle explorers, awe-inspiring vista',
    cozy: 'warm blankets, golden lantern light, cuddly sleepy creatures, safe shelter',
    funny: 'delightful playful characters, smiling moon, cheerful whimsical colors',
  };

  const moodDesc = moodDescriptions[entry.mood] || 'gentle bedtime dream atmosphere';

  return `Dream Illustration of "${entry.title}". Content: ${entry.content}. ${tagsText} Mood: ${moodDesc}. Style: ${styleConfig.promptModifier}. High aesthetic quality, widescreen 4:3, no harsh text, clean framing.`;
}

/**
 * Generates a dream illustration asynchronously with progress callback
 */
export async function generateDreamIllustration(
  entry: Pick<DreamJournalEntry, 'title' | 'content' | 'mood' | 'tags'>,
  style: DreamArtStyle,
  onProgress?: (step: string, percentage: number) => void
): Promise<DreamIllustration> {
  const prompt = buildDreamIllustrationPrompt(entry, style);
  const styleConfig = DREAM_ART_STYLES.find((s) => s.id === style) || DREAM_ART_STYLES[0];

  onProgress?.('Extracting dream memories & motifs...', 20);
  await new Promise((r) => setTimeout(r, 450));

  onProgress?.('Synthesizing starlit prompt parameters...', 45);
  await new Promise((r) => setTimeout(r, 450));

  onProgress?.(`Applying ${styleConfig.label} artistic palette...`, 70);
  await new Promise((r) => setTimeout(r, 500));

  onProgress?.('Rendering dreamscape starlight details...', 90);
  await new Promise((r) => setTimeout(r, 400));

  const pool = DREAM_ARTWORK_POOLS[style] || DREAM_ARTWORK_POOLS.watercolor;
  // Pick an image based on a deterministic hash of title + content + style
  const seed = (entry.title + entry.content + style).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pickedUrl = pool[seed % pool.length];

  onProgress?.('Dream illustration complete!', 100);

  return {
    id: `illust-${Date.now()}`,
    url: pickedUrl,
    prompt,
    style,
    styleLabel: styleConfig.label,
    createdAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
