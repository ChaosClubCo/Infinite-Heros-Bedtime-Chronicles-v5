# Runbook: Deployment Provenance

This runbook covers how to determine **what triggered a given Vercel deployment**, and how to find
every mechanism capable of deploying this repo.

**Last Updated:** 2026-08-13

---

## Overview

This repo has historically had more than one thing able to deploy production at the same time. When
that happens, "why did production change?" becomes unanswerable from the Vercel dashboard alone,
because every trigger produces a deployment that *looks* identical.

The techniques below exist because an August 2026 investigation into a webhook 403 took weeks and
repeatedly reached wrong conclusions. Every wrong turn came from an artifact that looked
authoritative and wasn't. Read this before trusting any single signal.

Related: [deploy.md](./deploy.md), [rollback.md](./rollback.md),
[../operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md).

---

## Step 1: Identify What Triggered a Deployment

Vercel records the trigger in each deployment's `meta`. The two fields are mutually exclusive and
this is the single most useful discriminator available:

| Field present in `meta` | Trigger |
|---|---|
| `deployHookId`, `deployHookName`, `deployHookRef` | A **deploy hook** was POSTed (by CI, a webhook, or a human with the URL) |
| `repoPushedAt` (and no `deployHookId`) | **Vercel's native Git integration** reacted to a push |

```bash
# Via the Vercel MCP tools or REST API — inspect meta on recent deployments
# list_deployments(projectId, teamId) → deployments[].meta
```

**If both patterns appear on the same project, you have duplicate triggers.** That is a defect, not
a configuration choice: the same commit will build twice, and cancelled/superseded builds will
appear for no obvious reason.

---

## Step 2: Attribute a Deploy-Hook Fire to Its Caller

A deploy hook records *that* it fired, never *who* fired it. Attribute by timing instead:

1. Note the hook-fired deployment's `created` timestamp.
2. Find the push-triggered deployment (the one carrying `repoPushedAt`) immediately before it.
3. Compute the gap.

Interpretation:

- **~1–3 seconds** — a GitHub **webhook** POSTing the hook directly. Nothing else is that fast.
- **~20–40 seconds or more** — a **GitHub Actions** workflow. A hosted runner must be provisioned
  and check out the repo before it can `curl`, which cannot happen in under ~10s.

> **Decisive check:** if a hook fire follows a push to a **non-`main`** branch, it cannot be
> `vercel-deploy.yml` — that workflow only triggers on push to `main`. It is a webhook subscribed to
> all branches firing a `main`-pinned hook, which silently promotes `main` to production on every
> feature-branch push.

If one push produces **more than one** hook fire, there is more than one caller. Enumerate them in
Step 3.

---

## Step 3: Enumerate Every Possible Sender

A repo webhook list is not sufficient. All three of these must be checked:

```
Settings → Webhooks                                  (repo-level; up to 20)
https://github.com/organizations/ChaosClubCo/settings/hooks   (org-level)
Settings → GitHub Apps / Installations               (App webhooks)
```

**Org-level webhooks fire for every repo in the org and never appear in repo settings. GitHub App
webhooks live in the App's own configuration and are invisible from both.** This repo has heavy App
activity (Copilot, Dependabot, Claude), so App-originated traffic is plausible by default.

---

## Step 4: Confirm What Production Is Actually Running

`/api/health` is the authoritative statement of what is deployed — it is generated from
`server/release-identity.ts` at build time, so it cannot drift from the artifact:

```bash
curl -s https://www.bedtime-chronicles.com/api/health | jq '{releaseSha, releaseRepo, releaseRef}'

# Compare against canonical main
git rev-parse origin/main
```

The `Deployment Drift Monitor` workflow (`.github/workflows/deployment-drift.yml`) runs this
comparison automatically every 15 minutes. If you are investigating by hand, check that workflow's
recent runs first — it may have already caught and dated the divergence.

---

## Known Traps

Each of these produced a wrong conclusion during the August 2026 investigation.

**`get_project.domains` omits custom domains.** It returns only auto-generated `*.vercel.app`
aliases. `www.bedtime-chronicles.com` does not appear on the project that serves it. Never conclude
"this project has no custom domain" from that field — check **Settings → Domains** in the dashboard.
`get_deployment.alias` has the same blind spot.

**A matching `releaseSha` does not identify which project serves a domain.** When two projects are
connected to one repo, both build the same commit, so both report the same `releaseSha`. Use
Settings → Domains, not the health endpoint, to establish domain ownership.

**A sub-20-second `Vercel Deploy Hook` run deployed nothing.** A healthy run takes minutes — its
final step polls `/api/health` for up to 900s waiting for an exact SHA match. A 10–14s run failed at
`test -n "$VERCEL_DEPLOY_HOOK_URL"` or at the `curl`, before anything was triggered. Treat a fast
failure as "no deployment occurred", not as a flake.

**GitHub webhook delivery GUIDs are UUIDv1 and carry a timestamp.** A delivery ID quoted in a code
comment or an old ticket can be dated exactly, which is often the fastest way to prove an incident
is stale. Reassemble the time fields (`time_low`, `time_mid`, `time_hi`) into a 60-bit count of
100 ns intervals since 1582-10-15:

```bash
# 17c1c010-7b5b-11f1-919c-3358006d3edc  →  2026-07-09T05:57:39.601Z
python3 -c "
import uuid, datetime
u = uuid.UUID('17c1c010-7b5b-11f1-919c-3358006d3edc')
assert u.version == 1
print(datetime.datetime(1582,10,15,tzinfo=datetime.timezone.utc)
      + datetime.timedelta(microseconds=u.time//10))
"
```

Sanity-check any decoder against GitHub's own published example GUID
`72d3162e-cc78-11e3-81ab-4c9367dc0958`, which should decode to April 2014.

**GitHub retains only ~3 days of webhook deliveries.** A delivery ID older than that cannot have
been read live; it came from a code comment or a document. Do not assume a quoted delivery and a
currently-configured payload URL describe the same moment in time.

**Vercel Deployment Protection does not apply to `api.vercel.com`.** `ssoProtection` governs
deployment URLs only. A deploy-hook call is not a deployment URL, so protection settings can never
explain a failure to trigger one. Deploy hooks return `201` on success, `404` for a bad hook, and
`429` at the 60/hour cap — never `202`.

---

## See Also

- [../operations/DEPLOYMENT.md](../operations/DEPLOYMENT.md) — deployment targets and procedure
- [../../DEPLOY.md](../../DEPLOY.md) — production policy and release-approval gates
- [monitoring-alerting.md](./monitoring-alerting.md) — alert routing
- [incident-response.md](./incident-response.md) — general incident procedure
