<!-- Last verified: 2026-03-27 -->
# Contributing to Infinity Heroes: Bedtime Chronicles

Thank you for your interest in contributing! This guide covers the development workflow, code standards, and process for submitting changes.

---

## Table of Contents

- [Branch Naming](#branch-naming)
- [Branch Lifecycle](#branch-lifecycle)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing Requirements](#testing-requirements)
- [Documentation Requirements](#documentation-requirements)
- [Local Development Setup](#local-development-setup)
- [Release Process](#release-process)

---

## Branch Naming

Use the following prefixes:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New feature | `feat/voice-chat-ui` |
| `fix/` | Bug fix | `fix/story-id-mismatch` |
| `chore/` | Maintenance, refactoring | `chore/upgrade-expo-55` |
| `docs/` | Documentation only | `docs/update-api-reference` |
| `security/` | Security fix | `security/rate-limit-headers` |
| `test/` | Add/update tests | `test/story-generation-unit` |

Branch names should be lowercase kebab-case, descriptive, and under 60 characters.

**Exception:** Session branches created by Claude Code (prefix `claude/`) bypass the naming convention. These are temporary development branches and are automatically cleaned up after merge.

---

## Branch Lifecycle

Follow this workflow to keep the remote repository clean and reduce cognitive load:

### 1. Push Immediately After First Commit
- Create your branch locally and make your first commit
- Push to origin **immediately after** the first commit to signal that work is in progress
- This ensures your work is backed up and visible to teammates

```bash
git checkout -b feat/your-feature
git add .
git commit -m "feat: start implementing your feature"
git push -u origin feat/your-feature
```

### 2. Branch Protection & CI Checks
- The `main` branch is protected and requires:
  - ≥1 approval before merge
  - All CI checks must pass: `npm run typecheck`, `npm run lint`, `npm test`, and production build
- Feature branches may have any history; squash commits before merge via the GitHub UI

### 3. After Merge: Delete Local Branch
- Once your PR is merged, **delete the branch locally** to reduce clutter:
  ```bash
  git branch -d feat/your-feature  # Safe delete (requires upstream to be merged)
  ```
- GitHub can auto-delete the remote branch on merge; enable this in repository settings if desired

### 4. Stale Branch Cleanup
- Stale branch detection runs manually via GitHub Actions (`Actions` → `Branch Cleanup` → `workflow_dispatch`)
- Detects branches >90 days old with no commits; supports dry-run mode (default) or actual deletion
- Merged branches are automatically deleted after PR merge (no manual action needed)
- Session branches (claude/*) can be left alone during cleanup runs; delete manually if work is abandoned

### Why This Matters
- **Clean remote:** Reduces branch clutter and makes it easier to find active work
- **Clear intent:** Early pushes signal "I'm working on this" to the team
- **Safety:** Pushing immediately ensures your work isn't lost locally
- **Reduced cognitive load:** Fewer branches = fewer decisions about which branches are alive

---

## Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `perf`, `security`

**Scopes (optional):** `server`, `client`, `ai`, `tts`, `audio`, `db`, `storage`, `ui`, `ci`, `docs`

**Examples:**

```
feat(ai): add OpenRouter as fourth fallback provider
fix(server): prevent path traversal in TTS audio serving
docs(api): add madlibs endpoint examples
chore(deps): upgrade expo to 55.0.0
```

- Subject line: ≤72 characters, imperative mood, no trailing period
- Body: wrap at 72 characters; explain *what* and *why*, not *how*
- Footer: reference issues with `Closes #123` or `Fixes #456`

---

## Pull Request Process

1. **Fork or branch** from `main`. Never commit directly to `main`.
2. **Open a draft PR** early to signal work-in-progress.
3. **Fill out the PR description** with:
   - What changed and why
   - How to test it
   - Screenshots/recordings for UI changes
4. **Ensure all checks pass** before requesting review:
   - `npm run typecheck` — zero TypeScript errors
   - `npm run lint` — zero lint errors
5. **Request review** from at least one maintainer when ready.
6. **Squash merge** after approval. Keep commit history clean.

---

## Code Style

The project uses ESLint with the `expo` config. Run the linter before pushing:

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix what's fixable
npm run typecheck    # Check TypeScript types
```

See [CONVENTIONS.md](./CONVENTIONS.md) for detailed naming, file organization, error handling, and API design rules.

Key rules:
- TypeScript strict mode — no `any` without an explicit comment justifying it
- React Native `StyleSheet.create()` for all styles — no inline style objects except for dynamic values
- All user-facing string inputs must pass through `sanitizeString()` before use in AI prompts
- No secrets or API keys in source code; all secrets via environment variables

---

## Testing Requirements

The project uses **Vitest v4** with **1010+ passing tests** across 41 test files. See [docs/best-practices/TESTING.md](./docs/best-practices/TESTING.md) for the full testing guide.

```bash
npm test                    # Run all tests (single run)
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

**Requirements for PRs:**
- All existing tests must pass (`npm test`)
- PRs touching server logic or shared utilities must include unit tests
- Target: ≥80% branch coverage for changed files
- Zero lint errors (`npm run lint`)
- Zero TypeScript errors (`npm run typecheck`)

**Test file naming:** `<module>.test.ts` or `<module>.comprehensive.test.ts` alongside the source file.

**Mocking:** Mock all external APIs (AI providers, ElevenLabs, AsyncStorage, Firebase). See existing test files for patterns.

---

## Documentation Requirements

Update documentation alongside code changes:

| Change Type | Required Doc Update |
|-------------|-------------------|
| New API endpoint | `docs/API.md` — add method, path, request/response schema |
| New domain route module | `docs/agents/BACKEND-API-AGENT.md` — add to domain scope |
| New environment variable | `.env.example` + `README.md` env table + `docs/operations/SECRETS-ROTATION.md` if it is a secret |
| Architecture change | `docs/ARCHITECTURE.md` |
| New significant decision | `docs/adr/` — create a new ADR from `docs/adr/template.md` |
| New component or hook | Inline JSDoc comment on the export |
| New AI provider | `docs/ARCHITECTURE.md` AI routing section + `README.md` tech stack table |
| Security change | `docs/SECURITY.md` + `docs/best-practices/SECURITY.md` |
| New observability integration | `docs/operations/OBSERVABILITY.md` |
| Secrets added/rotated | `docs/operations/SECRETS-ROTATION.md` inventory + `docs/operations/EAS-SECRETS-CHECKLIST.md` |

All changes go in `docs/CHANGELOG.md` under `[Unreleased]` before each release.

---

## Local Development Setup

See [README.md](./README.md#quick-start) for the full setup guide.

**Quick reference:**

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env — add at minimum AI_INTEGRATIONS_GEMINI_API_KEY

# Start backend
npm run server:dev   # Express on http://localhost:5000

# Start frontend (in a separate terminal)
npm run expo:dev     # Expo dev server
```

**Replit development:** Use the run button or `npm run expo:dev` — it sets the correct `EXPO_PACKAGER_PROXY_URL` and `REPLIT_DEV_DOMAIN` automatically.

**Database (optional):** Required only for voice chat. Set `DATABASE_URL` and run `npm run db:push` to create tables.

---

## Release Process

### Version Numbering

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking API change or major UX redesign
- **MINOR** — new feature, backward-compatible
- **PATCH** — bug fix, security patch, documentation

### Release Steps

1. **Changelog** — move all `[Unreleased]` sections in `docs/CHANGELOG.md` under a single new version header `[x.y.z] — YYYY-MM-DD`
2. **Version bump** — update `version` in `package.json`
3. **Tag** — `git tag v<x.y.z> && git push origin v<x.y.z>`
4. **Server deploy** — follow `docs/runbooks/deploy.md` (Replit push-to-deploy or Vercel)
5. **Mobile build** — `eas build --platform android --profile production` (see `docs/operations/PLAY_STORE_DEPLOYMENT.md`)
6. **Play Store** — upload the `.aab` to the Google Play Console internal track, promote through alpha → beta → production

### Pre-release Checklist

- [ ] `npm test` — all tests pass
- [ ] `npm run typecheck` — zero TS errors
- [ ] `npm run lint` — zero lint errors
- [ ] `npm audit --audit-level=critical` — zero critical vulnerabilities
- [ ] `docs/CHANGELOG.md` updated
- [ ] `package.json` version bumped
- [ ] `.env.example` up to date with any new env vars
- [ ] EAS secrets set for all required env vars (`docs/operations/EAS-SECRETS-CHECKLIST.md`)
