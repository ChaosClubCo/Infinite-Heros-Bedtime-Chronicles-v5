# Deploying to Vercel

## TL;DR

```bash
vercel login                    # one-time, interactive
npm run deploy:vercel           # from this directory
```

`deploy:vercel` (`scripts/deploy-vercel.sh`) wraps `vercel --prod` and
explicitly passes the release SHA as a CLI argument:

```bash
vercel --prod --env APP_RELEASE_SHA="$(git rev-parse HEAD)"
```

Do **not** try to wire the SHA through `vercel.json` — Vercel does not
interpolate shell variables there (`"$VERCEL_GIT_COMMIT_SHA"` in JSON
stays a literal string). And Vercel's auto-injected
`VERCEL_GIT_COMMIT_SHA` only exists when the project's Git connection
is healthy, so passing `APP_RELEASE_SHA` explicitly keeps
`/api/health`'s `releaseSha` (see `server/routes/health.ts`)
deterministic. The `vercel-deploy.yml` and `release-proof.yml`
workflows verify deploys against that field. A bare `vercel --prod`
still works, but `releaseSha` may then be `null` and the deploy gates
degrade to a basic health check.

The repo is already linked — `.vercel/project.json` points at the
FlashFusion team's `infinite-heros-bedtime-chronicles-v5` project, so
the CLI will skip the interactive linking prompt.

## Why CLI instead of the Git integration

The project lives on the **Vercel Hobby plan**. Hobby does not allow
collaborators on private repos, and it enforces a *commit-author check*
on every Git-triggered deploy. Any commit authored by someone other
than the project owner (Dependabot, GitHub Copilot, Claude bots, other
maintainers) hits the dashboard as **`BLOCKED`** — the deploy never
builds, no logs are produced, and the green-tick PR in GitHub is
misleading.

The CLI deploy is authenticated by the **owner's** token, so it
bypasses the commit-author check entirely. It is the supported
workaround on Hobby.

Symptom in the dashboard when this is biting:

> Deployment Blocked — The deployment was blocked because the commit
> author did not have contributing access to the project on Vercel.
> The Hobby Plan does not support collaboration for private
> repositories. Please upgrade to Pro to add team members.

## Permanent fix

Upgrade the **FlashFusion** team to **Vercel Pro** (~$20/user/mo).
That removes the commit-author check, and every push to `main` —
regardless of author — will build like any other team plan.

Until that happens, this `npm run deploy:vercel` dance is the manual
stopgap each time bots merge to `main`.

## Background — what was fixed in PR #169

Before commit `f1ec0de`, deploys were failing earlier in the pipeline:

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json
and package-lock.json are in sync.
npm error Missing: typescript@5.9.3 from lock file
```

Root cause: `package.json` pinned `typescript@~6.0.3`, which violates
Expo's `typescript@^5.0.0` peer-dep range. The fix:

- Added `legacy-peer-deps=true` to `.npmrc`
- Regenerated `package-lock.json` against that resolver mode

That's already on `main` — `npm ci` now succeeds. The only remaining
blocker is the Hobby commit-author wall described above.

## The web bundle (resolved)

`vercel.json`'s `buildCommand` now runs `npm run server:build` **and**
`npx expo export --platform web --output-dir static-build`, and the
serverless function bundles `static-build/**` via
`functions.includeFiles`. The web UI ships with every deploy — no need
to commit `static-build/`.
