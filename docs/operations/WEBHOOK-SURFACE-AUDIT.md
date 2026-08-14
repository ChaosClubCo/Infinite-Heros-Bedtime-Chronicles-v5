# Webhook Surface & Integration Ingress Audit

**Last Updated:** 2026-08-14  
**Scope:** Inbound & Outbound Webhook Surfaces across GitHub, Vercel, Supabase, and Sentry  
**Status:** Audited & Verified  

This audit documents every external webhook entry point, payload signature verification mechanism, ingress security boundaries, and rate limiting controls across Infinity Heroes: Bedtime Chronicles.

---

## 1. Webhook Topology Matrix

| Surface | Direction | Path / Endpoint | Protocol / Auth | Purpose |
|---------|-----------|-----------------|-----------------|---------|
| **GitHub Webhook Ingress** | Inbound | `POST /api/github/webhook` | `X-Hub-Signature-256` HMAC (SHA-256) | Ingests repository events, push deliveries, workflow notifications |
| **Vercel Deploy Hook** | Outbound | `https://api.vercel.com/v1/integrations/deploy/...` | Capability URL via Secret | Triggers serverless production build upon authorized release gate |
| **Supabase Database Webhooks** | Inbound/Internal | `auth.users` cascade triggers | Row-Level Security (RLS) / Postgres Internal | Triggers automatic account deletion and `sync_records` cleanup |
| **Sentry Alerting Webhooks** | Outbound | Sentry Alert Webhook integrations | HTTPS Bearer Token | Dispatches 5xx alert rate and TTS error breach alerts |

---

## 2. Inbound Webhook Analysis: GitHub Webhook Route

### Architecture & Handlers (`server/routes/github-webhook.ts`)

- **Route:** `POST /api/github/webhook`
- **Body Parsing:** Handled via `express.raw({ type: () => true, limit: '25mb' })` directly inside the route module. This deliberately bypasses the global `100kb` `express.json` parser in `server/index.ts`, preserving raw byte accuracy for HMAC calculation.
- **Rate Limiting:** Guarded by `rateLimited("Too many webhook deliveries. Please wait a moment.")` sliding-window limiter.

### Signature Verification Algorithm

```typescript
function verifySignature(
  secret: string,
  rawBody: Buffer,
  signatureHeader: string | undefined,
): { ok: boolean; reason: string } {
  if (!signatureHeader) return { ok: false, reason: "missing_signature_header" };
  if (!signatureHeader.startsWith("sha256=")) return { ok: false, reason: "unsupported_signature_scheme" };

  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);

  if (expectedBuf.length !== actualBuf.length) return { ok: false, reason: "signature_length_mismatch" };
  const ok = crypto.timingSafeEqual(expectedBuf, actualBuf);
  return { ok, reason: ok ? "ok" : "signature_mismatch" };
}
```

### Security Properties
1. **Timing-Safe Equality**: Uses `crypto.timingSafeEqual()` to guard against side-channel timing attacks.
2. **Fail-Closed on Unset Secret**: If `GITHUB_WEBHOOK_SECRET` environment variable is not configured, the endpoint returns `500 { error: "Webhook not configured" }` and rejects all incoming payloads.
3. **Structured Diagnostics**: Logs delivery UUID, event type, and verification result without leaking raw request body contents.

---

## 3. Outbound Webhook Analysis: Vercel Deploy Hook

### Security Boundaries & Controls
1. **Capability URL Protection**: The Vercel deploy hook URL acts as a bearer token. It must never be committed to source code or stored in plaintext webhook payloads.
2. **Repository Secret Isolation**: The hook URL is stored exclusively as `VERCEL_DEPLOY_HOOK_URL` in GitHub Actions repository secrets.
3. **Branch Target Pinning**: Configured in Vercel project settings to accept deployments only for the canonical `main` branch.
4. **Provenance Gate**: Before invoking the deploy hook, `.github/workflows/vercel-deploy.yml` executes `scripts/verify-release-provenance.mjs` ensuring only canonical `ChaosClubCo` repository commits trigger builds.

---

## 4. Supabase & Database Event Triggers

### Account Deletion & Cascading Cleanups
- **Authentication Cascade**: When a user is deleted from `auth.users`, Postgres foreign key cascades (`ON DELETE CASCADE`) purge all matching rows in `public.sync_records`.
- **Row-Level Security (RLS)**:
  ```sql
  ALTER TABLE public.sync_records ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can manage their own sync records"
    ON public.sync_records
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  ```
- **Dynamic Deletion Scope Verification**: Handled server-side in `server/routes/account.ts` and validated with `shared/account-deletion.ts`.

---

## 5. Audit Verification & Ongoing Governance

### Verification Procedure
Run the automated test suite to confirm webhook verification behaviors:
```bash
npm test server/routes/github-webhook.test.ts
```

### Governance Rules
1. **Quarterly Secret Rotation**: Rotate `GITHUB_WEBHOOK_SECRET` and `VERCEL_DEPLOY_HOOK_URL` according to [`SECRETS-ROTATION.md`](./SECRETS-ROTATION.md).
2. **No Wildcard Webhook Subscriptions**: GitHub webhooks must be scoped only to necessary events (`push`, `pull_request`, `workflow_job`), never `*` (all events).
3. **Payload Sanitization**: Webhook payloads received by Express are discarded after event processing and are never written to disk or database logs.
