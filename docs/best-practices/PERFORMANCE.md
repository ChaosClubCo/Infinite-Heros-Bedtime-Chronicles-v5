# Performance Best Practices

**Last Updated:** 2026-03-27 | **Platform:** Vercel Serverless + Expo (React Native)

---

## Quick Reference

| Rule | Impact | Priority |
|------|--------|----------|
| Set `maxDuration: 300` in vercel.json | Prevents timeout on AI fallback chains | Critical |
| Use streaming for user-facing AI | Reduces perceived latency by 80%+ | High |
| Cache TTS in persistent storage (not /tmp) | Prevents redundant ElevenLabs API calls | High |
| Individual provider timeouts (10-15s) | Prevents single provider from consuming entire budget | High |
| Split routes.ts into modules | Reduces cold start parse time | Medium |

---

## 1. Vercel Serverless Configuration

### Function Timeout

```json
// vercel.json
{
  "functions": {
    "api/index.ts": {
      "maxDuration": 300
    }
  }
}
```

**Why 300s:** The AI router has a 7-provider fallback chain (Anthropic → Gemini → OpenAI → Meta → xAI → Mistral → Cohere). If each provider times out at ~15s, the full chain needs ~105s. The previous 60s limit caused failures.

### Cold Start Optimization

- **Problem:** The entire Express app + all AI SDK imports load on every cold start
- **Mitigation:** esbuild bundles server code to `server_dist/` with `--packages=external`
- **TODO:** Split route handlers into separate files to enable tree-shaking

### Serverless Limitations

| Feature | Impact on Serverless |
|---------|---------------------|
| In-memory rate limiter | Resets on cold start — use with user-based layer |
| In-memory story cache | No cross-instance sharing — effectively useless |
| TTS cache on /tmp | Ephemeral — wiped between invocations |
| WebSocket (ws) | Not supported on Vercel serverless — use SSE instead |
| setInterval timers | Only run during request handling, not between |

---

## 2. AI Provider Performance

### Fallback Chain Timeouts

Add per-provider timeouts to prevent a hanging provider from consuming the entire function duration:

```typescript
// Best practice: wrap provider calls with AbortController
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 15000); // 15s per provider

try {
  const response = await provider.generateText(req, { signal: controller.signal });
  return response;
} finally {
  clearTimeout(timeout);
}
```

### Streaming vs Synchronous

| Endpoint | Method | Perceived Latency |
|----------|--------|-------------------|
| `/api/generate-story` | Synchronous | Full wait (10-30s) |
| `/api/generate-story-stream` | SSE streaming | First token in 1-3s |

**Always prefer streaming** for user-facing story generation. The streaming endpoint sends partial content as it arrives.

---

## 3. TTS Caching Strategy

### Current (Durable Cloudflare R2 + Local disk cache)

```
Request → MD5 hash of (voice + mode + text) 
        → Check Local Cache (/tmp/tts-cache) → Hit → Serve
        → Miss → Check Cloudflare R2 Cache (if R2_ENABLED) → Hit → Save to Local Cache → Serve
        → Miss → ElevenLabs API → Save to Local Cache → Background Upload to R2 → Serve
```

**Why R2:** On Vercel serverless, `/tmp` is ephemeral and wiped between cold starts. Cloudflare R2 provides a persistent object storage cache that survives serverless recycling, dramatically reducing ElevenLabs API costs and latency.

### Implementation

The R2 cache is handled in `server/r2.ts` and integrated into the `/api/tts` handler:

```typescript
// server/routes/tts.ts
const { fileName, filePath } = ttsCachePathFor(`${voiceKey}:${storyMode || ""}:${text}`);

cacheHit = await fileExists(filePath);
if (!cacheHit) {
  if (R2_ENABLED) {
    const r2Buffer = await r2Get(fileName);
    if (r2Buffer) {
      cacheHit = true;
      await writeWithLock(filePath, r2Buffer);
    } else {
      const audioBuffer = await generateSpeech(text, voiceKey, storyMode);
      await writeWithLock(filePath, audioBuffer);
      r2Put(fileName, audioBuffer).catch((err) => {
        req.log?.error({ err, fileName }, "Background R2 upload failed");
      });
    }
  } else {
    const audioBuffer = await generateSpeech(text, voiceKey, storyMode);
    await writeWithLock(filePath, audioBuffer);
  }
}
```

**Benefits:** Extremely fast local filesystem fallback if already downloaded on the instance, durable cloud cache across all serverless instances, and non-blocking asynchronous uploads so client requests aren't delayed.

---

## 4. Client Performance

### React Query Configuration

```typescript
// lib/query-client.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,  // Never auto-refetch
      retry: false,         // Don't retry failed requests
      refetchOnWindowFocus: false,
    },
  },
});
```

**Trade-off:** `staleTime: Infinity` means data never refreshes automatically. This is correct for story content (immutable) but means voice/config changes won't be picked up until app restart.

### AsyncStorage Read Patterns

```typescript
// DO — batch related reads
const [stories, badges, streak] = await Promise.all([
  getAllStories(),
  getBadges(profileId),
  getStreak(profileId),
]);

// DON'T — sequential reads
const stories = await getAllStories();
const badges = await getBadges(profileId);
const streak = await getStreak(profileId);
```

### Image Loading

- Use `expo-image` (already configured) — it caches images automatically
- Story scene images are data URIs stored in AsyncStorage — consider lazy loading for library views
- Avatar images: generate once, cache in story object

### Animation Performance

- `react-native-reanimated` runs on the UI thread — preferred for all animations
- Avoid `useEffect` + `setState` for animations — use shared values
- `StarField` creates stars at module load time — positions are static per session (intentional)

---

## 5. Bundle Size

### Heavy Dependencies

| Package | Size | Justification |
|---------|------|---------------|
| `@anthropic-ai/sdk` | ~50KB | AI text generation (primary) |
| `@google/genai` | ~80KB | AI text + image generation |
| `openai` | ~100KB | AI text + image + video + TTS |
| `firebase` | ~200KB | Client auth |
| `firebase-admin` | ~150KB | Server auth token verification |
| `react-native-reanimated` | ~100KB | Animation framework |

**Optimization:** AI SDKs are server-only — they're excluded from the client bundle by Metro's platform-aware bundling. Verify with `npx expo export --dump-sourcemap`.

### Server Bundle

```bash
npm run server:build  # esbuild → server_dist/index.js
```

esbuild externalizes `node_modules` (`--packages=external`), keeping the server bundle small. Only application code is bundled.

---

## 6. Rate Limiting Performance

### Dual-Layer Design

```
Request → IP Rate Limit (10/min, in-memory Map)
       → User Rate Limit (5/min, in-memory Map by Firebase UID)
       → Route Handler
```

The user-based layer is more effective on serverless because Firebase UIDs are stable across instances (unlike IPs which may vary per cold start).

### Cleanup

Both rate limit maps are cleaned every 5 minutes to prevent unbounded memory growth:

```typescript
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);
```

---

## 7. Performance Monitoring Checklist

Before deploying to production:

- [ ] `maxDuration` set to 300 in vercel.json
- [ ] Streaming endpoint used for user-facing story generation
- [ ] No synchronous file operations in request handlers (use `fs.promises`)
- [ ] AI provider calls have individual timeouts
- [ ] AsyncStorage reads are batched where possible
- [ ] No unbounded in-memory caches (Maps cleaned periodically)
- [ ] Heavy computations wrapped in `waitUntil()` for post-response processing
- [ ] Bundle size checked with `npx expo export --dump-sourcemap`
