# Google Play Store Submission & Families Compliance Checklist

**App Name:** Infinity Heroes: Bedtime Chronicles  
**Package Name:** `com.infinityheroes.bedtime`  
**EAS Project ID:** `6aea7a34-65d8-4036-a1b8-9caed0b850fb`  
**Target Audience:** Children (Ages 3–5, Ages 6–8, Ages 9) & Parents  
**Last Updated:** 2026-08-14  

---

## 1. Automated Preflight Gate

Before generating the production Android App Bundle (AAB), ensure the preflight suite passes:

```bash
npm run preflight:eas
```

- [x] `app.json` contains package identifier `com.infinityheroes.bedtime`
- [x] Zero microphone or camera permissions declared
- [x] `android.permission.RECORD_AUDIO` explicitly blocked in `blockedPermissions`
- [x] `eas.json` production profile configures `buildType: "app-bundle"` and Node 22
- [x] Client environment variables audited (`EXPO_PUBLIC_*` contains only public URLs and DSNs)

---

## 2. Google Play Console Policy Declarations

### A. Target Audience and Content (Teacher Approved / Families Program)
1. **Target Age Groups**: Select **Ages 5 and under**, **Ages 6-8**, and **Ages 9-12**.
2. **Appeal to Children**: Yes (Design explicitly tailored for bedtime stories).
3. **Families Policy Compliance**: Fully compliant. App contains no interactive child-to-child communication, no third-party ad networks, and no external tracking SDKs.

### B. Ads & Monetization
1. **Contains Ads**: Select **No**.
2. **Third-Party Ad SDKs**: None included in the repository bundle.

### C. Data Safety Form Responses
1. **Data Collection Overview**:
   - Data is encrypted in transit using standard HTTPS/TLS (TLS 1.2+).
   - Users can request deletion of their data (In-app **Settings → Privacy & Data → Delete All Data** and web form).
2. **Data Collected**:
   - **Personal Info**: Optional Parent Email Address (when authenticating via Supabase for optional cloud backup). Used strictly for account management and authentication.
   - **Financial Info**: None.
   - **Health & Fitness**: None.
   - **Messages / Audio**: None stored on server without user consent. AI voice chat UI is contained and inactive for release.
   - **App Info & Performance**: Crash logs / diagnostics via Sentry (anonymized, no child PII).
3. **Data Sharing**:
   - Select **No data is shared with third parties** for advertising or tracking purposes.

### D. Privacy Policy & Account Deletion URLs
- **Privacy Policy URL**: `https://www.bedtime-chronicles.com/privacy`
- **Account Deletion Web URL**: `https://www.bedtime-chronicles.com/privacy` (Contact: `privacy@bedtime-chronicles.com`)

---

## 3. Production AAB Generation & Release Execution

```bash
# 1. Build Production Android App Bundle
bash scripts/build-android.sh production

# 2. Verify AAB Artifact
# Download the signed .aab from https://expo.dev/accounts/chaosclubco/projects/infinity-heroes

# 3. Upload to Google Play Console
# Navigate to: Release -> Production (or Internal testing) -> Create new release
# Upload .aab, fill in release notes from docs/CHANGELOG.md, and submit for review.
```
