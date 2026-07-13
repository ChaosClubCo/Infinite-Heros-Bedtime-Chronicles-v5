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
import { syncAll, type EntityAdapter } from './engine';
import { purgeCloud } from './supabase-sync';
import { storiesAdapter, badgesAdapter, streaksAdapter } from './storage-adapters';
import type { SyncEntity } from '@shared/sync-types';

/** Entities wired for sync today (favorites/read/profileStub are staged). */
const ADAPTERS: Partial<Record<SyncEntity, EntityAdapter>> = {
  stories: storiesAdapter,
  badges: badgesAdapter,
  streaks: streaksAdapter,
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
  try {
    const ctx = await currentUserId();
    if (!ctx) return false;
    await syncAll(ctx.sb, ctx.userId, ADAPTERS);
    return true;
  } catch {
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
  } catch {
    return false;
  }
}
