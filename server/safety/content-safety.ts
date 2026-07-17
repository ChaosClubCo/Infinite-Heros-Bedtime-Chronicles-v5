/**
 * Pure, synchronous OUTPUT moderator for AI-generated stories.
 *
 * This is the server-authoritative safety gate: it inspects the actual text a
 * child would see (not just the prompt) and returns a structured verdict. It is
 * intentionally dependency-free of any I/O, timers, or randomness so it is
 * deterministic, microsecond-fast on the request hot path, and fully unit
 * testable. The regenerate / fallback orchestration lives in `story-guard.ts`;
 * the optional LLM second pass lives there too. This file only decides
 * "is this text safe?".
 *
 * Detection layers:
 *   A. Term matching aligned to CHILD_SAFETY_RULES (server/prompts.ts):
 *      - HARD tier (`@shared/safety-terms`): a single hit rejects.
 *      - SOFT tier (`./terms`): contextual words that only reject when several
 *        distinct terms co-occur (>= threshold), or any single one under `strict`.
 *   B. Structural checks: required non-empty fields, model/prompt leakage,
 *      and PII (URLs / emails) that must never appear in child output.
 */

import { sanitizeString } from '../validation';
import {
  HARD_TERMS,
  SOFT_TERMS,
  ALLOWLIST_PHRASES,
} from './terms';
import { type SafetyCategory } from '@shared/safety-terms';

export type ModerationCategory = SafetyCategory | 'structural' | 'leakage' | 'pii';

export interface SafetyMatch {
  category: ModerationCategory;
  term: string;
  field: string;
  tier: 'hard' | 'soft';
}

export interface SafetyVerdict {
  safe: boolean;
  categories: ModerationCategory[];
  matches: SafetyMatch[];
}

export interface ModerateOptions {
  /** When true, a single SOFT hit is enough to reject (default: threshold below). */
  strict?: boolean;
}

/**
 * Distinct SOFT terms required to reject in non-strict mode. HARD terms are the
 * real gate; this is a tonal-drift backstop, kept high enough to avoid blocking
 * ordinary gentle-adventure stories. Tunable — pinned by tests.
 */
export const SOFT_BLOCK_THRESHOLD = 3;

const MAX_FIELD_SCAN_LEN = 4000;

// ---- Compiled-once matchers -------------------------------------------------

// HARD matchers need only presence (first hit blocks) → non-global.
// SOFT matchers must enumerate every distinct term for the co-occurrence
// threshold → global, consumed via matchAll.
const HARD_REGEX_BY_CATEGORY = compileCategoryRegexes(HARD_TERMS, false);
const SOFT_REGEX_BY_CATEGORY = compileCategoryRegexes(SOFT_TERMS, true);
const ALLOWLIST_SCRUB_REGEX = ALLOWLIST_PHRASES.length
  ? new RegExp(
      `\\b(${ALLOWLIST_PHRASES.map(escapeRegex).join('|')})\\b`,
      'gi',
    )
  : null;

// Structural / leakage / PII matchers.
const LEAKAGE_REGEX = /\bas an ai\b|\blanguage model\b|```|\b(?:system|assistant)\s*:|\bi (?:cannot|can't|can not|won't|will not)\b/i;
const URL_REGEX = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\.[a-z]{2,}/i;
const EMAIL_REGEX = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compileCategoryRegexes(
  map: Record<SafetyCategory, string[]>,
  global: boolean,
): { category: SafetyCategory; regex: RegExp }[] {
  return (Object.keys(map) as SafetyCategory[])
    .filter((cat) => map[cat].length > 0)
    .map((cat) => ({
      category: cat,
      regex: new RegExp(`\\b(${map[cat].map(escapeRegex).join('|')})\\b`, global ? 'gi' : 'i'),
    }));
}

// ---- Field extraction -------------------------------------------------------

interface Field {
  name: string;
  text: string;
}

function pushField(fields: Field[], name: string, value: unknown, maxLen = 500): void {
  const text = sanitizeString(value, maxLen);
  if (text) fields.push({ name, text });
}

/**
 * Flatten every child-facing string in a story object. Unknown/malformed shapes
 * are handled defensively — missing fields simply produce no text and are caught
 * by the structural layer.
 */
function collectFields(story: Record<string, unknown>): Field[] {
  const fields: Field[] = [];
  pushField(fields, 'title', story.title);

  if (Array.isArray(story.parts)) {
    story.parts.forEach((part, i) => {
      const p = (part ?? {}) as Record<string, unknown>;
      pushField(fields, `parts[${i}].text`, p.text, MAX_FIELD_SCAN_LEN);
      if (Array.isArray(p.choices)) {
        pushField(fields, `parts[${i}].choices`, p.choices.join(' '), 1000);
      }
    });
  }

  const vocab = (story.vocabWord ?? {}) as Record<string, unknown>;
  pushField(fields, 'vocabWord.word', vocab.word);
  pushField(fields, 'vocabWord.definition', vocab.definition);

  pushField(fields, 'joke', story.joke);
  pushField(fields, 'lesson', story.lesson);
  pushField(fields, 'tomorrowHook', story.tomorrowHook);

  const badge = (story.rewardBadge ?? {}) as Record<string, unknown>;
  pushField(fields, 'rewardBadge.title', badge.title);
  pushField(fields, 'rewardBadge.description', badge.description);
  // The emoji is rendered raw to the child (44pt on the celebration screen), so
  // term-scan it too — the schema type is just `string` with no constraint.
  pushField(fields, 'rewardBadge.emoji', badge.emoji, 32);

  return fields;
}

// ---- Structural layer -------------------------------------------------------

function structuralMatches(story: Record<string, unknown>): SafetyMatch[] {
  const matches: SafetyMatch[] = [];
  const requireString = (name: string, value: unknown) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      matches.push({ category: 'structural', term: `missing:${name}`, field: name, tier: 'hard' });
    }
  };

  requireString('title', story.title);

  if (!Array.isArray(story.parts) || story.parts.length === 0) {
    matches.push({ category: 'structural', term: 'missing:parts', field: 'parts', tier: 'hard' });
  } else {
    story.parts.forEach((part, i) => {
      const p = (part ?? {}) as Record<string, unknown>;
      const text = typeof p.text === 'string' ? p.text : '';
      if (text.trim().length === 0) {
        matches.push({ category: 'structural', term: `empty:parts[${i}].text`, field: `parts[${i}].text`, tier: 'hard' });
      } else if (text.length > MAX_FIELD_SCAN_LEN) {
        // Reject at the scan window, not 2x it: only the first MAX_FIELD_SCAN_LEN
        // chars are moderated (pushField truncates), so a longer part would have
        // an unscanned tail that still reaches the child (e.g. narrated via TTS).
        // 4000 chars is far above any legitimate part (epic ≈ 1200), so this
        // blocks aberrant output without false-positiving real stories.
        matches.push({ category: 'structural', term: `oversize:parts[${i}].text`, field: `parts[${i}].text`, tier: 'hard' });
      }
    });
  }

  const vocab = (story.vocabWord ?? {}) as Record<string, unknown>;
  requireString('vocabWord.word', vocab.word);
  requireString('vocabWord.definition', vocab.definition);
  requireString('joke', story.joke);
  requireString('lesson', story.lesson);
  requireString('tomorrowHook', story.tomorrowHook);

  const badge = (story.rewardBadge ?? {}) as Record<string, unknown>;
  requireString('rewardBadge.title', badge.title);
  requireString('rewardBadge.description', badge.description);
  // Emoji field must be short: a real emoji (incl. ZWJ sequences) is a handful
  // of code units, so anything longer is a phrase/paragraph masquerading as an
  // emoji — reject rather than render it raw on the celebration screen.
  if (typeof badge.emoji === 'string' && badge.emoji.length > 16) {
    matches.push({ category: 'structural', term: 'oversize:rewardBadge.emoji', field: 'rewardBadge.emoji', tier: 'hard' });
  }

  return matches;
}

// ---- Main entry -------------------------------------------------------------

/**
 * Moderate a generated story. Returns a structured verdict; never throws. A
 * malformed or non-object input is treated as unsafe (structural failure).
 */
export function moderateStory(story: unknown, opts: ModerateOptions = {}): SafetyVerdict {
  if (typeof story !== 'object' || story === null || Array.isArray(story)) {
    return {
      safe: false,
      categories: ['structural'],
      matches: [{ category: 'structural', term: 'not-an-object', field: '$', tier: 'hard' }],
    };
  }

  const record = story as Record<string, unknown>;
  const matches: SafetyMatch[] = [];

  // Layer B — structural.
  matches.push(...structuralMatches(record));

  // Layers A + leakage/PII operate over the flattened child-facing text.
  const fields = collectFields(record);
  const softTermsSeen = new Set<string>();

  for (const field of fields) {
    // Leakage / PII (treated as HARD).
    if (LEAKAGE_REGEX.test(field.text)) {
      matches.push({ category: 'leakage', term: 'model-leakage', field: field.name, tier: 'hard' });
    }
    if (URL_REGEX.test(field.text) || EMAIL_REGEX.test(field.text)) {
      matches.push({ category: 'pii', term: 'contact-info', field: field.name, tier: 'hard' });
    }

    // Layer A HARD — any hit is a hard match (presence is enough → first match).
    for (const { category, regex } of HARD_REGEX_BY_CATEGORY) {
      const m = field.text.match(regex);
      if (m) {
        matches.push({ category, term: m[1].toLowerCase(), field: field.name, tier: 'hard' });
      }
    }

    // Layer A SOFT — scan a copy with benign compounds stripped out, counting
    // every DISTINCT soft term so co-occurrence within one field/category is
    // detected (the regexes are global; matchAll enumerates all hits).
    const scrubbed = ALLOWLIST_SCRUB_REGEX
      ? field.text.replace(ALLOWLIST_SCRUB_REGEX, ' ')
      : field.text;
    for (const { category, regex } of SOFT_REGEX_BY_CATEGORY) {
      for (const m of scrubbed.matchAll(regex)) {
        const term = m[1].toLowerCase();
        if (!softTermsSeen.has(term)) {
          matches.push({ category, term, field: field.name, tier: 'soft' });
          softTermsSeen.add(term);
        }
      }
    }
  }

  const hardCount = matches.filter((m) => m.tier === 'hard').length;
  const softThreshold = opts.strict ? 1 : SOFT_BLOCK_THRESHOLD;
  const safe = hardCount === 0 && softTermsSeen.size < softThreshold;

  const categories = Array.from(new Set(matches.map((m) => m.category)));
  return { safe, categories, matches };
}
