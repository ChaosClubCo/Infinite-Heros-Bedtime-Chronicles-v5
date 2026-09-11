/**
 * Safety orchestrator: turns a generated story into a guaranteed-safe one.
 *
 * Policy (confirmed product decisions):
 *   1. Moderate the freshly generated story.
 *   2. If unsafe, regenerate ONCE with a stricter prompt (caller-supplied
 *      closure) and moderate again.
 *   3. If still unsafe — or if regeneration errors — serve a pre-written
 *      known-safe fallback story.
 * The child therefore never sees flagged text or a raw error. A hard cap of one
 * regeneration bounds latency and cost; the caller's idempotency cache prevents
 * client retries from multiplying generations.
 *
 * The optional LLM second pass is injected as `llmClassify` (default absent) and
 * only runs on a BORDERLINE verdict (regex says safe but soft signals are
 * present). It fails *toward* the regex verdict, so a moderation-provider outage
 * can neither block every story nor spin retries.
 */

import { moderateStory, type ModerateOptions } from './content-safety';
import { getFallbackStory } from './fallback-stories';
import {
  recordContentBlock,
  recordRegeneration,
  recordFallback,
  recordSafetyLlm,
} from '../metrics';

export type GuardOutcome = 'clean' | 'regenerated' | 'fallback';

interface GuardLogger {
  warn(obj: object, msg?: string): void;
  info(obj: object, msg?: string): void;
}

export interface GuardStoryDeps {
  /** The story already produced by the first generation (post structural map). */
  story: Record<string, unknown>;
  mode: string;
  /** Regenerate with a stricter prompt naming the flagged categories. */
  regenerate: (flaggedCategories: string[]) => Promise<Record<string, unknown>>;
  strict?: boolean;
  /** Optional LLM classifier: resolves true if the story is safe. */
  llmClassify?: (story: Record<string, unknown>) => Promise<boolean>;
  log?: GuardLogger;
  requestId?: string;
}

export interface GuardStoryResult {
  story: Record<string, unknown>;
  outcome: GuardOutcome;
}

export async function guardStory(deps: GuardStoryDeps): Promise<GuardStoryResult> {
  const { story, mode, regenerate, strict, llmClassify, log, requestId } = deps;
  const opts: ModerateOptions = { strict };

  const verdict = moderateStory(story, opts);
  let blocked = !verdict.safe;
  let categories = verdict.categories;

  // Optional LLM second pass — only when regex passed but with soft signals.
  const borderline = verdict.safe && verdict.matches.some((m) => m.tier === 'soft');
  if (!blocked && llmClassify && borderline) {
    const llmSafe = await llmClassify(story)
      .then((safe) => {
        recordSafetyLlm(true);
        return safe;
      })
      .catch((err) => {
        // Fail toward the regex verdict (which is "safe" here) — never let a
        // moderation-provider outage block a story the regex approved.
        recordSafetyLlm(false);
        log?.warn({ requestId, err: String(err) }, 'content safety LLM check failed; keeping regex verdict');
        return true;
      });
    if (!llmSafe) {
      blocked = true;
      categories = verdict.categories.length ? verdict.categories : ['scary'];
      log?.warn({ requestId, categories }, 'content safety LLM flagged a regex-passed story');
    }
  }

  if (!blocked) {
    return { story, outcome: 'clean' };
  }

  recordContentBlock(categories);
  log?.warn({ requestId, categories, stage: 'initial' }, 'content moderation blocked story');

  let regenerated: Record<string, unknown> | null = null;
  try {
    regenerated = await regenerate(categories);
  } catch (err) {
    log?.warn({ requestId, err: String(err) }, 'safety regeneration failed; serving fallback');
  }

  if (regenerated) {
    const verdict2 = moderateStory(regenerated, opts);
    if (verdict2.safe) {
      recordRegeneration(true);
      log?.info({ requestId, stage: 'regenerated' }, 'content moderation cleared after regeneration');
      return { story: regenerated, outcome: 'regenerated' };
    }
    log?.warn(
      { requestId, categories: verdict2.categories, stage: 'regenerated' },
      'content moderation blocked story after regeneration',
    );
  }

  recordRegeneration(false);
  recordFallback();
  log?.warn({ requestId, mode }, 'serving known-safe fallback story');
  return { story: getFallbackStory(mode) as unknown as Record<string, unknown>, outcome: 'fallback' };
}
