/**
 * Gated entry points for cloud sync. These are the ONLY functions app code
 * should call — they enforce the guardrails (parent opt-in + valid parental
 * consent + a signed-in session + configured Supabase) so nothing ever syncs
 * by accident.
 *
 * Wire `runSync(settings.cloudSyncEnabled)` to sync triggers (e.g. after a story
 * is saved, or on app foreground) and `purgeCloudData()` into the "clear all
 * data" flow so a local wipe also removes the cloud copy.
 */

import { getSupabaseClient } from '@/lib/AuthContext';
import { getConsentGiven } from '@/lib/storage';
import { apiRequest } from '@/lib/query-client';
import { syncAll, type EntityAdapter } from './engine';
import { reportSyncError } from './report';
import {
  storiesAdapter, badgesAdapter, streaksAdapter,
  favoritesAdapter, readAdapter, profileStubAdapter,
} from './storage-adapters';
import type { SyncEntity } from '@shared/sync-types';
import {
  isServerDeletionReceipt,
  type ServerDeletionReceipt,
} from '@shared/account-deletion';

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
 * A single in-flight sync, shared by concurrent callers. SyncManager fires from
 * four independent triggers (open/foreground/reconnect/sign-in) plus completion,
 * and each applyLocal is an unguarded whole-key read-modify-write — overlapping
 * runs could clobber each other's AsyncStorage writes. Coalescing to one run at
 * a time removes the sync-vs-sync race (a concurrent normal app write, e.g.
 * awardBadge mid-sync, is a separate, narrower window not covered here).
 */
let inFlightSync: Promise<boolean> | null = null;

/**
 * Run a full sync when enabled + consented + signed in; otherwise a no-op. Never
 * throws — sync is best-effort background work and must not break the app flow
 * that triggered it. Returns whether a sync actually ran. Concurrent calls share
 * the same in-flight run rather than racing.
 */
export async function runSync(enabled: boolean): Promise<boolean> {
  if (!enabled) return false;
  if (inFlightSync) return inFlightSync;
  inFlightSync = runSyncInner().finally(() => {
    inFlightSync = null;
  });
  return inFlightSync;
}

async function runSyncInner(): Promise<boolean> {
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
 * Permanently delete every server-side record owned by the signed-in parent.
 *
 * The settings screen already calls this before clearing local storage. The
 * server endpoint deletes PostgreSQL conversation transcripts, then deletes the
 * Supabase Auth identity; the auth.users cascade removes sync_records. Unlike
 * background sync, deletion intentionally throws on failure so the caller does
 * not wipe the device and sign out while retained server data still exists.
 */
export async function purgeCloudData(): Promise<ServerDeletionReceipt | null> {
  const ctx = await currentUserId();
  if (!ctx) return null;

  const response = await apiRequest('DELETE', 'api/account');
  const payload: unknown = await response.json();
  if (!isServerDeletionReceipt(payload)) {
    throw new Error('Account deletion completed without a valid verification receipt');
  }
  return payload;
}
