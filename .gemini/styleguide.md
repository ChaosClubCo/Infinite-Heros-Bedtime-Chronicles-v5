# Gemini Styleguide — Infinity Heroes: Bedtime Chronicles v5

Rules enforced by automated review agents.

## Navigation

Use **Expo Router v6** with a single root layout (`app/_layout.tsx`). All navigation
parameter access must use `useLocalSearchParams<T>()` generics for type safety.
Passing untyped string routes or accessing params without type parameters is not permitted.

## Android SDK Targets

Configure Android builds with:
- `targetSdkVersion: 35`
- `minSdkVersion: 26`

Set these in `app.json` under the `android` key.

## Build Commands

Use `npx expo` and `eas` CLI commands directly. **Never invoke `./gradlew` or `gradlew`**
— the EAS build environment manages Gradle internally.

Correct: `eas build --platform android`
Incorrect: `./gradlew assembleRelease`

## Verification (compile_applet standard)

Before submitting any PR, run the full verification suite:

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # npx expo lint
npm test            # vitest run
```

All three must pass with zero errors.
