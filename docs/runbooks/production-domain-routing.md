# Runbook: Production Domain Routing — 403 / Cloudflare Error 1014

<!-- Last verified: 2026-08-22 -->

**Scenario:** `https://www.bedtime-chronicles.com/api/health` (or any path on the
production domain) returns **HTTP 403 Forbidden** with `Server: cloudflare` and a body
of `error code: 1014` instead of the expected `200 OK` health JSON
(see [`docs/API.md` → Health & Status](../API.md#health--status)).

**Severity:** Production-down for the custom domain. The Vercel deployment itself is
usually healthy — the `*.vercel.app` alias keeps working — but every client configured
with `EXPO_PUBLIC_API_URL=https://www.bedtime-chronicles.com` fails.

---

## 1. Symptom

```bash
curl -si https://www.bedtime-chronicles.com/api/health
# HTTP/2 403
# server: cloudflare
# error code: 1014
```

Cloudflare **Error 1014: "CNAME Cross-User Banned"** means the request is being served
by Cloudflare's edge, and the DNS record for `www.bedtime-chronicles.com` is a
**proxied (orange-cloud) CNAME pointing at a hostname that belongs to a different
Cloudflare account** (Vercel's `cname.vercel-dns.com` targets sit behind Cloudflare
infrastructure). Cloudflare blocks cross-account CNAME resolution unless the target
account has explicitly authorized the hostname, so the edge rejects the request before
it ever reaches Vercel or the Express app.

This is a **DNS/edge misconfiguration, not an application bug** — no amount of
redeploying fixes it.

## 2. Distinguish from look-alike failures

| Observation | Actual problem | Runbook |
|---|---|---|
| 403 + `error code: 1014` + `server: cloudflare` | Proxied CNAME to another Cloudflare user's hostname | **this runbook** |
| 404 + `server: Vercel` | Domain resolves to Vercel but is attached to no project | `docs/archive/plans/VERCEL_RELINK_2026-07-19.md` precedent — re-attach the domain in Vercel → Settings → Domains |
| 200 but `releaseSha` ≠ canonical `main` | Deployment drift | [`deployment-provenance.md`](./deployment-provenance.md) |
| 5xx from the app | Application/provider failure | [`incident-response.md`](./incident-response.md) / [`provider-outage.md`](./provider-outage.md) |
| Vercel "Vercel" check failing on a PR | Hobby-plan commit-author gate | `DEPLOY.md` (known, unrelated to DNS) |

Quick triage commands:

```bash
# Who answers the hostname?
dig +short www.bedtime-chronicles.com CNAME
dig +short www.bedtime-chronicles.com A

# Does the app itself work when Cloudflare is bypassed? (use the project's .vercel.app alias)
curl -si https://infinite-heros-bedtime-chronicles-v-gules.vercel.app/api/health
```

If the `.vercel.app` alias returns `200` with valid health JSON, the outage is confined
to the domain edge — proceed below.

## 3. Resolution

The fix is to make the DNS for `www.bedtime-chronicles.com` (and the apex) point at
Vercel in a way Cloudflare permits. Pick **one** of these end-states; A is the
recommended default.

### Option A (recommended): DNS-only ("grey cloud") records in Cloudflare

Vercel terminates TLS and serves the site directly; Cloudflare acts as plain DNS.

1. Log in to the Cloudflare dashboard → select the `bedtime-chronicles.com` zone → **DNS**.
2. Edit the record for `www`:
   - Type `CNAME`, target `cname.vercel-dns.com` (or the exact target Vercel shows
     under **Vercel → Project → Settings → Domains** for `www.bedtime-chronicles.com`).
   - Set **Proxy status to "DNS only" (grey cloud)** — this is the step that clears 1014.
3. Edit the apex record (`bedtime-chronicles.com`):
   - Type `A`, value `76.76.21.21` (Vercel's apex IP — confirm the current value in the
     Vercel Domains UI), Proxy status **DNS only**.
   - The apex 308-redirects to `www` at Vercel (configured in the project's domain settings).
4. In **Vercel → Project → Settings → Domains**, confirm both hostnames show
   **"Valid Configuration"**. If either shows a verification TXT record requirement,
   add that TXT record in Cloudflare (also DNS only) and re-verify.
5. Wait for DNS propagation (Cloudflare edits are near-instant; resolver caches up to
   the record TTL), then run the verification in §4.

### Option B: Keep Cloudflare proxying (orange cloud)

Only if Cloudflare features (WAF, caching) in front of the domain are explicitly
wanted. A proxied CNAME to `cname.vercel-dns.com` will keep producing 1014 unless the
hostname is authorized:

1. In **Vercel → Project → Settings → Domains**, ensure the domain is added and follow
   Vercel's instructions for proxied/Cloudflare setups (Vercel issues certificates via
   HTTP-01, which the proxy can break — the Vercel UI flags this).
2. Set the Cloudflare zone **SSL/TLS mode to "Full (Strict)"** — "Flexible" causes
   redirect loops against Vercel.
3. If 1014 persists, use **Cloudflare for SaaS / Custom Hostnames** authorization on the
   target account, or fall back to Option A. In practice Option A is the supported,
   low-maintenance configuration for Vercel-hosted apps.

### If the record is right but 1014 persists

- Confirm you edited the zone that is actually authoritative:
  `dig +short NS bedtime-chronicles.com` must list the same Cloudflare nameservers the
  dashboard zone shows. A stale duplicate zone (or nameservers still pointing at a
  registrar's DNS) means edits are landing in the wrong place.
- Confirm the domain hasn't been removed from the Vercel project (see the 404 row in
  §2 — both failure modes have occurred historically).

## 4. Verify

Production is healthy again when **all** of these pass:

```bash
# 1. Health contract: 200 OK, status "ok", releaseSha matches canonical main
curl -si https://www.bedtime-chronicles.com/api/health
git ls-remote https://github.com/ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5.git main

# 2. Apex redirects to www
curl -sI https://bedtime-chronicles.com/ | grep -i '^location'
# expect: https://www.bedtime-chronicles.com/

# 3. Privacy page (Play Store compliance URL) renders
curl -si https://www.bedtime-chronicles.com/privacy | head -5
```

The scheduled **Deployment Drift Monitor** workflow
(`.github/workflows/deployment-drift.yml`) also polls `/api/health` and will go green
on its next run once the domain serves the app again.

## 5. Prevention

- Treat the Cloudflare DNS records for this zone as production configuration: any
  change to the `www`/apex records (especially toggling proxy status) is a production
  change and should be verified with §4 immediately.
- The drift monitor already alerts when `/api/health` is unreachable or stale — do not
  disable it.
- If the FlashFusion team ever migrates the zone or consolidates Cloudflare accounts
  (see the `Abstrekkt/` DNS tooling for the `flashfusion.co` zone), re-verify this
  domain's records afterwards.

## Related

- [`docs/API.md` → Health & Status](../API.md#health--status) — expected `/api/health` 200 OK contract
- [`docs/operations/DEPLOYMENT.md`](../operations/DEPLOYMENT.md) — deploy pipeline + health polling
- [`deployment-provenance.md`](./deployment-provenance.md) — releaseSha drift
- [`incident-response.md`](./incident-response.md) — if user impact warrants declaring an incident
