# Infinity Heroes: Bedtime Chronicles — Library UI Specification & Implementation

<!-- Last verified: 2026-09-11 -->

## Overview

This document details the architecture, design tokens, data models, and interactive behavior for the overhauled **Infinity Heroes Library** screen (`src/components/LibraryView.tsx`), aligning with the high-fidelity UI design screenshots provided.

---

## 1. Visual Hierarchy & Structural Layout

The Library interface is crafted for both parent bedtime navigation and young readers, featuring deep celestial dark backgrounds (`#05051e` / `#09071c`), cosmic glows, responsive cards, and tactile touch targets.

### 1.1 Header Navigation
- **Back Navigation Button (Left)**: Circular tactile button with subtle glass border (`border-slate-700/60`), routing back to the primary Home view.
- **Title (Center)**: Display typography using the Google Font `Bangers` (`font-bangers text-3xl sm:text-4xl`) with a cosmic gradient (`from-indigo-200 via-white to-purple-200`) and celestial drop shadow glow (`drop-shadow-[0_0_12px_rgba(192,193,255,0.45)]`).
- **Settings Button (Right)**: Circular tactile button providing quick access to parental controls and personalization preferences.

### 1.2 Search & Discovery Bar
- **Pill Search Capsule**: Centered input with `rounded-full`, backdrop blur, and custom SVG `Search` icon.
- **Placeholder**: `"Search for a magical tale..."` matching the design reference.
- **Real-Time Filtering**: Instant reactive search filtering against story titles, summaries, heroes, categories, tags, and badges with an instant reset button.

### 1.3 Category Cards Grid
A 4-card thematic category selector:
1. **Cosmic** — Astronaut and nebula illustration with starlight accents.
2. **Magical** — Enchanted glowing castle with twilight fantasy lighting.
3. **Winter** — Mountain castle under celestial snowfall.
4. **Oceanic** — Deep sea bioluminescent whale and coral reef exploration.

Each card features hover scaling (`hover:scale-[1.01]`, image zoom), active ring glow, and toggle behavior (click to filter, click again or select "Show All" to reset).

### 1.4 Sub-Navigation Tabs
- **All Crafted**: Full collection of hand-crafted master bedtime adventures.
- **New Arrivals**: Filtered view featuring the freshest additions with glowing arrival indicator.
- **Favorites**: Filtered view displaying user-saved/bookmarked tales with live count badge.
- **Interactive Duration Drawer**: Accessible via the "Filters" toggle, allowing instant selection between:
  - *⚡ Quick (< 8 min)*
  - *📖 Standard (8–12 min)*
  - *🌌 Extended (13+ min)*

### 1.5 Hero Feature Banner ("Editor's Pick")
- Prominent cinematic banner card showcasing **The Starry Whales**.
- **Badges**: `"Editor's Pick"` in royal indigo and `"12 min read • Cosmic"` in translucent obsidian/amber.
- **Actions**:
  - `Listen Story` (Primary action button with play icon)
  - `Bookmark Story` (Toggle bookmark status)
  - `Story Details` (Launches full interactive preview modal)

### 1.6 Bento Grid & Highlights
- **Primary Grid**: Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) with cover art, duration badges, hero affiliations, star ratings (e.g., 4.9/5.0), titles, summaries, and action controls.
- **New Arrivals Carousel/Grid**: Highlight cards featuring *Astro Pups*, *Planet Giggles*, and *The Moon Owl*.
- **All Crafted Section**: Quick preview cards for *Galaxy Book*, *Earth's Lullaby*, and *Journey to the Core*.

### 1.7 Story Preview Modal
- Pop-up modal launched via the "Preview" or info button on any story card.
- Displays full cover artwork, category badge, duration, theme, age recommendation, pacing mode, rating stars, and one-click "Start Bedtime Journey" trigger.

### 1.8 Story Seeds Vault
- Collapsible discovery accordion giving access to AI story seed prompts, complete with category auto-detection, duration estimation, and one-click story generation.

---

## 2. Data Model Extensions

The `Story` interface (`src/types.ts`) supports the visual requirements:

```typescript
export interface Story {
  id: string;
  title: string;
  theme: string;
  mode: 'classic' | 'madlibs' | 'sleep';
  ageRange: string;
  scenes: Scene[];
  summary: string;
  heroId: string;
  heroName: string;
  companionName?: string;
  coverImage?: string;
  category: string;
  badge?: string;
  audioDurationMinutes?: number;
  rating?: number;        // e.g. 4.9, 4.8
  isEditorPick?: boolean; // Editor's pick highlight flag
  tags?: string[];        // ['New Arrivals', 'Cosmic', 'Bedtime']
}
```

---

## 3. Component Hierarchy

```
src/App.tsx
└── LibraryView.tsx
    ├── OfflineAlertBanner
    ├── TopNavigationBar (Back, Bangers Title, Settings)
    ├── SearchCapsule
    ├── ThematicCategoriesRow (Cosmic, Magical, Winter, Oceanic)
    ├── SubNavigationTabs (All Crafted, New Arrivals, Favorites, Filters)
    ├── DurationFilterDrawer (Quick, Standard, Extended)
    ├── HeroFeatureBanner (Editor's Pick: The Starry Whales)
    ├── BentoStoryGrid (Stories matching active filters)
    ├── NewArrivalsSection (Astro Pups, Planet Giggles, Moon Owl)
    ├── AllCraftedSection (Galaxy Book, Earth's Lullaby)
    ├── StorySeedsVault (Collapsible AI prompt generator)
    └── StoryPreviewModal (Full details dialog with direct launch)
```

---

## 4. Verification & Testing

- **Linter**: Zero ESLint errors or warnings across application code (`npm run lint`).
- **Build**: Successfully compiles without errors (`npm run build`).
- **Responsive**: Fully responsive across mobile (<640px), tablet (640px-1024px), and desktop (>1024px).
