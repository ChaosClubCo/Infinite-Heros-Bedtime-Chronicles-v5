# Android Development Best Practices

> Archived verbatim from `krosebrook/bedtime_chronicles-v2`'s `docs/guides/ANDROID-BEST-PRACTICES.md`.
> See [README.md](./README.md) in this folder for why this direction was archived rather
> than carried forward into the merged super version.

> Infinity Heroes: Bedtime Chronicles — Native Android Architecture & Design Guidelines (Kotlin, Jetpack Compose, Material 3)

---

## 1. Core Architecture Overview

The bedtime application is organized around **Modern Android Development (MAD)** standards, utilizing a decoupled **MVVM (Model-View-ViewModel)** architectural pattern.

### Separation of Concerns
```
                    ┌─────────────────────────┐
                    │     UI/Compose Views     │
                    │   (Screens & Composable) │
                    └────────────┬────────────┘
                                 │ Observes UI State
                                 ▼
                    ┌─────────────────────────┐
                    │        ViewModels       │
                    │ (Exposes ViewState/Flow)│
                    └────────────┬────────────┘
                                 │ Orchestrates
                                 ▼
               ┌─────────────────┴─────────────────┐
               ▼                                   ▼
  ┌─────────────────────────┐         ┌─────────────────────────┐
  │      Local Database     │         │     Hardware Helpers    │
  │ (Room DB Entity, DAOs) │         │   (TTS & DSP Synthesizer)│
  └─────────────────────────┘         └─────────────────────────┘
```

1. **Presentation Layer (Jetpack Compose)**: Stateless UI screens displaying reactive flow states, emitting user-triggered intent events to view models.
2. **State Orchestration Layer (ViewModel)**: Lifecycle-aware coordinators exposing immutable states via `StateFlow` and scheduling operations on background threads using Kotlin Coroutines.
3. **Data Layer (Offline-First)**: SQLite persistence backed by **Jetpack Room** (`AppDatabase`) and simple configurations saved via Android key-value pairs (`AppPreferences`).
4. **Service & Utility Helpers**: Asynchronous background workers for Text-to-Speech boundaries (`TextToSpeechHelper`) and real-time audio threads (`AmbientSoundHelper`).

---

## 2. Jetpack Compose UI Standards

All new screens, components, and interactive overlays must comply with Material 3 design systems and responsive parameters.

### 2.1 State Collection & Lifecycle Awareness
To prevent memory leaks and unnecessary computing cycles when the app is in the background, always collect StateFlows using the **lifecycle-aware `collectAsStateWithLifecycle`** extension:

```kotlin
// ❌ BAD: Collects state even when UI is not active/visible
val state by viewModel.state.collectAsState()

// ✅ GOOD: Automatically pauses collection when app goes background
import androidx.lifecycle.compose.collectAsStateWithLifecycle
val state by viewModel.state.collectAsStateWithLifecycle()
```

### 2.2 Accessing Context and Lifecycle
Do not pass `Context` references inside ViewModels. Resolve them directly within composables using `LocalContext.current` and scope preferences to a remember container:

```kotlin
@Composable
fun MyScreen(viewModel: MyViewModel = viewModel()) {
    val context = LocalContext.current
    // Retrieve singletons or system preferences in a remembered block to avoid multiple memory reads
    val prefs = remember { AppPreferences.getInstance(context) }

    // UI layout...
}
```

### 2.3 TestTag Attributes & IDs
For automation, visual checks, and reliable UI testing, every interactive element (Buttons, Text Inputs, selectable Tiles) **MUST** include a deterministic `testTag`:

*   **Rule**: Use `snake_case` naming conventions prefixing with element purpose.
*   **Examples**:
    *   `Modifier.testTag("submit_button")`
    *   `Modifier.testTag("hero_choice_hero-1")`
    *   `Modifier.testTag("achievements_section_title")`
    *   `Modifier.testTag("avatar_emoji_🦸")`

### 2.4 Layout & Spacing Requirements
*   **Edge-to-Edge**: Always design screens within a `Scaffold` container that automatically propagates window inset padding (`contentWindowInsets`).
*   **Touch Targets**: Interactive controls must maintain a minimum target geometry of **48.dp x 48.dp** to meet WCAG AA and Google Play requirements.
*   **Typography**: Use explicit tokens from `MaterialTheme.typography` rather than manual text sizes to maintain typographic hierarchy under user font scaling.

---

## 3. Gamification & Chronicles Engine

The application includes an immersive bedtime journey progress tracker called **Bedtime Chronicles** utilizing local metadata:

### 3.1 Content Themes & Categories
The homepage organizes stories into **6 core developmental attributes** designed to encourage healthy bedtime thoughts. Keep categories synced using emojis:
*   🦁 **Courage**
*   💗 **Kindness**
*   🤝 **Friendship**
*   ✨ **Wonder**
*   🌈 **Imagination**
*   🧸 **Comfort**

### 3.2 Hero Templates Selection Carousel
Interactive hero cards allow instant generation configuration in `CreateStoryScreen`. Tapping a hero injects presets:
*   ✨ **Nova** (Shield / Constellation: *The Shield*)
*   🌊 **Coral** (Waves / Constellation: *The Wave*)
*   🏹 **Orion** (Star / Constellation: *The Bridge*)
*   🌙 **Luna** (Loom / Constellation: *The Loom*)
*   ☁️ **Nimbus** (Cloud / Constellation: *The Cloud*)
*   🌸 **Bloom** (Seeds / Constellation: *The Garden*)
*   🚂 **Whistle** (Express / Constellation: *The Track*)
*   👥 **Shade** (Shadows / Constellation: *The Shadow*)

### 3.3 Badges & Trophy unlocking checklist
There are **12 developmental achievements** managed via `AppPreferences` and unlocked dynamically after finishing a story session in `ReaderScreen`:

| Badge ID | Emoji | Title | Condition / Unlocking Rule |
|---|---|---|---|
| `first-adventure` | 🌟 | First Adventure | Completed at least 1 reading session. |
| `night-owl` | 🦉 | Night Owl | Story read after 8:00 PM or before 5:00 AM. |
| `early-bird` | 🐦 | Early Bird | Story read between 5:00 AM and 10:00 AM. |
| `all-heroes` | 🏆 | Hero Collector | Read stories using 8 distinct heroes. |
| `mad-libs-master` | 🤪 | Silly Storyteller | Done 3 creative "Mad Libs" customized stories. |
| `dream-weaver` | 🌙 | Dream Weaver | Read 3 sleep stories emphasizing pure relaxation. |
| `classic-champion` | ⚔️ | Classic Champion | Done 5 standard classic tales. |
| `story-streak-3` | 🔥 | On Fire! | Streak counter reaches 3 days. |
| `story-streak-7` | 💎 | Diamond Reader | Streak counter reaches 7 days. |
| `bookworm` | 📚 | Bookworm | Read 10 total full stories. |
| `legend` | 👑 | Story Legend | Read 25 total full stories. |
| `vocabulary-star` | 📖 | Word Wizard | Learned at least 5 customized vocabulary items. |

---

## 4. Wave-Shaping Sound Synthesis (DSP)

A key differentiator of the Bedtime Experience is the **real-time mono-synthesizer thread** (`AmbientSoundHelper`), running entirely locally using native audio buffers to bypass heavy media downloads.

### 4.1 DSP Architecture
*   **Sample Rate**: `22050 Hz` (optimal balance between RAM footprints, calculations frequency, and hardware capabilities).
*   **Buffer Size**: `2048` frames.
*   **Threading Control**: Synthesis operations execute inside dedicated synchronous priority threads, managed via a clean Kotlin coroutine dispatcher loop.

### 4.2 Waveform Formula Reference
The synthesizer produces **4 organic soundscapes** by continuous mathematical waveshaping of white noise, band filters, and low-frequency oscillators ($LFOs$):

```
       [Random Noise Generator] ─────► [Waveshaper Matrix] ─────► [VCA Volume Envelope]
                                              ▲
                                      [Sine/Cosine LFO]
```

1.  **Gentle Rain**: Generates white noise and applies a state-variable low-pass recursive filter matching a custom rolling state coefficient to mimic natural cloudburst rumbles:
    $$\text{Output}[t] = \text{Output}[t-1] + \alpha \times (\text{Input}[t] - \text{Output}[t-1])$$
2.  **Space Echoes**: Modulates base frequencies via Low Frequency Oscillators ($LFO$) running a standard sine-wave algorithm to create planetary winds:
    $$\phi_{\text{LFO}}[t] = \sin(2\pi \times f_{\text{LFO}} \times t)$$
3.  **Cozy Waves**: Rhythmic pink-noise amplitude envelope mimicking tidal surges:
    $$\text{VolumeAmplitude}[t] = 0.4 + 0.6 \times \cos^2(2\pi \times f_{\text{tide}} \times t)$$
4.  **Forest Breeze**: Slowly flutters high-frequency cutoff points to sound like wind blowing through garden leaves.

### 4.3 Safe Sleep Fade-Out Timer
A crucial infant sleep-safety best practice: **When the countdown timer has 10 seconds remaining, initiate a linear audio volume decay:**
$$\text{OutputVolume} = \text{TargetVolume} \times \left( \frac{\text{TimeRemaining}}{10} \right)$$
Never truncate or hard-cut ambient synthesis suddenly. Smooth fades ensure babies stay asleep undisturbed.

---

## 5. Local Data & Persistence Strategy

The system relies on an offline-first strategy ensuring kids can read stories even while traveling without internet connection.

### 5.1 SQLite Schema with Room DB
Keep entity keys and structural queries clean:
*   `UserProfile` holds player parameters like age, active customized avatar, and character metadata.
*   `GeneratedStoryContent` stores cached story text JSON, active sentence locations, vocabulary learning arrays, and creation dates.

### 5.2 Key-Value Configurations
Utilize `AppPreferences.kt` as an encapsulated repository to handle lightweight operational state flags:
*   Ambient sound selected loop types (`AMBIENT_SOUND_TYPE`).
*   Volume values and text-to-speech speaker rates (`AMBIENT_VOLUME`, `SPEAKER_RATE`).
*   Active milestones progress vectors (`STORY_PROGRESS_ID`, streaking arrays).

---

## 6. Verification & Compilation Quality Control

To ensure updates to the codebase do not break the Android application, run verification cycles:

```bash
# Verify the entire codebase compiles successfully
compile_applet
```

Avoid adding heavy visual frameworks or non-standard external dependencies without verifying build compatibility. Use clean Jetpack Compose layouts and Material 3 components exclusively.
