/**
 * In-memory MediaSession store. Mirrors the existing `activeJobs` Map +
 * expiry-sweep pattern in `server/video.ts` rather than inventing a new one —
 * sessions are short-lived (a single typed-input realtime conversation) and,
 * per the increment plan, deliberately not persisted to a new database table
 * this increment (no transcript is stored; there is nothing durable to survive
 * a restart yet). A durable table is Phase 6+ work once sessions need to
 * outlive a process.
 */

import { randomUUID } from 'node:crypto';
import {
  MEDIA_SESSION_SCHEMA_VERSION,
  type MediaSession,
  type MediaSessionMode,
  type MediaSessionTransport,
} from '../../shared/media/schemas';

const SESSION_EXPIRY_MS = 30 * 60 * 1000;

const sessions = new Map<string, MediaSession>();

setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - Date.parse(session.createdAt) > SESSION_EXPIRY_MS) {
      sessions.delete(id);
    }
  }
}, 5 * 60 * 1000);

export interface CreateSessionInput {
  mode: MediaSessionMode;
  characterProfileId: string;
  consentArtifactId: string;
  transport: MediaSessionTransport;
}

export function createSession(input: CreateSessionInput): MediaSession {
  const now = new Date().toISOString();
  const session: MediaSession = {
    schemaVersion: MEDIA_SESSION_SCHEMA_VERSION,
    id: randomUUID(),
    status: 'active',
    mode: input.mode,
    characterProfileId: input.characterProfileId,
    createdAt: now,
    updatedAt: now,
    consentArtifactId: input.consentArtifactId,
    transport: input.transport,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): MediaSession | undefined {
  return sessions.get(id);
}

export function updateSessionStatus(id: string, status: MediaSession['status']): MediaSession | undefined {
  const session = sessions.get(id);
  if (!session) return undefined;
  session.status = status;
  session.updatedAt = new Date().toISOString();
  return session;
}

/** Test-only: clear all sessions between test cases. */
export function _resetSessionStoreForTests(): void {
  sessions.clear();
}
