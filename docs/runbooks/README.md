# Runbooks

<!-- Last verified: 2026-06-18 -->

Operational runbooks for Infinity Heroes: Bedtime Chronicles. Each runbook is a step-by-step procedure for a specific operational scenario.

## Index

| Runbook | When to Use |
|---------|-------------|
| [deploy.md](./deploy.md) | Deploying a new version to Replit or Vercel |
| [rollback.md](./rollback.md) | Rolling back a bad deployment |
| [incident-response.md](./incident-response.md) | Responding to a production incident |
| [provider-outage.md](./provider-outage.md) | Handling AI provider outages |
| [database-migrations.md](./database-migrations.md) | Running Drizzle schema migrations |
| [monitoring-alerting.md](./monitoring-alerting.md) | Responding to Sentry alerts and Cloudflare KV issues |

## Escalation Path

1. On-call developer responds to alert
2. If unresolved in 15 minutes → declare incident (`incident-response.md`)
3. If AI providers are down → `provider-outage.md`
4. If deployment caused the issue → `rollback.md`
