# Runbook: Deploy

<!-- Last verified: 2026-08-29 -->

This runbook covers the active release surfaces for Infinity Heroes: Bedtime Chronicles.

- Web/API target: Cloudflare Workers + Workers Static Assets.
- Mobile delivery: Expo / EAS.
- Vercel deployment: retired for new revisions and fail-closed at the Git integration.
- Cloudflare production certification: **BLOCKED** until the exact service, routes, deployment/version, runtime SHA, and rollback version are independently verified.

For the runtime migration contract and release gates, see [the Cloudflare Runtime Migration Design](../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md).

---

## Prerequisites

- Changes merged through the repository's protected release process.
- All CI, security, exact-head, and release checks required for the candidate are passing.
- Required environment variables and secrets are configured only on the active target platform.
- The deployed runtime identity can be reconciled to the exact candidate SHA before promotion is claimed.

---

## Web/API deployment

### Cloudflare admission

Do not promote a Cloudflare deployment until all of the following are captured for the same candidate:

1. Cloudflare account identity.
2. Worker/Pages service or project identity.
3. Production route for `bedtime-chronicles.com`.
4. Production route for `www.bedtime-chronicles.com`.
5. Exact deployment/version ID.
6. Runtime source SHA equal to the candidate SHA.
7. Runtime canonical repository and `main` ref.
8. One previously verified rollback version and SHA.

The canonical branch currently does not contain the Worker entry and Wrangler configuration described by the August 28 design. Treat the hosting migration as unverified until that implementation and provider-side evidence are reconciled.

### Vercel retirement guard

`vercel.json` is retained only as a fail-closed tombstone with `git.deploymentEnabled=false` while the Vercel project remains linked. The former deploy-hook workflow and Vercel runtime/build adapters are retired.

Any new Vercel deployment for this repository is deployment drift and blocks release promotion.

Do not detach the two production domains or delete the Vercel project until Cloudflare admission and rollback evidence exist.

---

## Mobile client: EAS Build

Native mobile binaries are built via EAS:

- **Preview:** `bash scripts/build-android.sh preview`
- **Production:** `bash scripts/build-android.sh production`
- See [docs/operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) and [docs/operations/GOOGLE-PLAY-STORE-REQUIREMENTS.md](../operations/GOOGLE-PLAY-STORE-REQUIREMENTS.md) for signing and submission procedures.

---

## Local production-mode smoke

These commands validate the Node application locally. They are not a Cloudflare deployment proof.

```bash
npm ci
npm run server:build
npm run server:prod
```

Do not substitute local success for Worker/workerd compatibility, deployed provenance, custom-domain routing, or rollback evidence.

---

## Post-deploy verification

Against a provider deployment already admitted by the Cloudflare gate:

```bash
BASE_URL=https://bedtime-chronicles.com

curl --fail --silent --show-error "$BASE_URL/api/health"
curl --fail --silent --show-error "$BASE_URL/api/ai-providers"
curl --fail --silent --show-error "$BASE_URL/api/voices"
curl --fail --silent --show-error "$BASE_URL/privacy"
```

The release-proof contract requires exact runtime identity. An `ok` health response without the candidate SHA is not enough.

If any required check fails, follow the [rollback runbook](./rollback.md). Roll back using an identified provider version, not a source-only guess.

---

## See also

- [Cloudflare Runtime Migration Design](../superpowers/specs/2026-08-28-cloudflare-runtime-migration-design.md)
- [Deployment Manual](../operations/DEPLOYMENT.md)
- [rollback.md](./rollback.md)
- [incident-response.md](./incident-response.md)
