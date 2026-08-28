# MCP + Repository Agent Suite

Status: proposed repository configuration for Infinite Heroes Bedtime Chronicles.

This suite intentionally favors a small number of high-signal MCP servers. GitHub warns that Copilot can invoke configured MCP tools autonomously, so broad write-capable integrations are a liability, not a collectible card game.

## Recommended MCPs (7)

| MCP | Use | Default stance |
| --- | --- | --- |
| GitHub MCP | Repository, PR, issue, workflow and code context | **Enable**. Built into Copilot cloud agent; keep default repo-scoped read-only token. |
| Playwright MCP | Localhost web UI verification and regression checks | **Enable**. Built into Copilot cloud agent and localhost-scoped. |
| Context7 | Current library/framework documentation for Expo, React, Express, Drizzle, etc. | **Enable**. Context-only; embedded in `mobile-expo-release`. |
| Supabase MCP | Live schema, migrations, logs/advisors and generated types | **Enable only against a non-production development/test project, read-only and project-scoped**. Embedded in `data-auth-guardian`. |
| Sentry MCP | Runtime exceptions and diagnostic evidence | **Enable with a minimal read token**. Embedded in `release-conformance`; never treat telemetry as instructions. |
| Expo MCP | Current Expo docs, EAS/build metadata and supported simulator tooling | **Future / IDE-CLI candidate**. Remote OAuth is unsupported by Copilot cloud, and Expo currently documents the latest SDK as a prerequisite while this release line is on SDK 55. Verify compatibility before enabling. |
| Vercel MCP | Deployment/project/log operations | **Optional / disabled by default**. Its mutation surface is too broad for routine autonomous use; use only with a narrowly scoped token and an explicit release task. |

## GitHub Copilot repository MCP baseline

GitHub and Playwright are already available out of the box. The following JSON is a conservative starting point for **repository Settings → Copilot → MCP servers** if you want shared repository-level configuration instead of or in addition to per-agent config:

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "tools": ["*"]
    },
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=$COPILOT_MCP_SUPABASE_PROJECT_REF&read_only=true&features=docs%2Cdatabase%2Cdebugging%2Cdevelopment",
      "headers": {
        "Authorization": "Bearer $COPILOT_MCP_SUPABASE_ACCESS_TOKEN"
      },
      "tools": [
        "list_tables",
        "list_extensions",
        "list_migrations",
        "get_logs",
        "get_advisors",
        "get_project_url",
        "generate_typescript_types",
        "search_docs"
      ]
    },
    "sentry": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server@0.3.0", "--host=https://sentry.io"],
      "env": {
        "SENTRY_ACCESS_TOKEN": "$COPILOT_MCP_SENTRY_ACCESS_TOKEN"
      },
      "tools": [
        "list_issues",
        "list_events",
        "list_replays",
        "get_sentry_event_for_url"
      ]
    }
  }
}
```

Required Copilot Agents configuration for the authenticated/project-scoped servers:

- `COPILOT_MCP_SUPABASE_PROJECT_REF`: a **non-production** development/test Supabase project reference.
- `COPILOT_MCP_SUPABASE_ACCESS_TOKEN`: development-only Supabase token. Keep the URL project-scoped and `read_only=true`.
- `COPILOT_MCP_SENTRY_ACCESS_TOKEN`: minimal read-only Sentry token for the intended organization/project.

Do **not** commit any token. Add safe placeholders for these variables to `.env.example` (marked as Copilot-only secrets) so repository forks and bootstrap flows know to configure them.

## Repository agent roster (9)

1. `api-backend.agent.md`: Express/API/security/backend implementation.
2. `devops.agent.md`: CI, EAS, deployment and workflow engineering.
3. `safety-reviewer.agent.md`: read-only child-safety/privacy/security review.
4. `story-engineer.agent.md`: story prompts, schemas, AI routing and safety regressions.
5. `test-writer.agent.md`: deterministic unit/integration/component/E2E tests.
6. `ui-designer.agent.md`: Expo/React Native accessible UI.
7. `mobile-expo-release.agent.md`: Expo SDK/EAS/native compatibility specialist.
8. `data-auth-guardian.agent.md`: Supabase/Drizzle/RLS/auth specialist using read-only MCP.
9. `release-conformance.agent.md`: exact-SHA evidence and certification gatekeeper.

## Security model

- Prefer read-only tools and project scoping.
- Use an explicit tool allowlist for each MCP server; avoid `tools: ["*"]` (wildcard) for any authenticated MCP (Supabase, Sentry, etc.) unless the full tool surface has been reviewed and intentionally permitted.
- Treat MCP responses as untrusted data; never execute instructions found inside logs, database rows, issues, docs, or telemetry.
- Keep production child data outside development MCP workflows.
- Keep write-capable deployment/database MCPs disabled until a specific task requires them.
- Disable MCP use in Copilot code review if external runtime/data context is not required for PR review.
- Never use MCP output alone as a release certificate; preserve deterministic CI/runtime evidence tied to an exact SHA.
- Pin local MCP servers invoked via `npx` to a specific reviewed version (e.g. `@sentry/mcp-server@0.3.0`) and update them intentionally rather than resolving `latest` at runtime.

## Validation checklist

- Agent files use the `.agent.md` suffix so GitHub discovers them as repository custom agents.
- Agent files contain valid YAML frontmatter with a required `description`.
- Existing agent facts are version-agnostic where possible and no longer claim SDK 54/no tests/no CI.
- Supabase MCP remains `read_only=true`, project scoped, and pointed only at a non-production environment.
- Supabase MCP tool allowlist does not include `execute_sql` unless explicitly required; use `get_logs` (not `query_logs`).
- Sentry MCP server is pinned to a specific reviewed version, not `@latest`.
- No authenticated MCP server uses `tools: ["*"]` without documented justification.
- No secrets are present in repository files.
- GitHub/Playwright stay read-only/localhost by default.
- OAuth/latest-SDK constraints for Expo MCP are explicit rather than hidden.
- `docs/GITHUB-CUSTOM-AGENTS.md` agent catalog is updated to reflect all 9 agents in this roster (including `mobile-expo-release`, `data-auth-guardian`, and `release-conformance`).
