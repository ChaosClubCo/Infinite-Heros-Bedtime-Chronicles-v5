# ADR-0008 — Cloudflare Edge Target Architecture

**Status:** proposed  
**Date:** 2026-08-31  
**Deciders:** repository maintainers / release owner

---

## Context

The project has accumulated multiple hosting-era assumptions across Vercel, Replit, Node/Express, Expo web output, and emerging Cloudflare infrastructure. A prior production-release report described Cloudflare Workers, Workers Static Assets, R2, D1, AI Gateway, and Hono as if those components were already implemented and release-ready.

Repository evidence does not support that release-state claim.

At the frozen migration baseline `main@1de01334c2337d6aadc9afae3a19c3bcab45e781`:

- the native client is Expo / React Native and remains coupled to EAS for native distribution;
- the web/API server is still an Express 5 / Node runtime built from `server/index.ts`;
- PostgreSQL remains the structured-data authority through Drizzle and `pg.Pool`;
- Supabase remains the auth/sync boundary;
- multi-provider AI semantics are already centralized under `server/ai/`;
- no certified Hono Worker, Wrangler runtime configuration, R2 `MediaStore`, Cloudflare canary, exact-SHA deployment readback, or Cloudflare rollback receipt exists on the frozen source;
- the frozen source is not itself a green release candidate because GitHub Actions fails before test execution due to a missing dependency lockfile.

The August 28 Cloudflare migration design correctly classified Workers + Static Assets as a target and required exact-SHA provenance. However, two of its non-goals conflict with the newer August 31 execution directive: the newer directive explicitly requires a Hono edge layer and generated-media migration to R2 behind a storage abstraction.

ADR-0005 chose Express as the API backend for a Node/Replit production topology. ADR-0007 proposed a Vercel hook-only production deployment. Those decisions are historical context, but they no longer fully describe the desired production hosting boundary.

---

## Decision

Adopt a **staged Cloudflare edge target architecture** with the following authority boundaries.

### 1. Hono is the Cloudflare edge adapter, not a business-logic rewrite

Cloudflare Workers will use a Hono application as the edge-facing routing and middleware layer.

Hono owns Cloudflare-specific concerns including:

- Worker request routing;
- `/api/*` precedence over static fallback;
- health/release provenance;
- CORS parity;
- edge security headers;
- Worker-native bindings;
- R2 media access;
- staged deployment and runtime identity.

Existing domain logic is not duplicated merely to move frameworks. During migration, Express remains a supported local/transitional adapter until each route is proven portable. Shared behavior must move behind runtime-neutral contracts rather than forking into unrelated Express and Hono implementations.

### 2. Expo / EAS remains the native delivery authority

Cloudflare replaces the web/API hosting surface only.

- Expo Router and React Native remain the application client architecture.
- EAS remains the Android/iOS build and native distribution path.
- Workers Static Assets serves the production web export.
- The migration must not collapse native delivery into a web-only architecture.

### 3. PostgreSQL / Supabase remains authoritative in v1

No D1 migration is approved by this ADR.

PostgreSQL remains the structured-data authority during Cloudflare edge v1. The Worker migration must first benchmark and prove an acceptable Worker-to-Postgres transport path, including bounded connection/query timeout behavior and sanitized failure handling.

D1 may be evaluated later only through a separate evidence-backed ADR. A D1 migration may not be inferred merely from the adoption of other Cloudflare products.

### 4. Existing `server/ai` semantics remain authoritative

The multi-provider AI router, provider ordering, task-type support, circuit-breaker semantics, status reporting, prompt/safety behavior, and provider-specific logic remain centralized in the existing AI subsystem.

The Worker layer may introduce a runtime-neutral adapter that delegates to the existing AI authority, but it must not create a second independent semantic provider router.

Cloudflare AI Gateway may be introduced as a transport/telemetry layer only after its behavior is proven not to conflict with application-level provider selection and failover.

### 5. Generated media moves behind `MediaStore`; R2 is the Cloudflare implementation

Generated media must no longer depend on provider-specific storage calls scattered through route handlers.

Introduce a runtime-neutral `MediaStore` contract with bounded operations such as:

- `put`
- `get`
- `delete`

Cloudflare production/staging implements this contract using R2. Existing S3-compatible or local development implementations may remain as adapters during migration.

The migration must preserve object identity, content type, cache metadata, not-found behavior, and idempotent deletion semantics.

### 6. Workers Static Assets is the canonical production web surface

The target production topology is:

```text
Expo native clients ───────────────┐
                                  │
Web browser -> Workers Static Assets
                  │               │
                  └── /api/* -> Hono Worker
                                  │
                     ┌────────────┼────────────┐
                     │            │            │
                 existing AI   Postgres      R2 MediaStore
                  semantics    /Supabase
```

Routing order is mandatory:

1. `/api/*` -> Worker/Hono;
2. explicitly server-owned routes -> Worker/Hono;
3. static asset lookup;
4. SPA fallback for eligible non-API `GET`/`HEAD` requests only;
5. unmatched API requests -> API-native 404, never SPA HTML.

### 7. Exact-SHA provenance is a release requirement

Every Cloudflare deployment must expose bounded release identity through a health/provenance endpoint containing at least:

- source commit SHA;
- environment;
- application version;
- build/release identifier.

Production promotion requires exact equality among:

- the candidate GitHub SHA;
- deployment metadata;
- runtime health/provenance SHA.

DNS resolution or a successful HTTP response alone is not deployment provenance.

### 8. Release maturity remains evidence-based

The Cloudflare migration uses these states:

- `IMPLEMENTED`: source/configuration exists;
- `VERIFIED`: deterministic local/CI/workerd gates pass on the exact SHA;
- `DEPLOYED`: an identified Cloudflare runtime serves the exact SHA;
- `READY`: required staging, security, persistence, AI, media, canary, exact-SHA readback, and rollback evidence all pass;
- `BLOCKED`: a named external or technical dependency prevents completion;
- `INCONCLUSIVE`: an attempted check cannot produce a trustworthy verdict.

No document may mark Cloudflare production `READY` because configuration files exist or because a deployment command returned success.

---

## Supersession

If accepted, this ADR:

- **supersedes ADR-0007** as the active production web/API hosting decision;
- **partially supersedes ADR-0005** only where ADR-0005 assumes Express/Node is the canonical production hosting runtime. Express remains valid as a local/transitional API adapter and historical architectural decision;
- **supersedes the conflicting non-goals** in `docs/superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md` that prohibited a Hono edge layer and R2 media migration. All compatible exact-SHA, security, compatibility, Postgres-retention, Expo/EAS, and rollback requirements from that design remain in force;
- **corrects the production-release report framing**: Cloudflare is a migration target until runtime evidence proves deployment maturity.

---

## Consequences

### Positive

- Cloudflare-specific code is confined to a narrow edge/runtime boundary.
- Existing AI routing and child-safety semantics are preserved rather than reimplemented.
- PostgreSQL migration risk is decoupled from hosting migration risk.
- Generated media gains a portable storage boundary before R2 becomes authoritative.
- Expo native delivery survives the web/API migration unchanged.
- Exact-SHA runtime provenance becomes part of the architecture rather than a release-process afterthought.

### Negative

- The migration temporarily supports more than one HTTP runtime adapter.
- Some Express middleware must be translated and parity-tested in Hono.
- Direct Postgres drivers or provider SDKs may expose Worker compatibility problems that require narrow adapter changes.
- R2 introduces a second storage implementation during transition.
- Production certification cannot complete until a real Cloudflare account/runtime and rollback target are available.

### Neutral

- Vercel/Replit historical artifacts may remain temporarily where needed for rollback or development, but they are not evidence that those hosts remain canonical production targets.
- Cloudflare AI Gateway is optional in the initial cut and does not replace the application AI router.
- D1 remains a future architectural option, not part of edge v1.

---

## Required acceptance evidence

Before this ADR can be treated as implemented in production, the release train must produce evidence for:

1. deterministic dependency installation;
2. lint, unit, component, security, typecheck, server, and Expo web gates on the exact candidate SHA;
3. Worker/Hono unit and workerd/Wrangler build gates;
4. canonical CORS/security-header parity;
5. one non-AI route successfully served at the edge;
6. AI adapter delegation without duplicate provider semantics;
7. R2 `MediaStore` contract tests and staging runtime proof;
8. bounded Postgres Worker connectivity benchmark;
9. staging static + API routing proof;
10. exact-SHA deployment readback;
11. production canary within documented abort thresholds; and
12. real rollback to a known-good Cloudflare version followed by identity/health readback.

Until all required production-runtime evidence exists, release documentation must remain below `READY`.

---

## Alternatives considered

| Option | Decision |
|---|---|
| Rewrite the entire backend from Express to Hono immediately | Rejected. It combines hosting migration with unnecessary domain-logic rewrite risk. |
| Keep Express as the only Worker-facing framework through an adapter | Rejected for edge v1 by the newer execution directive; Hono is required as the edge router. |
| Move PostgreSQL to D1 in the same migration | Rejected. Persistence semantics and hosting runtime are independent risk domains. |
| Keep generated media on scattered S3/provider-specific calls | Rejected. Introduce `MediaStore` first and use R2 for Cloudflare runtime. |
| Replace `server/ai` with Cloudflare AI Gateway routing | Rejected. Gateway transport capabilities do not supersede application semantic routing. |
| Replace Expo/EAS with a web-only client | Rejected. Native delivery is an explicit preserved requirement. |
| Mark the architecture production-ready from configuration review alone | Rejected. Runtime readback and rollback evidence are mandatory. |
