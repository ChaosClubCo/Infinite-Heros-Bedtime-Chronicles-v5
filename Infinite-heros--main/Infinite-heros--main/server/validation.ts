import { z } from 'zod';

export const VALID_MODES = ['classic', 'madlibs', 'sleep'] as const;
export const VALID_DURATIONS = ['short', 'medium-short', 'medium', 'long', 'epic'] as const;
export const MAX_INPUT_STRING_LENGTH = 500;
export const MAX_TTS_TEXT_LENGTH = 5000;

export function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).trim();
}

/**
 * Sanitize a user-controlled string before interpolating it into an LLM prompt.
 * Beyond truncation, this neutralizes prompt-injection vectors: it flattens the
 * value to a single line (control chars/newlines -> spaces), collapses runs of
 * whitespace, and defangs instruction-delimiter sequences and role markers that
 * could be used to break out of the surrounding prompt context.
 * The result is plain inline data — never multi-line, never delimiter-bearing.
 */
export function sanitizePromptInput(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  let s = val.slice(0, maxLen);
  // Neutralize percent-encoded control chars (e.g. %0A, %0D, %1B) before the
  // raw control-char pass below, so encoded newlines can't smuggle role markers.
  s = s.replace(/%[0-1][0-9a-fA-F]/gi, ' ');
  // Control characters (incl. newlines/tabs) -> space.
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\x00-\x1F\x7F]+/g, ' ');
  // Defang code/quote fences.
  s = s.replace(/`+/g, "'").replace(/"{3,}/g, '"').replace(/~{3,}/g, '');
  // Strip role-injection markers (e.g. "system:", "assistant:").
  s = s.replace(/\b(system|assistant|user)\s*:/gi, '$1');
  // Remove markdown structural / quote / heading / rule markers.
  s = s.replace(/(^|\s)[#>\-*_]{2,}/g, '$1');
  // Collapse remaining whitespace.
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}

export function validateMadlibWords(input: unknown): Record<string, string> | undefined {
  if (input == null) return undefined;
  if (typeof input !== 'object' || Array.isArray(input)) return undefined;
  const obj = input as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > 20) return undefined;
  const result: Record<string, string> = {};
  for (const key of keys) {
    if (typeof key !== 'string' || key.length > 100) continue;
    const val = obj[key];
    if (typeof val !== 'string') continue;
    result[key.slice(0, 100)] = String(val).slice(0, 100);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** Zod transform that truncates a string to maxLen and trims. */
function truncated(maxLen: number, message?: string) {
  const transform = (s: string) => s.slice(0, maxLen).trim();
  return message ? z.string({ message }).transform(transform) : z.string().transform(transform);
}

/** Optional truncated string that becomes undefined when empty. */
function optTruncated(maxLen: number) {
  return z.string().optional().default('').transform((s) => {
    const v = s.slice(0, maxLen).trim();
    return v || undefined;
  });
}

export const StoryRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH, 'Hero name is required').refine((s) => s.length > 0, { message: 'Hero name is required' }),
  heroTitle: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  duration: z.string().default('medium').transform((s) =>
    (VALID_DURATIONS as readonly string[]).includes(s) ? s : 'medium'
  ),
  mode: z.string().default('classic').transform((s) =>
    (VALID_MODES as readonly string[]).includes(s) ? s : 'classic'
  ),
  madlibWords: z.unknown().optional().transform((v) => validateMadlibWords(v)),
  soundscape: optTruncated(30),
  setting: optTruncated(100),
  tone: optTruncated(50),
  childName: optTruncated(50),
  sidekick: optTruncated(100),
  problem: optTruncated(100),
  customPrompt: optTruncated(500),
});

export type StoryRequest = z.output<typeof StoryRequestSchema>;

export const AvatarRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH, 'Hero name is required').refine((s) => s.length > 0, { message: 'Hero name is required' }),
  heroTitle: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type AvatarRequest = z.output<typeof AvatarRequestSchema>;

export const SceneRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  sceneText: truncated(2000).refine((s) => s.length > 0, { message: 'Scene text is required' }),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type SceneRequest = z.output<typeof SceneRequestSchema>;

export const TtsRequestSchema = z.object({
  text: z.string({ message: 'Text is required' }).min(1, 'Text is required').max(MAX_TTS_TEXT_LENGTH, `Text too long. Maximum ${MAX_TTS_TEXT_LENGTH} characters.`),
  voice: z.string().optional().default('moonbeam').transform((s) => s.slice(0, 20).trim().toLowerCase()),
  mode: z.string().optional().transform((s) => s ? s.slice(0, 20) : undefined),
});

export type TtsRequest = z.output<typeof TtsRequestSchema>;

export const TtsPreviewRequestSchema = z.object({
  voice: z.string().optional().default('moonbeam').transform((s) => s.slice(0, 20).trim().toLowerCase()),
});

export type TtsPreviewRequest = z.output<typeof TtsPreviewRequestSchema>;

export const VideoRequestSchema = z.object({
  sceneText: truncated(2000).refine((s) => s.length > 0, { message: 'Scene text is required' }),
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
});

export type VideoRequest = z.output<typeof VideoRequestSchema>;

export const SuggestSettingsRequestSchema = z.object({
  heroName: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroPower: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  heroDescription: truncated(MAX_INPUT_STRING_LENGTH).default(''),
  hour: z.number().int().min(0).max(23).optional().default(new Date().getHours()),
  childAge: z.number().int().min(1).max(12).optional(),
  childName: optTruncated(30),
});

export type SuggestSettingsRequest = z.output<typeof SuggestSettingsRequestSchema>;

/**
 * Parse and validate a story request body.
 * Returns a Zod SafeParseReturnType — caller checks `.success`.
 */
export function parseStoryRequest(body: unknown): ReturnType<typeof StoryRequestSchema.safeParse> {
  return StoryRequestSchema.safeParse(body);
}
