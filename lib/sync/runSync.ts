/**
 * Gated entry points for cloud sync. These are the ONLY functions app code
 * should call — they enforce the guardrails (parent opt-in + a signed-in
 * session + configured Supabase) so nothing ever syncs by accident.
 */

import { getSupabaseClient } from '@/lib/AuthContext';
import { apiRequest } from '@/lib/query-client';
import { syncAll, type EntityAdapter } from './engine';
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
