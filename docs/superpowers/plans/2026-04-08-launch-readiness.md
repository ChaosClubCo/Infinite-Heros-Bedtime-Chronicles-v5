# Launch Readiness Implementation Plan (Tier B) — OUTLINE ONLY

> Full task breakdown to be written when Tier A is complete.

**Goal:** Prepare the app for Google Play launch with COPPA compliance, privacy policy, client data migration, feature flags, and provider outage runbooks.

**Items:**
1. **COPPA compliance review** — audit data collection, add parental consent gate, verify no persistent tracking
2. **Privacy policy** — generate and serve a privacy policy page at `/privacy`, link from app settings
3. **Client data versioning/migration in lib/storage.ts** — add `version` field to all AsyncStorage data, migration runner on app startup
4. **Feature flags** — create `server/feature-flags.ts` with env-var-based flags, gate video generation behind `FEATURE_VIDEO_ENABLED`
5. **Runbooks for provider outages** — create `docs/runbooks/provider-outage.md` with escalation steps, fallback configuration, monitoring checks

**Dependencies:** Tier A (structured logging) should be complete first so runbooks can reference log queries.
