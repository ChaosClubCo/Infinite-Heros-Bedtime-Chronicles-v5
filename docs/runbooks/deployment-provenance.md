# Runbook: Deployment Provenance

<!-- Last verified: 2026-08-29 -->

This runbook defines how to prove **which provider deployment/version is serving production and which exact source revision it contains**.

The rule is deliberately provider-neutral: a release is not accepted because a dashboard says “production,” DNS resolves, or a source branch looks correct. The deployed runtime and provider metadata must reconcile to the same immutable candidate.

Related: [deploy.md](./deploy.md), [rollback.md](./rollback.md), and [../operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md).

---

## 1. Resolve the provider deployment object

For the active hosting provider, capture:

- account/organization identity;
- project/service/Worker identity;
- deployment/version ID;
- creation/promotion timestamp;
- configured production routes/custom domains;
- provider-reported source revision when available.

For the Cloudflare migration, both canonical domains must map to the same verified release surface unless an approved architecture document says otherwise:

- `bedtime-chronicles.com`
- `www.bedtime-chronicles.com`

Do not infer domain ownership from the application health response. Domain routing is provider configuration and must be inspected as provider configuration.

---

## 2. Read runtime release identity

The application exposes platform-neutral deployment identity on `/api/health`:

```bash
curl --fail --silent --show-error \
  https://www.bedtime-chronicles.com/api/health \
  | jq '{status, releaseSha, releaseRepo, releaseRef, environment, version}'
```

The values come from explicit deployment bindings:

- `RELEASE_SHA`
- `RELEASE_REPO`
- `RELEASE_REF`
- `DEPLOYMENT_ENV`
- `RELEASE_VERSION`

Missing values are reported as `unknown`. `unknown` is a failed provenance gate, not a value to explain away.

The deployment adapter must bind identity from immutable provider/build metadata. Never derive these values from request headers.

---

## 3. Reconcile to canonical source

Canonical production identity:

```text
repository = ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5
ref        = main
sha        = exact approved candidate SHA
```

Run the verifier:

```bash
EXPECTED_RELEASE_SHA=<candidate-40-hex-sha> \
DEPLOYED_RELEASE_SHA=<health-releaseSha> \
DEPLOYED_RELEASE_REPO=<health-releaseRepo> \
DEPLOYED_RELEASE_REF=<health-releaseRef> \
node scripts/verify-release-provenance.mjs --phase release-gate
```

Required equality:

```text
deployed provider source SHA == candidate SHA
runtime releaseSha            == candidate SHA
runtime releaseRepo           == canonical repository
runtime releaseRef            == main
```

If the provider cannot expose a source SHA directly, preserve a signed/build-time mapping from provider deployment/version ID to candidate SHA and independently verify runtime `releaseSha`. Do not substitute the source branch tip for a deployment receipt.

---

## 4. Check the deployment-drift monitor

`.github/workflows/deployment-drift.yml` compares canonical `main` with production `/api/health`.

A passing drift monitor is useful evidence only when the health endpoint is reporting a real immutable deployment identity. If `releaseSha`, `releaseRepo`, or `releaseRef` is `unknown`, fix the deployment bindings rather than weakening the monitor.

---

## 5. Prove rollback provenance

Before certification, identify one previous known-good provider deployment/version and its source SHA.

A rollback receipt must include:

1. candidate deployment/version + SHA;
2. known-good rollback deployment/version + SHA;
3. provider-side rollback action;
4. post-rollback `/api/health` identity;
5. domain/HTTPS smoke after rollback;
6. optional re-promotion of the candidate plus a second identity check.

A Git revert without provider-side deployment/version evidence is not a rollback rehearsal.

---

## 6. Transitional Vercel evidence

Vercel is retired for new revisions but remains a transitional object until Cloudflare origin and rollback are proven.

During retirement:

- `vercel.json` must remain a deployment-disabled tombstone while the project is Git-linked;
- any new Vercel deployment is deployment drift;
- historical Vercel deployment metadata may be retained as incident/audit evidence;
- historical deploy-hook/native-Git attribution techniques belong in archived incident records, not in the active deployment procedure.

Do not remove production domains from the Vercel project until the replacement provider passes the admission and rollback gates.

---

## 7. Evidence quality rules

The following are **not sufficient** by themselves:

- a successful local build;
- a green source-only CI run;
- DNS resolving to an expected address;
- a provider dashboard screenshot without deployment/version identity;
- a matching branch name;
- a shortened commit SHA;
- a health response with `releaseSha=unknown`;
- source code containing the candidate SHA.

Prefer immutable IDs, full SHAs, provider receipts, timestamps, and independently fetched runtime identity.

---

## See also

- [../operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md)
- [../../DEPLOY.md](../../DEPLOY.md)
- [deploy.md](./deploy.md)
- [rollback.md](./rollback.md)
- [monitoring-alerting.md](./monitoring-alerting.md)
- [incident-response.md](./incident-response.md)
