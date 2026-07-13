# ADR-0006 — Migrate to Native Android (Kotlin + Jetpack Compose)

> Archived verbatim from `krosebrook/bedtime_chronicles-v2`'s `docs/adr/0006-migrate-to-native-android-kotlin.md`.
> See [README.md](./README.md) in this folder for why this direction was archived rather
> than carried forward into the merged super version.

**Status:** accepted

**Date:** 2026-06-11

---

## Context

Infinity Heroes: Bedtime Chronicles was initially structured as a hybrid React Native application utilizing Expo SDK 54 and an Express.js backend. Although hybrid architectures allowed convenient cross-platform scoping, the team encountered key physical bounds in Replit/AI Studio running simulated screens, performance constraints in programmatic DSP wave synthesis inside JavaScript threads, and complex bridge layers calling local device hardware.

Key native Android requirements:
- Low-latency real-time programmatic audio synthesis (DSP) using `AudioTrack` buffers on independent native threads.
- Seamless edge-to-edge Material 3 visual compliant screens with premium cinematic micro-animations.
- Reliable, robust offline-first SQL database layers utilizing Android Room with type-safe KSP code-generation.
- Secure, straightforward compile-time injection of environment variables and secrets via the Secrets Gradle Plugin.
- Superior memory stewardship ensuring background bedtime narration processes run without unexpected client freezes.

---

## Decision

Migrate the hybrid React Native/Express structure entirely to a **Native Modern Android Development (MAD)** application built with:
- **Programming Language**: Kotlin exclusively.
- **UI Framework**: Jetpack Compose implementing Material 3 layout systems and color design tokens.
- **Local Persistence**: Jetpack Room SQLite databases (`AppDatabase`) paired with type-safe DAOs.
- **Audio synthesis**: Native programmatic wave equation rendering on AudioTrack instances (`AmbientSoundHelper`), alongside Android's built-in TextToSpeech framework.
- **GenAI Connectivity**: Direct client-side Retrofit REST calls mapping to Google Gemini (`gemini-2.5-flash` for customized bedtime stories) and Imagen (`imagen-3.0-generate-002:generateImages` for cover art illustrations).

---

## Consequences

- **Performance**: Significant performance improvements in real-time waveshape rendering (Rain, Ocean, Wind, Breeze) without blocking the primary visual rendering threads.
- **Consistency**: Centralized Kotlin ViewModels manage state through immutable Kotlin `StateFlow` structures, making state tracking fully predictable.
- **Stewardship**: Native Android lifecycle-aware collection states (`collectAsStateWithLifecycle()`) protect the device battery and prevent active sound leakage once the application shifts to the background.
- **Compliance**: Local data sandboxing ensures profiles and story logs remain strictly on-device, fully compliant with international COPPA standards.
