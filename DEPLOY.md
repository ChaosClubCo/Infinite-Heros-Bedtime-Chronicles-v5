# Deploying to Vercel

## TL;DR

```powershell
vercel login                    # one-time, interactive
vercel --prod                   # from this directory
```

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

Until that happens, this `vercel --prod` dance is the manual stopgap
each time bots merge to `main`.

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

## Caveat — the web bundle

`vercel.json` runs `npm run server:build` only. The Expo web bundle
(`static-build/`) is **not** committed and is **not** built by that
command. The serverless function will deploy green, but the web UI
may render empty until either:

- the build command is updated to also produce `static-build/`, or
- `static-build/` is committed.

Preview deploys with the same config have been going green, so this is
flagged but non-blocking for the immediate "unbreak production" goal.
