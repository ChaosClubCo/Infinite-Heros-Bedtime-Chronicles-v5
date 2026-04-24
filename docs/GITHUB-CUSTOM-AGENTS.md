<!-- Last verified: 2026-04-15 -->
# GitHub Repository Custom Agents

This repository includes GitHub custom agents that are scoped to Infinity Heroes and optimized for common contributor workflows.

---

## Agent Catalog

| Agent File | Primary Scope | Use For |
|---|---|---|
| `.github/agents/api-backend.md` | Express routes, middleware, API contracts | Endpoint work, validation, server-side integrations |
| `.github/agents/safety-reviewer.md` | Child safety and security constraints | Prompt safety checks, sanitization, policy compliance |
| `.github/agents/story-engineer.md` | Story mode logic and content quality | Story schema, prompts, mode behavior |
| `.github/agents/ui-designer.md` | Expo/React Native UX and visuals | Screen polish, interaction quality, visual consistency |
| `.github/agents/test-writer.md` | Test strategy and implementation | Vitest coverage, regression prevention |
| `.github/agents/devops.md` | Build, CI/CD, and release workflows | Workflow updates, deploy reliability |

---

## Repository-Scoped Best Practices

1. Keep each agent domain-focused and avoid overlapping ownership.
2. Include child-safety constraints in any story or prompt-related workflow.
3. Require input sanitization and rate limiting checks on backend changes.
4. Route all AI generation through the central AI router abstractions.
5. Treat testing as part of implementation, not a follow-up step.
6. Use documentation updates as part of completion criteria for agent-driven changes.

---

## Routing Guidance

- **Frontend feature or screen update:** `ui-designer` + `test-writer`
- **New or updated API endpoint:** `api-backend` + `safety-reviewer` + `test-writer`
- **Story generation behavior changes:** `story-engineer` + `safety-reviewer`
- **CI or deployment change:** `devops` + `test-writer`
- **Any high-risk or policy-sensitive change:** always include `safety-reviewer`

---

## Agent Completion Checklist

- Scope stayed within agent domain responsibilities.
- Security and child-safety constraints were preserved.
- Existing tests passed, and coverage was updated if behavior changed.
- Relevant docs were updated (`docs/API.md`, `docs/ARCHITECTURE.md`, or this guide).
- Output was prepared for human review in a pull request.

