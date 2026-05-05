# Runbook: Database Migrations

<!-- Last verified: 2026-05-05 -->

This runbook covers how to manage database schema changes for Infinity Heroes: Bedtime Chronicles.

**Database:** PostgreSQL
**ORM:** Drizzle ORM (`drizzle-orm` package)
**Migration strategy:** Push mode — `npm run db:push` applies the current schema directly without generating migration files.

> **Scope:** The database is only required for the voice chat feature (`/api/conversations/*`). Core story generation, TTS, and profiles work without a database (they use client-side AsyncStorage).

---

## Prerequisites

- `DATABASE_URL` environment variable set to a valid PostgreSQL connection string
  ```
  DATABASE_URL=postgresql://user:password@host:5432/dbname
  ```
- For Replit: configure `DATABASE_URL` in Settings → Secrets
- For EAS builds: `eas secret:create --scope project --name DATABASE_URL --value <value>`

---

## Schema Location

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Root schema file — re-exports all table definitions |
| `shared/models/chat.ts` | `conversations` and `messages` tables |
| `drizzle.config.ts` | Drizzle configuration (dialect, schema path, output path) |

---

## Applying Schema Changes (Development)

When you add or modify a table definition in `shared/models/`, apply it to the database:

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Push schema to database (creates/alters tables as needed)
npm run db:push
```

`db:push` compares the current schema with the live database and applies the difference. It will:
- Create new tables
- Add new columns
- **Warn before dropping columns** — confirm before proceeding

---

## Procedure for Schema Changes

1. **Modify the schema** — Edit `shared/models/<entity>.ts` or add a new file
2. **Export from root** — Ensure `shared/schema.ts` exports the new tables
3. **Run locally** — `npm run db:push` against a development database
4. **Test the change** — Exercise the affected routes with `npm test` or manual testing
5. **Deploy** — In production, run `npm run db:push` with the production `DATABASE_URL` **before** deploying the new server code

### Cascade Deletes

Always add cascade deletes when a parent record deletion should remove child records:

```typescript
// shared/models/chat.ts — example
conversationId: integer('conversation_id').references(() => conversations.id, { onDelete: 'cascade' })
```

---

## Production Schema Change Checklist

Before applying a schema change to production:

- [ ] Schema change tested against a development database with `npm run db:push`
- [ ] Tests pass: `npm test`
- [ ] TypeScript clean: `npm run typecheck`
- [ ] If dropping a column or table: confirm no active server code references it
- [ ] If renaming a column: deploy a two-phase migration (add new → migrate data → remove old)
- [ ] Backup taken (via PostgreSQL dump or Replit database snapshot) before applying

---

## Rollback

Drizzle push mode does not generate rollback scripts automatically.

**To undo a table addition:**
```sql
-- Connect to the database and drop the table
DROP TABLE IF EXISTS <table_name> CASCADE;
```

**To undo a column addition:**
```sql
ALTER TABLE <table_name> DROP COLUMN IF EXISTS <column_name>;
```

**To restore from backup:**
```bash
# Restore from a pg_dump backup
pg_restore -d $DATABASE_URL backup.dump
```

---

## Current Schema Summary

### `conversations` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer (auto-increment PK) | — |
| `userId` | text | Firebase UID of the session owner |
| `title` | text | Optional conversation title (≤200 chars) |
| `createdAt` | timestamp | Auto-set on insert |
| `updatedAt` | timestamp | Auto-set on update |

### `messages` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | integer (auto-increment PK) | — |
| `conversationId` | integer (FK → conversations.id) | Cascade deletes on conversation removal |
| `role` | text | `"user"` or `"assistant"` |
| `content` | text | Message text (≤10,000 chars) |
| `createdAt` | timestamp | Auto-set on insert |

---

## Verifying Database Health

```bash
# Test DB connection (requires psql on PATH)
psql $DATABASE_URL -c "SELECT 1;"

# List tables
psql $DATABASE_URL -c "\dt"

# Check row counts
psql $DATABASE_URL -c "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

---

## See Also

- [deploy.md](./deploy.md) — Full deployment procedure
- [rollback.md](./rollback.md) — Rollback a bad deploy
- `shared/schema.ts` — Schema source of truth
- `drizzle.config.ts` — Drizzle configuration
