# Infinity Heroes: Bedtime Chronicles — Vocabulary Spark System Specification

<!-- Last verified: 2026-09-11 -->

## Overview

The **Vocabulary Spark System** is a child-friendly language exploration and reading enhancement feature designed for young adventurers (ages 3–9) and parents. As children listen to or read bedtime stories, rich, curiosity-sparking words (such as *Constellation*, *Nebula*, *Lullaby*, *Celestial*, *Aurora*, *Bioluminescence*, and *Stardust*) are highlighted and brought to life through interactive celebration modals, speech synthesis pronunciation, contextual examples, and bedtime reflection affirmations.

---

## 1. Architecture & Core Components

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Data & Types Layer                            │
│  src/types.ts ──► VocabularyWord                                      │
│  src/data/vocabularyWords.ts ──► VOCABULARY_WORDS, Helper Functions    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┴───────────────────────────┐
       ▼                                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     LibraryView Integration   │        │     StoryReader Integration   │
│  - "Word Spark" Hero Banner   │        │  - Dynamic Scene Text Scanner │
│  - Quick Launch Modal         │        │  - In-Reader "Word Spark" Chip│
│  - Starlight Vocabulary Link  │        │  - Story Completion Replay    │
└──────────────┬────────────────┘        └──────────────┬────────────────┘
               │                                        │
               └────────────────────┬───────────────────┘
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │               VocabularySparkModal.tsx                 │
       │  - Animated Starlight Badge with Bangers typography    │
       │  - Audio Pronunciation via SpeechSynthesis Web API     │
       │  - Child-Safe Simplified Definition & Etymology Note   │
       │  - "In Our Story" Contextual Sample Sentence           │
       │  - Bedtime Whispered Reflection & Confetti Shower      │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Data Model (`VocabularyWord`)

Defined in `src/types.ts`:

```typescript
export interface VocabularyWord {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
  definition: string;
  simpleDefinition: string; // Child-friendly simplified meaning
  exampleSentence: string;
  bedtimeAffirmation?: string;
  iconName?: string;
  category: 'cosmic' | 'nature' | 'emotional' | 'magic' | 'scientific';
  funFact?: string;
}
```

### Pre-loaded Vocabulary Bank (`src/data/vocabularyWords.ts`)
- **Constellation** (`vocab-constellation`): Pattern of twinkling stars in the night sky forming pictures or mythical guardians.
- **Nebula** (`vocab-nebula`): A glowing cloud of stardust and colorful cosmic gas where new stars are born.
- **Lullaby** (`vocab-lullaby`): A soft, gentle melody sung or hummed to soothe a sleepy hero into peaceful dreams.
- **Celestial** (`vocab-celestial`): Belonging to the sky, deep space, or starry heavens.
- **Aurora** (`vocab-aurora`): Ribbons of shimmering neon green, violet, and gold starlight dancing across polar night skies.
- **Bioluminescence** (`vocab-bioluminescence`): Magical natural light produced by deep-sea creatures and fireflies that glow in the dark.
- **Stardust** (`vocab-stardust`): Ancient, microscopic flecks of cosmic wonder left behind by glittering supernovas.

---

## 3. User Experience & Flows

### 3.1 Library View Discovery
1. In the **Starlight Library** (`src/components/LibraryView.tsx`), parents and children encounter the **Vocabulary Spark** banner.
2. Clicking **"Learn Word: CONSTELLATION"** instantly triggers the celebration modal.
3. Audio pronunciation plays aloud using the Web Speech Synthesis API with a soft bedtime cadence.

### 3.2 Live Story Reading & Reader Integration
1. In the **Story Reader** (`src/components/StoryReader.tsx`), the active scene is scanned using `findVocabularyWordByText(currentScene.text)`.
2. When a matching word is identified in the passage, an amber-glowing **"Word Spark: [WORD] ✨"** button appears above the paragraph.
3. Tapping the chip opens the `VocabularySparkModal` without interrupting the ambient sleep soundscape.
4. On the final **Story Completed** celebration screen, readers can revisit the discovered Word Spark or explore the highlighted vocabulary milestone.

---

## 4. Accessibility & Audio Compliance
- **Web Speech API**: Graceful fallback if `window.speechSynthesis` is unavailable or restricted in iframe environments.
- **Non-blocking Narration**: Interacting with vocabulary words pauses or respects ambient sound settings and does not overwrite narrator state.
- **Touch Ergonomics**: All interactive chips and buttons feature minimum 44px touch bounding areas, tactile active states (`active:scale-95`), and clear WCAG AA color contrast against the `#05051e` midnight background.
