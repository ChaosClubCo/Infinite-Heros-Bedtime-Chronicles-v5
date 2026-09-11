/**
 * ModerationProvider adapter wrapping the existing `approveChatResponse()`
 * (`server/safety/chat-safety.ts`) verbatim — no changes to `server/safety/*`
 * internals. This is a shape adapter: it turns the existing
 * `{ text, outcome, verdict }` return value into a versioned, loggable
 * `SafetyInspection` record for the realtime slice's event stream and
 * provenance logging.
 */

import { randomUUID } from 'node:crypto';
import { approveChatResponse } from '../safety/chat-safety';
import { SAFETY_INSPECTION_SCHEMA_VERSION, type SafetyInspection } from '../../shared/media/schemas';
import type { ModerationProvider, ModerationRequest, ModerationResult } from './types';

export const chatSafetyModerationProvider: ModerationProvider = {
  providerId: 'chat-safety',

  async moderate(req: ModerationRequest): Promise<ModerationResult> {
    const approved = approveChatResponse(req.text);

    const inspection: SafetyInspection = {
      schemaVersion: SAFETY_INSPECTION_SCHEMA_VERSION,
      id: randomUUID(),
      subjectType: req.subjectType,
      outcome: approved.outcome === 'clean' ? 'approved' : 'fallback',
      categories: approved.verdict.categories,
      checkedAt: new Date().toISOString(),
    };

    return { inspection, text: approved.text };
  },
};
