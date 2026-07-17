/**
 * Error visibility for cloud sync. `lib/sync` is unit-tested in a node env, so it
 * must stay free of native imports (e.g. `@sentry/react-native`). Instead of
 * importing Sentry directly, sync emits failures through a swappable reporter:
 * the default logs to console, and the app layer (`app/_layout.tsx`, where Sentry
 * is initialized) installs a reporter that also forwards to Sentry.
 *
 * Without this, a fully broken sync (bad RLS, schema drift, dropped network) is
 * invisible — `runSync`/`purgeCloudData` swallow their errors and `syncAll`'s
 * per-entity `errors[]` is discarded by the caller.
 */

/** Reports a sync failure. `context` labels where it happened (e.g. `syncAll:stories`). */
export type SyncErrorReporter = (
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
) => void;

/** Node-safe default: log a one-line warning. Overridden by the app layer to add Sentry. */
const defaultReporter: SyncErrorReporter = (context, error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[cloud-sync] ${context}: ${message}`);
};

let reporter: SyncErrorReporter = defaultReporter;

/** Install a custom reporter (e.g. one that also captures to Sentry). */
export function setSyncErrorReporter(next: SyncErrorReporter): void {
  reporter = next;
}

/**
 * Report a sync failure. Wrapped in its own try/catch so error reporting can
 * never break best-effort sync (the whole point is that sync is fire-and-forget).
 */
export function reportSyncError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  try {
    reporter(context, error, extra);
  } catch {
    // Reporting must never throw into the sync path.
  }
}
