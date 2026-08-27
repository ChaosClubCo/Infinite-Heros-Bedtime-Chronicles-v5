# Beta Testing Guide — Infinity Heroes: Bedtime Chronicles

## For Beta Testers

### Installing the App

1. You will receive an invite link to join the Google Play internal testing track.
2. Open the link on your Android device.
3. Accept the invitation in Google Play.
4. Install "Infinity Heroes" from the Play Store.

### What to Test

- **Parental consent**: On a fresh install, confirm the parental-consent gate appears before onboarding.
- **Create a hero**: Tap "Create Hero", fill in name/title/power, generate an avatar, then relaunch the app and confirm the hero persists.
- **Generate a story**: Test Classic, Mad Libs, and Sleep modes.
- **Make story choices**: Complete at least one branching story and confirm the completion state is saved.
- **Listen to narration**: Play, pause, resume, and test narration recovery after temporary network loss.
- **View library**: Confirm completed stories appear and reopen correctly.
- **Badges & streaks**: Complete stories and check the Trophies screen.
- **Offline/reconnect behavior**: Disconnect the network during an interaction, reconnect, and confirm the queued interaction syncs once without duplication.
- **Accessibility**: Try Android screen reader and Reduce Motion where available.

### Reporting Issues

Please report any issues you encounter, especially:

- App crashes or freezes
- Stories that contain inappropriate or unsafe content
- Parental-consent or privacy problems
- Audio playback problems
- Lost, duplicated, or incorrectly synced data
- Login or cloud-sync failures when account features are enabled
- UI bugs or confusing navigation

Report via: [GitHub Issues](https://github.com/chaosclubco/infinite-heros-bedtime-chronicles-v5/issues/new) — select the **"Bug Report"** template and include your Android version, app build/version, network state, what happened, and steps to reproduce.

Unsafe-content, security, privacy, consent, or cross-account data reports should be treated as release-blocking until reviewed.

### Known Limitations (Beta)

- Avatar/scene generation latency varies with AI-provider load and fallback behavior.
- Background music or generated audio may have additional first-play latency depending on cache state and configured persistence.
- Cloudflare KV persistence for rate limiting/idempotency is optional. If it is not configured, those controls use their documented in-memory fallback behavior.
- Cloud sync and authentication require the production Supabase client/server configuration to be present. When enabled, cloud-backed data is not strictly device-only.
- Voice Chat is implemented but currently has no normal in-app navigation entry point and is not part of the required beta acceptance path.
- Optional Sora video generation and R2-backed audio persistence are not required for beta acceptance unless explicitly enabled for the release.

## For Developers

### Canonical Release Gate

Use `docs/BETA_READINESS_2026-08-22.md` as the release decision contract. A missing or blocked verification gate is not a PASS.

### Building a Beta APK / AAB

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run test:components
npm run expo:check
npm run preflight
npm run verify:milestones
npm run verify:release-proof

# Preview APK / internal verification build
eas build --platform android --profile preview

# Production AAB for Play internal testing
eas build --platform android --profile production
```

### Required EAS / Client Configuration

Configure the public mobile values through the project's supported EAS environment mechanism:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Do not place service-role or AI-provider secrets in `EXPO_PUBLIC_*` variables. Anything with that prefix is eligible to become part of the client bundle.

### Server Deployment

The Express server is deployed separately from the mobile bundle. For Supabase-authenticated/cloud-sync operation it needs both:

- `SUPABASE_URL` (or the server-visible supported Supabase URL variable)
- `SUPABASE_SERVICE_ROLE_KEY`

The public Supabase URL used by the mobile bundle does not, by itself, configure the deployed server. If the server cannot initialize Supabase auth, auth-gated requests fail rather than silently operating as authenticated traffic.

Also configure the provider and operational secrets required by the features enabled for the beta release, following `.env.example`, `docs/SECURITY.md`, and `docs/operations/EAS-SECRETS-CHECKLIST.md`.

### Running Tests

```bash
npm test
npm run test:coverage
npm run test:components
npm run typecheck
npm run lint
npm run expo:check
npm run preflight
npm run verify:milestones
npm run verify:release-proof
```

### Manual Acceptance

Before inviting external beta testers, execute the physical-device critical journeys listed in `docs/BETA_READINESS_2026-08-22.md` against the exact candidate build and server revision.
