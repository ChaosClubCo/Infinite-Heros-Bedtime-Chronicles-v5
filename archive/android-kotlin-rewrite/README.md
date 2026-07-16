# Archived: Native Android (Kotlin/Jetpack Compose) Rewrite

## What this was

Between 2026-06-11 and 2026-07, `krosebrook/bedtime_chronicles-v2` developed a parallel,
from-scratch native Android client for this app — Kotlin, Jetpack Compose (Material 3),
Room DB persistence, a real-time DSP ambient-sound synthesizer (`AudioTrack` buffers),
direct client-side Retrofit calls to Gemini/Imagen, and a substantial set of screens (Home,
Reader, CreateStory, Library, Profile, CharacterCreator, Help) with unit and instrumented
tests. It was a deliberate architectural pivot, recorded in ADR-0006 (copied below), and was
actively built out — not abandoned scaffolding.

## Why it was archived, not carried forward

This merge consolidates three sibling repos
(`chaosclubco/infinite-heros-bedtime-chronicles-v5`,
`krosebrook/bedtime_chronicles-v2`, `krosebrook/infinite-heros-bedtime-chronicles-v5-main`)
into one canonical codebase. Expo/React Native — the stack this repo (v5) already ships —
remains the sole canonical client going forward. Maintaining two client platforms in one
merge wasn't in scope, and the Kotlin rewrite's own source (Gradle, Kotlin, the
`lib/gateway/` proxy stub) is deliberately **not** copied into this tree: neither
`tsconfig.json` nor `eslint.config.js` here exclude arbitrary new folders, so live
Kotlin/Gradle files would be picked up by `npm run typecheck` / `npm run lint` as dead
code needing its own exclusion rules for no active benefit.

## Where the real thing lives

The full source (Kotlin/Compose app, Gradle config, Room DB, tests, and the
`lib/gateway/` proxy stub) is preserved, unmodified, on a dedicated branch in its
original repo:

```
git clone https://github.com/Krosebrook/Bedtime_chronicles-v2.git
cd Bedtime_chronicles-v2
git checkout archive/android-kotlin-rewrite-2026-07-13
```

That branch is a snapshot of `bedtime_chronicles-v2` at commit `8510258` (the tip
immediately before this repo's junk cleanup and tree-adoption merge landed) — every file
that existed there, including the ~150+ unrelated pasted/duplicate files that were part of
that repo's clutter, is retrievable from it. Only the Android/Kotlin work and its
supporting docs are worth pulling back out.

## What's copied here (docs only)

- [`ADR-0006-migrate-to-native-android-kotlin.md`](./ADR-0006-migrate-to-native-android-kotlin.md)
  — the decision record explaining the native-Android rationale.
- [`ANDROID-BEST-PRACTICES.md`](./ANDROID-BEST-PRACTICES.md) — the Kotlin/Compose
  architecture and design guidelines that were followed.
- [`2026-06-11-launch-readiness-phases.md`](./2026-06-11-launch-readiness-phases.md) —
  a launch-readiness phase plan written against the (then-Expo) codebase; kept for
  historical context, not current status.
- [`gateway-README.md`](./gateway-README.md) — the proposed "Secure Serverless Proxy
  Gateway" design meant to front the native app's direct Gemini/Imagen calls. This repo's
  Express server already solves the same problem (API keys stay server-side) for the
  Expo client, so the gateway was never wired into anything active.

None of this repo's active `docs/adr/` (ADRs 0001–0005) were touched by this archival —
ADR-0006 is filed here specifically because it documents a direction this codebase did
not take.
