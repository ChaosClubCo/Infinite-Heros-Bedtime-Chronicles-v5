# Cloudflare Runtime Migration Design

Date: 2026-08-28
Status: DESIGN REVIEW
Release scope: public-v1 freeze repair
Canonical mobile client: Expo / EAS
Canonical web/API hosting target: Cloudflare Workers + Workers Static Assets
Source branch: `release/public-v1-gate-repair-20260827`

## 1. Objective

Replace active Vercel deployment/runtime coupling with a single Cloudflare deployment surface while preserving the existing Expo client, Express route/auth/business logic, Supabase persistence, Firebase authentication, AI provider integrations, and public-v1 feature freeze.

This migration is infrastructure/runtime repair only. It must not introduce new user-facing features, provider integrations, data-model expansion, or unrelated refactors.

## 2. Target architecture

One Cloudflare Worker is the canonical web/API deployment identity.

- `/api/*` is handled by the existing Express application through a Cloudflare Worker adapter.
- `/manifest` and Expo manifest behavior remain explicit server routes where required.
- Static Expo web output is built into `static-build` and served through Workers Static Assets.
- `/` serves the existing landing behavior/static application contract.
- SPA/static fallback must never intercept `/api/*`.
- Local Node development remains supported through a separate Node adapter.
- Expo/EAS remains the Android delivery path.

The application is split into three responsibilities:

1. `server/app.ts`: platform-neutral Express application construction and middleware registration.
2. `server/node.ts`: local Node runtime adapter and graceful shutdown behavior.
3. `worker/index.ts`: Cloudflare Worker adapter, environment binding bridge, static asset routing, and Worker request handling.

## 3. Vercel removal boundary

The active release tree must remove Vercel as a deployment/runtime dependency.

Delete or supersede active artifacts including:

- `vercel.json`
- `.vercelignore`
- Vercel-only API adapter files such as `api/server.mjs` when confirmed single-purpose
- `scripts/vercel-build.sh`
- `scripts/deploy-vercel.sh`
- `scripts/verify-vercel-runtime-assets.mjs`
- Vercel-only deployment hooks/workflows
- active deployment documentation that names Vercel as the canonical runtime

Remove runtime assumptions including:

- `process.env.VERCEL`
- `process.env.VERCEL_URL`
- `*.vercel.app` CORS preview allowances
- Vercel-specific proxy/runtime comments and branching
- `deploy:vercel` package scripts

Historical files under `docs/archive/` may remain as immutable history but must be explicitly superseded by this design and must not be interpreted as active deployment instructions.

## 4. Cloudflare runtime configuration

Add a Wrangler configuration using Workers Static Assets and Node.js compatibility appropriate for the release date.

Required properties:

- Worker entry: `worker/index.ts`
- Static assets directory: `./static-build`
- Explicit compatibility date
- `nodejs_compat` only where required by the selected compatibility date/runtime behavior
- Production route/custom-domain configuration separated from secrets
- No plaintext production credentials in repository files

Cloudflare secrets and variables are treated as runtime bindings. The Worker adapter is responsible for presenting only the environment surface required by existing modules.

## 5. Environment binding strategy

Existing code assumes Node-style `process.env`. The migration must not scatter Cloudflare-specific environment access throughout application code.

The Worker adapter will provide a bounded environment bridge before application construction. Production secrets remain Cloudflare bindings and are never committed.

Every existing environment variable is classified as one of:

- required production secret
- optional provider secret
- non-secret runtime configuration
- local-development-only variable
- obsolete Vercel/Replit variable to remove

Startup validation must fail closed for genuinely required production configuration and retain explicit degraded-mode behavior only where the existing product contract already permits it.

## 6. Filesystem strategy

The current server reads `app.json`, landing templates, and Expo output through Node filesystem APIs. Cloudflare Worker deployment must not depend on mutable local disk.

Migration rules:

- Immutable bundled metadata may be imported or bundled at build time.
- Static user-facing files are served from Workers Static Assets.
- Landing/template content may be bundled as source text or resolved from the static asset binding.
- Runtime writes to local filesystem are prohibited.
- `/bundle` or virtual filesystem semantics must never be used as durable storage.

Local Node development may continue to use filesystem reads behind the Node adapter where appropriate, but production behavior must be deterministic under workerd.

## 7. Static routing rules

Routing precedence is explicit:

1. `/api/*` -> Express Worker handler
2. `/manifest` -> existing Expo manifest logic where header-based manifest behavior is required
3. explicitly server-owned routes -> Worker/Express
4. static asset lookup -> Workers Static Assets
5. SPA/document fallback -> static application entry only for non-API GET/HEAD requests
6. unmatched API requests -> API 404 JSON, never HTML

POST/PUT/PATCH/DELETE requests must never be routed to static fallback.

## 8. Request body and raw-body contract

The existing Express JSON parser stores raw request bytes for consumers that need them. The Worker adapter must preserve this contract.

Required behavior:

- request body consumed at most once
- JSON body limit remains enforced
- raw body representation remains byte-accurate for webhook/signature consumers
- malformed JSON produces controlled 4xx behavior
- oversized body produces controlled 413 behavior
- content-type handling remains deterministic

Tests must include JSON, empty body, malformed JSON, body-at-limit, body-over-limit, and a raw-body/signature fixture.

## 9. Firebase authentication

Firebase service-account configuration is a production-sensitive compatibility gate.

Required behavior:

- service-account material is supplied only through Cloudflare secrets/bindings
- escaped newlines/private-key formatting is normalized deterministically
- malformed JSON/key data fails clearly without leaking credential content
- authentication must not silently fall into development-disabled mode in production
- account isolation/auth middleware behavior remains unchanged

A production-mode test must prove missing or malformed required Firebase configuration does not create an unauthenticated bypass.

## 10. Supabase/Postgres connectivity

The migration does not replace Supabase/Postgres with Cloudflare D1.

Required checks:

- connection establishment from the Worker runtime
- DNS/TLS compatibility
- connection pooling/driver behavior suitable for Workers
- no reliance on long-lived process-local connection state
- bounded timeout and retry behavior
- clean failure response when persistence is unavailable
- account isolation tests remain valid

If the existing direct Postgres driver is incompatible with Workers, the smallest compatible transport change is allowed as infrastructure repair, with data model and semantics unchanged.

## 11. AI provider SDK compatibility

Existing provider SDKs must be validated individually under workerd/Workers Node compatibility.

Providers in scope include currently configured OpenAI, Google Gemini, Anthropic, OpenRouter, ElevenLabs, and any provider already present in the frozen source.

For each provider:

- module imports/bundle succeed
- fetch/TLS path works
- streaming behavior is validated where used
- AbortSignal/timeouts work
- no unsupported Node primitive is required at runtime
- error sanitization remains intact

No new AI provider may be introduced as part of this migration.

## 12. Logging and Sentry

Pino/Sentry must be treated as compatibility gates rather than assumed portable.

Required behavior:

- structured logs emit without filesystem transports
- no worker-global mutable logger state leaks across requests
- request IDs are preserved
- sensitive headers/secrets are not logged
- Sentry initializes only when configured
- Sentry failure cannot crash request handling
- stack/error reporting remains sanitized for clients

Production must not require Node process signal handlers; graceful shutdown remains a local Node concern only.

## 13. CORS

Production allowlist is explicit and minimal.

Required production origins:

- `https://bedtime-chronicles.com`
- `https://www.bedtime-chronicles.com`

Local development origins remain explicitly port-scoped.

Vercel preview-domain regexes are removed. Cloudflare preview/dev origins, if required, must be explicit configuration and must not become a broad `*.workers.dev` production wildcard.

Tests must cover allowed production origin, allowed local origin, denied arbitrary origin, denied lookalike domain, preflight behavior, credentials header behavior, and originless server-to-server requests.

## 14. Client IP and proxy handling

Vercel-specific `trust proxy` assumptions are removed.

Cloudflare request identity rules:

- prefer trusted Cloudflare-provided client IP metadata/header only inside the Worker boundary
- do not trust arbitrary public `x-forwarded-for` values
- pass a normalized client identity into Express/rate-limiting logic
- preserve request ID behavior
- tests prove spoofed forwarding headers cannot replace trusted Cloudflare client identity

## 15. Health and release provenance

The deployed Worker must expose runtime identity sufficient to bind the deployment to the candidate SHA.

Required immutable identity fields include:

- source commit SHA
- build/release identifier
- environment
- application version
- deployment timestamp or build timestamp where deterministic provenance permits it

A health/provenance endpoint must distinguish liveness from release identity and must not expose secrets.

Release certification requires exact equality:

`deployed source SHA == candidate SHA`

and the runtime-reported source SHA must equal the same candidate SHA.

## 16. Bundle size and runtime limits

The Worker build is a release gate.

Checks must include:

- Wrangler build/bundle success
- compressed/uncompressed bundle measurements captured in evidence
- static assets kept outside Worker script where appropriate
- no oversized embedded Expo asset payload
- startup/import evaluation succeeds under workerd
- CPU/memory/subrequest/runtime assumptions documented against the selected Cloudflare plan/runtime
- provider SDKs do not push the Worker past applicable limits

A limit violation is BLOCKED, not waived by successful local Node execution.

## 17. Rollback model

Rollback must use a previously verified Cloudflare deployment/version, not a source-only guess.

Before production promotion:

1. identify the candidate Cloudflare deployment/version and candidate SHA
2. identify one prior known-good Cloudflare deployment/version and its SHA
3. perform controlled promotion to candidate
4. execute production smoke/provenance checks
5. rehearse rollback to prior known-good version
6. verify health and runtime SHA after rollback
7. restore candidate only if policy permits and verify identity again
8. preserve version IDs, SHAs, timestamps, commands/actions, and verification results in the release receipt

Until there is a prior known-good Cloudflare production version, the first Cloudflare deployment cannot claim BR-12 rollback PASS. The migration may be VERIFIED/DEPLOYED but remains not CERTIFIED until a real rollback target and rehearsal exist.

## 18. Mandatory compatibility matrix

All fifteen gates below require fresh evidence on the exact candidate SHA.

| ID | Gate | Required evidence | Failure condition |
|---|---|---|---|
| CF-01 | Express startup under workerd | local Wrangler/workerd startup + request smoke | import/start/runtime exception |
| CF-02 | `process.env` assumptions | environment inventory + production-mode tests | missing/implicit Node env dependency or secret leakage |
| CF-03 | filesystem `/bundle` semantics | Worker tests for metadata/template/static paths | mutable/durable FS dependency or path failure |
| CF-04 | static Expo asset routing | build + asset HTTP tests | missing assets, wrong MIME/cache behavior, routing failure |
| CF-05 | API vs SPA routing | API 404/non-GET routing tests | API request receives SPA HTML/static fallback |
| CF-06 | POST/raw body | body limit/malformed/signature fixtures | body consumed twice, corruption, wrong status handling |
| CF-07 | Firebase parsing/auth | production-mode auth config tests | malformed secret leak or auth-disabled production bypass |
| CF-08 | Supabase/Postgres | Worker connectivity integration test | incompatible driver/TLS/pooling or unbounded failure |
| CF-09 | AI SDKs | provider import/smoke tests with harmless probes/mocks as appropriate | unsupported runtime primitive/import/network contract |
| CF-10 | Sentry/Pino | Worker logging/error tests | crash, secret leak, unsupported transport/global state issue |
| CF-11 | CORS | allow/deny/preflight matrix | wildcard/broad origin or denied canonical origin |
| CF-12 | client IP/proxy | spoofing/trusted-header tests | attacker-controlled forwarding header becomes trusted identity |
| CF-13 | health/provenance | deployed endpoint receipt | runtime SHA absent or differs from candidate |
| CF-14 | bundle/runtime limits | Wrangler metrics + runtime smoke | limit breach or unsupported runtime behavior |
| CF-15 | rollback | real Cloudflare version rollback rehearsal | no known-good target or post-rollback identity/health mismatch |

No gate may be marked PASS from code inspection alone when its contract requires workerd, network, deployed runtime, or rollback evidence.

## 19. CI and release evidence

The Cloudflare migration must integrate with the existing exact-head release model.

Static gates continue to require:

- `npm ci`
- lint with zero warnings
- Vitest
- Jest
- `npm audit --omit=dev`
- TypeScript typecheck
- server/Worker build
- Expo dependency check
- Expo web export
- security checks
- markdown/link integrity

Cloudflare-specific gates add:

- Wrangler configuration validation
- Worker build
- workerd smoke suite
- static routing suite
- compatibility matrix CF-01..CF-14
- deployment/provenance receipt
- CF-15 rollback rehearsal before certification

Evidence must be bound to the exact candidate SHA and Cloudflare deployment/version IDs.

## 20. Release maturity rules

The migration does not reset the existing maturity vocabulary.

- IMPLEMENTED: Cloudflare source/config exists.
- VERIFIED: deterministic static + Worker/workerd checks pass on the exact SHA.
- DEPLOYED: an identified Cloudflare runtime serves that SHA.
- CERTIFIED: all required release, device, security, provenance, and rollback gates pass.
- BLOCKED: a named dependency prevents progress.
- INCONCLUSIVE: a validation attempt cannot produce a meaningful verdict.

Cloudflare migration completion does not waive physical Android gates BR-07 through BR-11.

The public-v1 promotion predicate remains:

```
STATIC_AUTOMATION = PASS
SECURITY_PRIVACY = PASS
CRITICAL_JOURNEYS = PASS
DEPLOYMENT_PROVENANCE = PASS
ROLLBACK = PASS
P0_OPEN = 0
P1_OPEN = 0
```

## 21. Non-goals

This migration must not:

- rewrite Express to Hono solely for platform preference
- move Supabase/Postgres to D1
- move object storage to R2 unless a proven runtime incompatibility makes it unavoidable
- replace Firebase Auth with Cloudflare Access
- replace Expo/EAS
- add new AI providers
- alter user-facing product behavior
- weaken release gates to make the migration pass

## 22. Design acceptance criteria

The design is ready for implementation planning only when:

1. the fifteen CF gates are accepted as mandatory
2. Vercel removal boundary is accepted
3. one Worker + Workers Static Assets is accepted as the canonical hosting topology
4. Express preservation is accepted unless implementation evidence proves incompatibility
5. exact-SHA provenance and real rollback rehearsal remain mandatory
6. physical Android release gates remain mandatory and separate

Implementation must stop and re-enter design review if a discovered Cloudflare incompatibility requires a user-facing behavior change, persistence migration, auth-model change, or provider replacement.
