# Dependency Vulnerability & Transitive Remediation Analysis

**Last Updated:** 2026-08-14  
**Audit Gate Policy:** Zero High/Critical Advisories Fail-Closed (`scripts/audit-gate.mjs`)  
**Scope:** Production and Development Dependencies Matrix  
**Status:** Clean — 0 High / 0 Critical in Production  

---

## 1. Executive Summary

Infinity Heroes: Bedtime Chronicles enforces a strict, fail-closed security audit gate on all pull requests and CI pipelines. Any new high or critical CVE advisory immediately fails release candidate verification.

| Severity | Active Production Count | Status | Policy / Action |
|----------|------------------------|--------|-----------------|
| **Critical** | **0** | **CLEAN** | Any occurrence blocks CI and deployment |
| **High** | **0** | **CLEAN** | Any occurrence blocks CI and deployment |
| **Moderate** | Transitive (Build-time only) | Documented / Controlled | Evaluated per dependency chain; no blind `--force` downgrades |
| **Low** | 0 | Clean | Standard maintenance review |

---

## 2. CI Security Gate & Automated Allowlist (`scripts/audit-gate.mjs`)

The repository runs `node scripts/audit-gate.mjs` as part of every Vercel build and GitHub Actions CI workflow:

- **JSON Ingestion**: Executes `npm audit --json` and inspects all vulnerabilities.
- **Fail-Closed Threshold**: Automatically exits code `1` if any unlisted high/critical advisory is detected.
- **Time-Bounded Allowlist**:
  ```javascript
  const ALLOWLIST = {
    'GHSA-w3rx-r6r6-pgpr': {
      package: 'image-size',
      reason: 'ICNS parser DoS. No patched release published; npm fix requires downgrading to Expo 53. App never parses user-supplied ICNS files.',
      expires: '2026-10-01',
    },
    'GHSA-5p2g-fcmc-qvqq': {
      package: 'image-size',
      reason: 'JXL/HEIF parser DoS. Same unpatched image-size chain via @expo/image-utils; only fix is a breaking Expo downgrade.',
      expires: '2026-10-01',
    },
  };
  ```
- **Expiry Enforcement**: Allowlist entries carry strict expiration dates. Expired entries automatically fail the build, requiring a fresh audit review.

---

## 3. Transitive Moderate Findings Analysis

Automated package tools like `npm audit fix --force` frequently suggest destructive downgrades that break core functionality. The remaining moderate transitive chains have been analyzed and reviewed:

### A. `esbuild` via `drizzle-kit` and `@esbuild-kit/*`
- **Advisory**: Build-time prototype pollution / dev-server vulnerability.
- **Why `--force` is rejected**: `npm audit fix --force` suggests downgrading to `drizzle-kit@0.18.1`, which removes required PostgreSQL schema push commands (`db:push`) and breaks TypeScript Drizzle ORM model types in `shared/schema.ts`.
- **Runtime Risk Assessment**: **Zero Runtime Risk**. `esbuild` and `drizzle-kit` are exclusively build-time tooling and are not bundled into the production serverless runtime or native client.

### B. `uuid` via `@expo/config-plugins`
- **Advisory**: Weak PRNG in older legacy `uuid` releases.
- **Why `--force` is rejected**: Transitive requirement of Expo SDK 55 config plugins.
- **Runtime Risk Assessment**: **Zero Runtime Risk**. Expo configuration plugins execute strictly during local build compilation (`npx expo export`), not on the end-user device.

---

## 4. Upgrade Strategy & Long-Term Roadmap

1. **Expo SDK 55 → 57 Upgrade Track**:
   - Upgrading to Expo SDK 57 will naturally bump the `@expo/config-plugins` and image utility trees.
   - Per `docs/ROADMAP.md` Item 11, major Expo SDK jumps are scheduled for dedicated, isolated upgrade sprints to prevent regressions.
2. **Weekly Dependabot Scans**:
   - Dependabot monitors minor/patch updates for production dependencies while pinning SDK 55 core modules (`@sentry/react-native`, `react-native-gesture-handler`).
