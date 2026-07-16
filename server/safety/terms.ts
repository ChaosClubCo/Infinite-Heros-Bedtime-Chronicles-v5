/**
 * Server-only extension of the shared safety term list.
 *
 * The canonical HARD tier lives in `@shared/safety-terms` (shared with the
 * client fail-safe). This module adds the SOFT / contextual tier — words that
 * are frequently benign in a gentle story ("dark", "scared", "monster") and so
 * must NOT reject content on a single sighting. They only contribute when
 * several distinct SOFT terms co-occur (see `moderateStory` in
 * `content-safety.ts`), which is a strong signal a story has drifted tonally.
 *
 * Keeping SOFT terms server-side means the on-device client check stays
 * high-precision (HARD only) and never over-blocks a benign story offline.
 */

import { HARD_TERMS, type SafetyCategory } from '@shared/safety-terms';

export { HARD_TERMS };

/**
 * SOFT / contextual terms by category. Deliberately excludes words that are so
 * common they'd fire constantly; the co-occurrence threshold does the real
 * filtering. Tune here (with a matching test) rather than in `content-safety.ts`.
 */
export const SOFT_TERMS: Record<SafetyCategory, string[]> = {
  violence: [
    'fight', 'fighting', 'fought', 'battle', 'battles', 'punch', 'punched',
    'attack', 'attacked', 'weapon', 'weapons', 'sword', 'swords', 'knife',
    'knives', 'war', 'explosion', 'explode',
  ],
  weapons: [],
  death: ['grave', 'graveyard', 'tomb', 'funeral'],
  scary: [
    'scary', 'scared', 'afraid', 'fear', 'frightened', 'frightening',
    'terrified', 'monster', 'monsters', 'ghost', 'ghosts', 'witch', 'witches',
    'goblin', 'creepy', 'spooky', 'haunted', 'nightmare', 'nightmares',
  ],
  sexual: [],
  profanity: [],
  brands: [],
  bullying: [
    'bully', 'bullies', 'bullied', 'mean', 'cruel', 'teasing', 'tease',
    'exclude', 'excluded',
  ],
  anxiety: [
    'lost', 'alone', 'lonely', 'abandoned', 'trapped', 'dark', 'darkness',
    'cry', 'crying', 'tears', 'worried', 'worry', 'panic', 'danger',
    'dangerous', 'threat',
  ],
  illness: [
    // Note: "wound" (noun) is deliberately excluded — it collides with the very
    // common benign verb ("the parade wound down"); "wounded" covers the injury.
    'sick', 'ill', 'illness', 'disease', 'fever', 'hospital', 'injured',
    'injury', 'wounded', 'hurt', 'bleeding', 'blood',
  ],
};

/**
 * Benign compound phrases that contain a SOFT term as a substring but are
 * harmless (e.g. "swordfish" contains "sword"). These are stripped from a
 * working copy of the text before SOFT scanning so they never contribute a
 * false hit. HARD terms are chosen to be unambiguous and are not allowlisted.
 */
export const ALLOWLIST_PHRASES: string[] = [
  'swordfish', 'bloodhound', 'blood orange', 'war paint',
];
