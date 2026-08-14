# Dependency Vulnerability & Transitive Remediation Analysis

**Last Updated:** 2026-08-14  
**Audit Gate Policy:** Zero High/Critical Advisories Fail-Closed (`scripts/audit-gate.mjs`)  
**Scope:** Production and Development Dependencies Matrix  
**Status:** Clean — 0 High / 0 Critical in Production  
**Automated Verification:** `server/audit-gate.test.ts` & `node scripts/audit-gate.mjs`

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

The repository runs `node scripts/audit-gate.mjs` as part of every Vercel build, GitHub Actions CI workflow, and release proof gate:

- **JSON Ingestion**: Executes `npm audit --json` and inspects all vulnerabilities across the entire package dependency graph.
- **Fail-Closed Threshold**: Automatically exits code `1` if any unlisted high/critical advisory is detected.
- **Time-Bounded Allowlist**:
  ```javascript
  export const ALLOWLIST = {
    'GHSA-w3rx-r6r6-pgpr': {
      package: 'image-size',
      reason:
        'ICNS parser DoS. No patched release published; npm fix requires downgrading to Expo 53 / RN 0.72. App never parses user-supplied ICNS files.',
      expires: '2026-10-01',
    },
    'GHSA-5p2g-fcmc-qvqq': {
      package: 'image-size',
      reason:
        'JXL/HEIF parser DoS. Same unpatched image-size chain via @expo/image-utils; only fix is a breaking Expo downgrade.',
      expires: '2026-10-01',
    },
  };
  ```
- **Expiry Enforcement**: Allowlist entries carry strict expiration dates. Expired entries automatically fail the build, requiring a fresh audit review.
- **Unit Test Coverage**: Validated by `server/audit-gate.test.ts` covering allowlist filtering, date expiration, and fail-closed rejection.

---

## 3. Transitive Moderate Findings Analysis & Remediation Matrix

Automated package tools like `npm audit fix --force` frequently suggest destructive downgrades that break core functionality. The remaining moderate transitive chains have been comprehensively analyzed, isolated, and documented:

### A. `esbuild` via `drizzle-kit` and `@esbuild-kit/*`
- **Advisory**: Build-time prototype pollution / dev-server vulnerability.
- **Why `--force` is rejected**: `npm audit fix --force` suggests downgrading to `drizzle-kit@0.18.1`, which removes required PostgreSQL schema push commands (`db:push`) and breaks TypeScript Drizzle ORM model types in `shared/schema.ts`.
- **Runtime Risk Assessment**: **Zero Runtime Risk**. `esbuild` and `drizzle-kit` are exclusively build-time tooling and are not bundled into the production serverless runtime (`nodejs22.x`) or native client.
- **Remediation**: Overridden to `"esbuild": "$esbuild"` in `package.json` with top-level `esbuild@0.28.1`.

### B. `uuid` via `@expo/config-plugins`
- **Advisory**: Weak PRNG in older legacy `uuid` releases.
- **Why `--force` is rejected**: Transitive requirement of Expo SDK 55 config plugins.
- **Runtime Risk Assessment**: **Zero Runtime Risk**. Expo configuration plugins execute strictly during local build compilation (`npx expo export`), not on the end-user mobile device.
- **Remediation**: Overridden to `"uuid": "^11.1.1"` in `package.json` overrides.

### C. `image-size` via `@expo/image-utils`
- **Advisory**: ICNS/JXL parser denial-of-service in legacy parser sub-dependency.
- **Why `--force` is rejected**: Upstream unpatched within Expo SDK 55 toolchain.
- **Runtime Risk Assessment**: **Zero Runtime Risk**. Image optimization occurs during static build bundling, and the application strictly bundles validated PNG/JPEG static assets (`assets/images/`), never accepting user-uploaded ICNS or JXL files.
- **Remediation**: Allowlisted with hard expiration (`2026-10-01`) and scheduled for root elimination via the Expo SDK 57 upgrade track (`docs/operations/EXPO-57-UPGRADE-SPEC.md`).

---

## 4. Package Overrides Table

The repository leverages `package.json` npm overrides to pin secure transitive versions across the build tree:

```json
"overrides": {
  "yaml": "^2.8.3",
  "p-retry": "^4.6.2",
  "shell-quote": "^1.8.4",
  "undici": "^6.27.0",
  "tmp": "^0.2.6",
  "uuid": "^11.1.1",
  "esbuild": "$esbuild",
  "minimatch@3": {
    "brace-expansion": "^1.1.18"
  },
  "eas-cli": {
    "ajv": "^8.18.0",
    "diff": "^8.0.3",
    "joi": "^17.13.4",
    "ts-deepmerge": "^8.0.0"
  },
  "brace-expansion@1": "^1.1.18",
  "brace-expansion@2": "^2.1.4",
  "fast-uri@3": "^3.1.5",
  "js-yaml@3": "^3.15.1",
  "js-yaml@4": "^4.3.1",
  "minimatch@5": "^5.1.9",
  "nanoid@3": "^3.3.18"
}
```

---

## 5. Upgrade Strategy & Long-Term Roadmap

1. **Expo SDK 55 → 57 Upgrade Blueprint (`docs/operations/EXPO-57-UPGRADE-SPEC.md`)**:
   - Upgrading to Expo SDK 57 will natively modernize `@expo/config-plugins` and the image utility trees, resolving remaining upstream moderate transitive chains.
   - Verified preflight gate: `scripts/verify-expo57-readiness.mjs` (`npm run verify:expo57-readiness`).
2. **Dependabot Configuration (`.github/dependabot.yml`)**:
   - Dependabot monitors minor/patch updates for production dependencies while pinning SDK 55 core modules (`@sentry/react-native`, `react-native-gesture-handler`) to prevent breaking peer dependency drift.
