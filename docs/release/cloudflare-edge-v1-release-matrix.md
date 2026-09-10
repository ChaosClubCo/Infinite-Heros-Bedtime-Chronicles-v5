# Cloudflare Edge v1 Release Matrix

**Current verdict:** NOT READY  
**Frozen baseline:** `main@1de01334c2337d6aadc9afae3a19c3bcab45e781`  
**Migration branch:** `migration/cloudflare-edge-v1`  
**Architecture authority:** `docs/adr/0008-cloudflare-edge-target-architecture.md`

## Promotion rule

`READY` is allowed only when every blocking row is backed by evidence from the same immutable candidate SHA and deployed runtime identity reconciles exactly with that SHA.

Allowed intermediate states:

- `IMPLEMENTED`
- `VERIFIED`
- `DEPLOYED`
- `BLOCKED`
- `INCONCLUSIVE`
- `NOT IMPLEMENTED`
- `NOT VERIFIED`
- `READY`

A source file, configuration entry, successful deploy command, DNS response, or healthy endpoint by itself is insufficient to mark a runtime gate `READY`.

## Current matrix

| Domain | Acceptance condition | Current state | Evidence / blocker |
|---|---|---|---|
| Source baseline | exact pre-migration `main` SHA frozen | VERIFIED | `docs/release/cloudflare-edge-v1-baseline.md` |
| Branch isolation | migration branch created directly from frozen SHA | VERIFIED | `migration/cloudflare-edge-v1` |
| Architecture decision | Cloudflare target-state ADR exists and resolves Hono/R2/Postgres/Expo/AI authority boundaries | IMPLEMENTED | ADR-0008 is proposed, not yet accepted/merged |
| Existing CI baseline | lint/test/audit/typecheck/build evidence exists for frozen SHA | BLOCKED | baseline CI died during setup-node because no lockfile existed |
| Deterministic dependency graph | committed lockfile accepted by `npm ci` under the approved npm toolchain | BLOCKED | npm 11.19.1 generated a lockfile that `npm ci` immediately rejected; controlled npm 11.13.0 experiment in progress |
| Runtime-neutral HTTP contract | tests + implementation verified | NOT IMPLEMENTED | RED-first tests committed; implementation intentionally absent pending observable RED |
| Runtime-neutral AI contract | tests + implementation verified | NOT IMPLEMENTED | RED-first tests committed; implementation intentionally absent pending observable RED |
| Runtime-neutral MediaStore | tests + implementation verified | NOT IMPLEMENTED | RED-first tests committed; R2 adapter not yet implemented |
| Runtime-neutral persistence health | tests + implementation verified | NOT IMPLEMENTED | RED-first tests committed; implementation intentionally absent pending observable RED |
| Hono Worker shell | Worker entrypoint builds under Wrangler/workerd | NOT IMPLEMENTED | no production Worker code committed yet |
| `/api/health` provenance | returns bounded release identity, exact candidate SHA, no secrets | NOT IMPLEMENTED | Node health exists; edge health not yet implemented |
| Workers Static Assets | Expo web artifact served, deep route fallback works, `/api/*` remains worker-first | NOT VERIFIED | target configuration not yet committed/deployed |
| Non-AI route port | one read-only existing route matches Node contract | NOT IMPLEMENTED | `/api/metrics` selected as first route |
| CORS/security parity | canonical origin matrix + CSP/HSTS/nosniff/frame protections verified | NOT IMPLEMENTED | current Express behavior is reference; Worker middleware not yet written |
| AI semantic parity | Worker path delegates to existing `server/ai` authority with no duplicate provider router | NOT IMPLEMENTED | adapter design selected, code/tests pending |
| R2 media storage | `MediaStore` contract + disposable staging write/read/delete proof | NOT IMPLEMENTED | no R2 runtime evidence |
| PostgreSQL retention | bounded Worker connectivity/query benchmark acceptable | NOT VERIFIED | Postgres retained by ADR; Worker transport benchmark not yet executed |
| D1 migration | separate ADR + benchmark justify migration | NOT APPROVED | explicitly outside edge v1 |
| Cloudflare staging deploy | identified deployment serves exact candidate SHA | NOT VERIFIED | direct Cloudflare connector unavailable; GitHub Actions may be used if account secrets are configured |
| Staging static synthetic | `/`, hashed asset, deep SPA route pass | NOT VERIFIED | requires deployed staging runtime |
| Staging API synthetic | `/api/health`, `/api/metrics`, API 404 routing pass | NOT VERIFIED | requires deployed staging runtime |
| Exact-SHA reconciliation | GitHub SHA == deployment metadata SHA == runtime health SHA | NOT VERIFIED | requires deployed staging/production runtime |
| CI Cloudflare build | existing CI includes Worker tests + Wrangler validation | NOT IMPLEMENTED | pending deterministic dependency repair |
| Deployment receipt | deployment/version IDs + source SHA preserved | NOT VERIFIED | requires Cloudflare deployment |
| Rollback target | known-good Cloudflare version identified before prod shift | NOT VERIFIED | no certified Cloudflare production version yet |
| Rollback rehearsal | real rollback + post-rollback identity/readback pass | NOT VERIFIED | cannot be simulated as PASS |
| Production canary | bounded traffic follows `docs/runbooks/cloudflare-canary.md` | NOT VERIFIED | requires all prior gates and Cloudflare routing authority |
| Post-canary synthetic | static/API/auth/AI/media/persistence checks pass at production origin | NOT VERIFIED | requires canary/cutover |
| Production release | all blocking rows above green on same candidate | **NOT READY** | live staging, canary, exact-SHA and rollback evidence absent |

## Dependency/toolchain incident

The first release-infrastructure repair is intentionally treated as a separate inherited blocker.

### Observed

- Frozen source had no `package-lock.json`.
- Existing CI enabled npm caching in `actions/setup-node`, which requires a supported lockfile, so CI failed before any application gate ran.
- A bootstrap run under Node 22.23.2 + npm 11.19.1 generated `package-lock.json` successfully.
- The same npm immediately rejected that generated lockfile during `npm ci --dry-run` with:

```text
Missing: brace-expansion@2.1.4 from lock file
```

### Current hypothesis under test

The repository uses valid root npm overrides including version-qualified `brace-expansion` overrides. npm has known 2026 regressions where npm 11 can generate an incomplete lockfile that a subsequent `npm ci` rejects. A controlled bootstrap with npm 11.13.0 is being used to separate npm-toolchain behavior from an actual repository dependency inconsistency.

No dependency or override is to be removed merely to silence the error. The approved fix must produce a lockfile that passes `npm ci` and preserve the security intent of the override graph.

## `READY` predicate

The final release status can change from `NOT READY` to `READY` only when all of the following are true for one immutable candidate SHA:

```text
existing repository gates GREEN
AND Worker/Hono tests GREEN
AND Wrangler/workerd validation GREEN
AND staging deployed
AND staging exact-SHA readback MATCH
AND static/API routing GREEN
AND security parity GREEN
AND AI semantic parity GREEN
AND R2 MediaStore staging proof GREEN
AND PostgreSQL Worker benchmark GREEN
AND production canary GREEN
AND production exact-SHA readback MATCH
AND rollback rehearsal GREEN
AND post-rollback readback MATCH
```

Anything weaker remains `IMPLEMENTED`, `VERIFIED`, `DEPLOYED`, `BLOCKED`, or `INCONCLUSIVE` as appropriate.
