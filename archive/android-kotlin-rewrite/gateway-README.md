# Secure Serverless Proxy Gateway — Implementation Plan

> Archived verbatim (prose only — no source) from `krosebrook/bedtime_chronicles-v2`'s
> `lib/gateway/README.md`. See [README.md](./README.md) in this folder for why this was
> archived: this repo's Express server already solves the same key-protection problem
> for the Expo client, so the gateway was never wired into anything active. The actual
> `index.ts`/`proxy.ts` source (and the root-level `gateway/server.js` stub) is not
> copied here — retrieve it from the `archive/android-kotlin-rewrite-2026-07-13` branch
> in `krosebrook/bedtime_chronicles-v2` if needed.

This section provides a rigorous, production-grade architecture blueprint and implementation roadmap to migrate **Infinity Heroes: Bedtime Chronicles** away from direct-client Model endpoint calling.

By separating the native Android application from the upstream Google Gemini/Imagen APIs via an intermediate **Secure Serverless Proxy Gateway**, we eliminate the risk of client-side key theft, filter prompts to children-appropriate guidelines before forwarding, and enforce rate limits.

---

## 🏗️ 1. Target Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │              Native Android App              │
                  │  (JWT Authentication & Client-side Cache)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         │ HTTPS Requests (with JWT bearer)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      Secure Serverless Proxy Gateway         │
                  │   - Express / Cloudflare Workers Run-time    │
                  │   - JWT Verification Middleware              │
                  │   - Express Rate-Limiter (Token Bucket)     │
                  │   - Content Sanitization & Safety Guard     │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         │ Authenticated Proxy Transport
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Google Generative Language API        │
                  │ (Gemini 3.5 Flash / Imagen 3.0 via API Key)  │
                  └──────────────────────────────────────────────┘
```

---

## 🔒 2. Key Architectural Tenets

### A. JWT Token Verification
*   **Trust Anchor:** The Gateway will expect an `Authorization: Bearer <JWT>` header.
*   **Verification:** Incoming JWTs are cryptographically validated against a JSON Web Key Set (JWKS) provided by our identity provider (e.g., Firebase Auth or custom Auth0/Okta tenant).
*   **Claims Inspection:** The gateway inspects claims such as expiration (`exp`), audience (`aud`), issuer (`iss`), and subject identifier (`sub`) to ensure legitimate child/parent app sessions before forwarding API tokens.

### B. Scalable Rate Limiting
*   **Strategy:** Sliding token-bucket rate limiter matching the `express-rate-limit` pattern.
*   **State Store:**
    *   *Development:* In-memory LRU client state tracking.
    *   *Production:* High-speed low-latency key-value cache (such as **Redis** or Cloudflare KV/Durable Objects) to prevent serverless container cold-starts from dropping rate-limiting tokens.
*   **DDoS and Cost Protection:** Caps API requests per user profile to a sensible daily quota (e.g., 5 generated visual bedtime scenes per night) to protect Gemini billing limits.

### C. Childhood Content Sanitization & Prompt Guard
*   **Interception Layer:** Raw prompts from the user client pass through a runtime verification engine.
*   **Policy Enforcements:**
    *   Blocks malicious jailbreaking strings or non-bedtime queries (SQL injections, arbitrary shell, prompt overrides).
    *   Injects a cozy system context (`narratorPersona` formatting + pediatric bedtime safety thresholds) to ensure age-appropriate, beautifully comforting generated bedtime stories (ages 3–9 years).

---

## 🛠️ 3. Implementation Steps

### Phase 1: Gateway Provisioning (Local & CI Stubs)
*   Deploy TypeScript boilerplate with Express + middleware on serverless nodes (Vercel, Cloud Run, or AWS Lambda).
*   Bind environment securely: `GEMINI_API_KEY` stored in cloud secrets (never embedded in source control).

### Phase 2: Native App Integration
*   Switch Retrofit client endpoints inside `com.example.data.GeminiService` and corresponding ViewModels to target `/api/v1/story/generate` and `/api/v1/images/generate` on the gateway host.
*   Inject authorization tokens generated from the parent gate profile system in the HTTP header chain dynamically.

### Phase 3: Monitoring & Telemetry
*   Configure Google Cloud Logging/Winston to alert if there are high-frequency requests from single source IPs.
*   Observe rate-limited HTTP status codes (`429 Too Many Requests`) to serve responsive, friendly error dialogs securely to children.
