/**
 * Gated entry points for cloud sync. These are the ONLY functions app code
 * should call — they enforce the guardrails (parent opt-in + a signed-in
 * session + configured Supabase) so nothing ever syncs by accident.
 *
 * Wire `runSync(settings.cloudSyncEnabled)` to sync triggers (e.g. after a story
 * is saved, or on app foreground) and `purgeCloudData()` into the "clear all
 * data" flow so a local wipe also removes the cloud copy.
 */

import { getSupabaseClient } from '@/lib/AuthContext';
import { getConsentGiven } from '@/lib/storage';
import { syncAll, type EntityAdapter } from './engine';
import { purgeCloud } from './supabase-sync';
import { reportSyncError } from './report';
import {
  storiesAdapter, badgesAdapter, streaksAdapter,
  favoritesAdapter, readAdapter, profileStubAdapter,
} from './storage-adapters';
import type { SyncEntity } from '@shared/sync-types';

/** All six synced entities. profileStub runs first so its placeholder profiles
 *  exist before badges/streaks that reference them are applied. */
const ADAPTERS: Partial<Record<SyncEntity, EntityAdapter>> = {
  profileStub: profileStubAdapter,
  stories: storiesAdapter,
  badges: badgesAdapter,
  streaks: streaksAdapter,
  favorites: favoritesAdapter,
  read: readAdapter,
};

/** Resolve the signed-in user id, or null when auth isn't configured / no session. */
async function currentUserId(): Promise<{ sb: NonNullable<ReturnType<typeof getSupabaseClient>>; userId: string } | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  const userId = data.user?.id;
  return userId ? { sb, userId } : null;
}

/**
 * Run a full sync when enabled + signed in; otherwise a no-op. Never throws —
 * sync is best-effort background work and must not break the app flow that
 * triggered it. Returns whether a sync actually ran.
 */
export async function runSync(enabled: boolean): Promise<boolean> {
  if (!enabled) return false;
  // COPPA: never egress a child's data unless parental consent is currently
  // valid for the active CONSENT_VERSION. getConsentGiven() is the same check
  // ConsentContext uses; it returns false for missing/outdated/revoked consent.
  // Fail-safe to false on any storage error, and treat "unconsented" as a silent
  // no-op (not a sync error), so it is not reported to Sentry.
  const consented = await getConsentGiven().catch(() => false);
  if (!consented) return false;
  try {
    const ctx = await currentUserId();
    if (!ctx) return false;
    // A run happened (still return true even if some entities failed, so the
    // `didSync` contract holds), but surface each per-entity failure — otherwise
    // a partially-broken sync is silent.
    const { errors } = await syncAll(ctx.sb, ctx.userId, ADAPTERS);
    for (const { entity, error } of errors) {
      reportSyncError(`syncAll:${entity}`, error);
    }
    return true;
  } catch (err) {
    reportSyncError('runSync', err);
    return false;
  }
}

/**
 * Purge every synced record for the signed-in user (local-wipe → cloud-purge).
 * No-op when auth isn't configured / not signed in. Returns whether a purge ran.
 */
export async function purgeCloudData(): Promise<boolean> {
  try {
    const ctx = await currentUserId();
    if (!ctx) return false;
    await purgeCloud(ctx.sb, ctx.userId);
    return true;
  } catch (err) {
    reportSyncError('purgeCloudData', err);
    return false;
  }
}
