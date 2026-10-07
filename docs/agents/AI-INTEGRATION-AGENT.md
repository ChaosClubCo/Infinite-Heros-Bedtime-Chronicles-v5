<!-- Last verified: 2026-10-07 -->
# AI-INTEGRATION-AGENT.md — AI Provider Router Expert

Specialized agent context for all work touching the multi-provider AI routing system, prompt engineering, and provider integrations.

---

## Domain Scope

This agent is authoritative for:
- `server/ai/index.ts` — Provider registration and status checking
- `server/ai/router.ts` — `AIRouter` class with per-task fallback chains
- `server/ai/types.ts` — AI provider interface definitions
- `server/ai/providers/` — Individual provider implementations (Gemini, OpenAI, Anthropic, OpenRouter)
- All AI prompt construction across `server/routes.ts`
- `CHILD_SAFETY_RULES` constant and its inclusion in story prompts

---

## Architecture

```
Route Handler
    │
    └── server/ai/index.ts   ← Public entry point (always use this)
            │
            └── AIRouter (server/ai/router.ts)
                    │
                    ├── anthropic provider  (Priority 1 for stories)
                    ├── gemini provider     (Priority 2 / Primary for images)
                    ├── openai provider     (Priority 3)
                    ├── meta-llama provider (via OpenRouter)
                    ├── xai provider        (via OpenRouter)
                    ├── mistral provider    (via OpenRouter)
                    └── cohere provider     (via OpenRouter)
```

**Critical rule:** All application AI calls should go through `server/ai/index.ts`. Provider SDK usage is isolated to provider/integration modules, not ordinary route handlers.

---

## Fallback Chain Configuration

### Text Generation (story, suggestion, madlibs, etc.)

| Priority | Provider Key | Model |
|----------|-------------|-------|
| 1 | `anthropic` | `claude-sonnet-4-6` |
| 2 | `gemini` | `gemini-2.5-flash` |
| 3 | `openai` | `gpt-4o-mini` |
| 4 | `meta-llama` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| 5 | `xai` | `x-ai/grok-3-mini` |
| 6 | `mistral` | `mistralai/mistral-small-3.1-24b-instruct` |
| 7 | `cohere` | `cohere/command-a-03-2025` |

### Image Generation (avatar, scene)

| Priority | Provider Key | Model |
|----------|-------------|-------|
| 1 | `gemini` | `gemini-2.5-flash-image` |
| 2 | `openai` | `gpt-image-1` |

### Unknown Tasks
Falls back to `["gemini", "openai"]` — always define a task type.

---

## Calling AI from a Route

```typescript
import { generateText, generateImage } from '@/server/ai/index';

const storyText = await generateText({
  task: 'story',
  prompt: buildStoryPrompt(params),
  systemPrompt: CHILD_SAFETY_RULES + STORY_SYSTEM_PROMPT,
  maxTokens: 2000,
});

const imageDataUri = await generateImage({
  task: 'scene',
  prompt: buildScenePrompt(params),
  width: 1024,
  height: 768,
});
```

The AIRouter handles provider selection and fallback automatically. Callers must still catch final failure (all providers exhausted).

---

## Prompt Engineering Rules

### Child Safety System Prompt (Mandatory)

`CHILD_SAFETY_RULES` **must** be included in every story generation system prompt. Never remove or bypass it.

```typescript
const systemPrompt = `${CHILD_SAFETY_RULES}

You are a creative children's story writer...`;
```

### Input Sanitization Before Prompts

All user-provided strings **must** pass through `sanitizeString()` before inclusion:

```typescript
const safeName = sanitizeString(heroName);
const safeScene = sanitizeString(sceneText, 2000);
const prompt = `Write a story about ${safeName} in ${safeScene}...`;
```

### Prompt Construction Best Practices
- Be explicit about JSON output format — include example schema in the prompt.
- Specify max word counts and part structure for story generation.
- For scene prompts, select a random art style from the 12 presets.
- Always include the age range in story prompts to calibrate vocabulary.
- Use structured output hints: "Return ONLY valid JSON. No markdown. No preamble."

---

## Art Styles for Scene Illustration

```typescript
const ART_STYLES = [
  'watercolor', 'cel-shaded', 'paper cutout', 'gouache',
  'crayon', 'digital painting', 'retro storybook', 'ink wash',
  'pastel', 'pop art', 'chalk illustration', 'flat design'
];
const style = ART_STYLES[Math.floor(Math.random() * ART_STYLES.length)];
```

---

## Story Response Schema

AI must return this JSON structure for story generation:

```json
{
  "title": "3-6 word title",
  "parts": [
    {
      "text": "2-4 paragraphs of story content",
      "choices": ["Choice A", "Choice B", "Choice C"],
      "partIndex": 0
    }
  ],
  "vocabWord": {
    "word": "string",
    "definition": "child-friendly definition"
  },
  "joke": "age-appropriate joke",
  "lesson": "gentle life lesson (1-2 sentences)",
  "tomorrowHook": "teaser for next adventure",
  "rewardBadge": {
    "emoji": "🌟",
    "title": "2-3 word badge title",
    "description": "short description"
  }
}
```

---

## Story Duration Configuration

| Duration Key | Parts | Word Count |
|-------------|-------|------------|
| `short` | 3 | 200–300 |
| `medium-short` | 4 | 350–450 |
| `medium` | 5 | 500–650 |
| `long` | 6 | 750–950 |
| `epic` | 7 | 1000–1300 |

---

## Adding a New AI Provider

1. Create `server/ai/providers/<name>.ts` following the existing provider interface in `server/ai/types.ts`.
2. Register the provider in `server/ai/index.ts`.
3. Add it to the appropriate fallback chain in `server/ai/router.ts` `DEFAULT_CHAINS`.
4. Add the server-only API key env var to `.env.example` and `README.md`.
5. Update `docs/ARCHITECTURE.md` AI routing section.

```typescript
interface AIProvider {
  name: string;
  generateText(params: TextGenerationParams): Promise<string>;
  generateImage?(params: ImageGenerationParams): Promise<string>;
  isAvailable(): boolean;
}
```

---

## Provider Status Endpoint

```
GET /api/ai-providers
Response: { providers: ProviderStatus[] }
```

Each `ProviderStatus` includes `name`, `available` (boolean), and `model`.

---

## Environment Variables

```text
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=        # Optional custom Anthropic-compatible gateway
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=       # Optional custom OpenRouter-compatible gateway
ELEVENLABS_API_KEY=        # Narration/TTS
```

At least one text-provider credential must be configured for generation; Gemini is the simplest baseline for a Google AI Studio migration. All provider credentials are **server-side only**. Never expose them in client code or `EXPO_PUBLIC_*` variables.

`GEMINI_API_KEY` uses the canonical Gemini API endpoint. Do not reintroduce `AI_INTEGRATIONS_*` or a Replit proxy URL as a fallback. OpenAI likewise uses `OPENAI_API_KEY` directly. Optional base URLs remain available only for provider-neutral Anthropic/OpenRouter gateway deployments.

---

## What This Agent Must Flag for Human Review

- Any change to `CHILD_SAFETY_RULES` or its inclusion in prompts
- Changes to provider priority order in `DEFAULT_CHAINS`
- New AI providers that process child-generated content
- Prompt changes that remove safety guardrails
- Any code that calls AI provider SDKs directly from ordinary route handlers
- Any attempt to expose provider API keys to the client
- Any attempt to restore retired `AI_INTEGRATIONS_*` configuration

---

## Related Agent Files

- [`SECURITY-SAFETY-AGENT.md`](./SECURITY-SAFETY-AGENT.md) — Child safety rules enforcement
- [`STORY-GENERATION-AGENT.md`](./STORY-GENERATION-AGENT.md) — Story prompt engineering
- [`BACKEND-API-AGENT.md`](./BACKEND-API-AGENT.md) — Route patterns, sanitization
