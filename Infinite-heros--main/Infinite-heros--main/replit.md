# Infinity Heroes

## Overview
Infinity Heroes is a kid-safe bedtime story app with an Expo (React Native) frontend and an Express backend. Kids can create custom superhero stories with guided options, while parent controls and safety rules keep output age-appropriate and non-scary.

This document reflects the current repo state and platform direction for `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`.

## User Preferences
Preferred communication style: Simple, everyday language.

## Current System Architecture

### Frontend (Expo / React Native)
- **Framework**: Expo + React Native app with modern architecture and TypeScript-first codebase.
- **Routing**: Expo Router file-based routing with tabbed navigation under `app/(tabs)/`.
- **Primary Product Flow**:
  - Onboarding and first-time setup
  - Story library browsing
  - Quick create / guided story creation
  - Saved stories and profile controls
- **State Management**:
  - React Context for app-wide settings/profile flows
  - TanStack React Query for server-backed async state
  - Local component state for screen-level interactions
- **Local Persistence**: AsyncStorage for user profile details, onboarding completion, saved content, and parent-control-related settings.
- **Styling & UI**: Custom themed React Native UI (cosmic/night palette) with reusable constants and component-level styles.
- **Motion & Media**:
  - Reanimated-powered UI effects
  - `expo-av` for narration playback and background audio behavior
- **Accessibility/UX Intent**: Child-friendly copy, simple interaction loops, and reduced-friction flows for bedtime use.

### Backend (Express + TypeScript)
- **Runtime**: Node.js + TypeScript.
- **Server**: Express API server serving JSON endpoints and supporting app/web assets where configured.
- **Core API Capabilities**:
  - Story generation
  - Text-to-speech orchestration
  - AI setting/theme suggestion helpers
  - AI image generation routes (avatar/scene style flows)
- **Security & Hardening**:
  - Input sanitization
  - Rate limiting
  - Basic path and request safety protections
- **Operational Pattern**: Backend acts as orchestration layer between mobile clients and external AI/media providers.

### AI & Provider Strategy
- **Multi-provider model layer** with fallback routing for resilience.
- **Primary use cases**:
  - Story text generation
  - Suggestion generation
  - Image generation
  - Voice narration synthesis
- **Safety Emphasis**:
  - Child-safe prompt shaping
  - Bedtime tone control (calm, reassuring, non-violent)
  - Parent-trust oriented defaults

### Shared Code (`shared/`)
- Shared validation and schema modules used across client/server boundaries.
- Drizzle + Zod schema patterns are present to keep types and validation aligned.

### Data Layer
- **ORM**: Drizzle ORM targeting PostgreSQL via `DATABASE_URL`.
- **Current usage pattern**: Core storytelling flows can run without requiring deep relational persistence; schema scaffolding supports future user/content expansion.

### Replit Integrations (`server/replit_integrations/`)
- Contains provider integration helpers for text, image, and media workflows.
- Not every integration module is required in every runtime path; modules act as a capability pool for fallback/expansion.

## Build, Run, and Deployment
- Supports local development with frontend/backend workflow separation.
- Production build paths support serving packaged app assets and API from the deployed environment.
- Environment-driven configuration controls domains, model access, and database connectivity.

### Important Environment Variables
- `EXPO_PUBLIC_DOMAIN`
- `DATABASE_URL`
- Provider/API keys for configured AI and voice services

## External Dependencies (Current)

### Services & APIs
- **Google Gemini** (text + image generation paths)
- **OpenAI** (text/image fallback and advanced media paths where enabled)
- **Anthropic Claude** (story-generation-capable provider)
- **OpenRouter providers** (additional fallback/coverage options)
- **ElevenLabs** (narration / TTS)
- **PostgreSQL** (data persistence)

### Key Package Families
- **Frontend**: Expo ecosystem, Expo Router, Reanimated, React Query, AsyncStorage
- **Backend**: Express, provider SDKs, Drizzle ORM, PostgreSQL driver
- **Validation/Schema**: Zod, Drizzle-Zod

## Repository Language Composition
- TypeScript: **68%**
- Python: **16.8%**
- HTML: **10.4%**
- JavaScript: **2.9%**
- CSS: **1.1%**
- Shell: **0.8%**

## Notes for Future Updates
When updating this file again, prioritize:
1. SDK/framework version changes (Expo/RN/Router)
2. AI provider routing changes and safety policy changes
3. New/removed API endpoints
4. Data model maturity (in-memory vs persistent)
5. Parent controls and child-safety behavior changes
