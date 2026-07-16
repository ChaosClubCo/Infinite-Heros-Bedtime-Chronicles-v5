/**
 * Canonical child-safety term list — the SINGLE source of truth shared by the
 * server-side output moderator (`server/safety/*`) and the client-side render
 * fail-safe (`components/StoryTextDisplay.tsx`).
 *
 * This module is deliberately dependency-free and tiny so Metro can bundle it
 * into the mobile client without dragging in server-only code (unlike
 * `shared/schema.ts`, which pulls in Drizzle). Keep it that way: pure TypeScript,
 * no imports.
 *
 * Only the HARD tier lives here. HARD terms are ones that are almost never
 * benign in a story for ages 3-9 (explicit violence, death, lethal weapons,
 * sexual/adult content, and unambiguous real-world brands/characters). A single
 * HARD hit is enough to reject content. The softer, contextual terms (e.g.
 * "dark", "scared", "monster") that require co-occurrence to be meaningful live
 * server-side in `server/safety/terms.ts` — the client fail-safe intentionally
 * only checks the high-precision HARD list so it never over-blocks a benign
 * story on-device.
 */

export type SafetyCategory =
  | 'violence'
  | 'weapons'
  | 'death'
  | 'scary'
  | 'sexual'
  | 'profanity'
  | 'brands'
  | 'bullying'
  | 'anxiety'
  | 'illness';

/**
 * HARD terms grouped by the CHILD_SAFETY_RULES category they violate. A single
 * match rejects the content. Entries are matched case-insensitively on word
 * boundaries (see `buildTermRegex`), so "die" never matches "dye"/"diet" and
 * "gun" never matches "begun". Multi-word entries (e.g. "star wars") are matched
 * as whole phrases, which keeps common single words like "star" safe.
 */
export const HARD_TERMS: Record<SafetyCategory, string[]> = {
  violence: [
    'gore', 'gory', 'bloodbath', 'slaughter', 'massacre', 'stab', 'stabbed',
    'stabbing', 'strangle', 'strangled', 'gunshot', 'behead', 'beheaded',
  ],
  weapons: [
    'gun', 'guns', 'rifle', 'pistol', 'shotgun', 'bullet', 'bullets',
    'grenade', 'machete',
  ],
  death: [
    'kill', 'kills', 'killed', 'killing', 'murder', 'murdered', 'murdering',
    'death', 'dead', 'die', 'dies', 'died', 'dying', 'corpse', 'suicide',
  ],
  scary: [],
  sexual: [
    'sex', 'sexual', 'naked', 'nude', 'nudity',
  ],
  profanity: [
    'damn', 'hell', 'crap', 'bastard',
  ],
  brands: [
    'mickey mouse', 'spider-man', 'spiderman', 'batman', 'superman',
    'pokemon', 'pikachu', 'minecraft', 'fortnite', 'coca-cola', 'mcdonalds',
    'star wars', 'harry potter', 'paw patrol', 'peppa pig',
  ],
  bullying: [],
  anxiety: [],
  illness: [],
};

/** Flat, de-duplicated list of every HARD term — derived from HARD_TERMS. */
export const HARD_BANNED_TERMS: string[] = Array.from(
  new Set(Object.values(HARD_TERMS).flat()),
);

/**
 * Escape a term for safe inclusion in a RegExp and wrap the alternation in
 * word boundaries. Exported so the server moderator can build category-specific
 * matchers from the same primitive.
 */
export function buildTermRegex(terms: string[]): RegExp {
  const escaped = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  return new RegExp(`\\b(${escaped})\\b`, 'i');
}

// Compiled once at module load — the client fail-safe calls this per story part.
const HARD_REGEX = buildTermRegex(HARD_BANNED_TERMS);

/**
 * Fast, high-precision check used by the client render fail-safe. Returns true
 * only when the text contains a HARD banned term. Intentionally does NOT apply
 * the softer contextual rules (those are server-authoritative) so it never
 * blocks a benign story on-device.
 */
export function containsUnsafeContent(text: string): boolean {
  if (!text) return false;
  return HARD_REGEX.test(text);
}

/**
 * Gentle placeholder shown in place of a story part if unsafe text ever reaches
 * the client (defense in depth — the server should already have blocked it).
 * Must itself pass `containsUnsafeContent`.
 */
export const SAFE_PLACEHOLDER_TEXT =
  "This part of the story is taking a little rest. Let's turn the page and " +
  'find a brand new adventure together!';
