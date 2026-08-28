/**
 * Server-only extension of the shared safety term list.
 */

import { HARD_TERMS, type SafetyCategory } from '@shared/safety-terms';

export { HARD_TERMS };

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
    'sick', 'ill', 'illness', 'disease', 'fever', 'hospital', 'injured',
    'injury', 'wounded', 'hurt', 'bleeding', 'blood',
  ],
};

export const ALLOWLIST_PHRASES: string[] = [
  'swordfish', 'bloodhound', 'blood orange', 'war paint',
];
