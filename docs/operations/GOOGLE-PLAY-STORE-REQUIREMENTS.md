# Google Play Store Compliance & Submission Manual

This manual provides the authoritative verification checklist and exact Google Play Console declarations required for **Infinity Heroes: Bedtime Chronicles** under Google Play Developer Program Policies, the Families Policy, and COPPA regulations.

---

## 1. Compliance Matrix Overview

| Policy Area | Status | Implementation Details |
| :--- | :--- | :--- |
| **Designed for Families** | ✅ Compliant | Target audience declared (Ages 3–5, 6–8). In-app adult parental gate on all sensitive actions and external links. |
| **COPPA / Child Privacy** | ✅ Compliant | No child PII transmitted. Child name & age stay on-device. Privacy policy explicitly addresses child data. |
| **Zero Advertising SDKs** | ✅ Compliant | Zero third-party ad networks or tracking SDKs. No Android Advertising ID (AAID) collection. |
| **Permissions Minimization** | ✅ Compliant | `permissions: []` in `app.json`. `RECORD_AUDIO` explicitly blocked via `blockedPermissions`. |
| **Data Safety & Account Deletion** | ✅ Compliant | In-app data deletion via `DELETE /api/account` + web contact via `https://www.bedtime-chronicles.com/privacy`. |
| **Technical Format (AAB)** | ✅ Compliant | Android App Bundle (`.aab`) configured in `eas.json` for 64-bit multi-arch distribution. Target API Level 34/35 via Expo SDK 55. |

---

## 2. Google Play Console Setup & Declarations

### 2.1 Target Audience and Content (Families Policy)

When completing the **Target audience and content** section in the Google Play Console:

1. **Target Age Groups**:
   - Select **Ages 5 and under** and **Ages 6–8**.
   - *Do NOT select older age categories unless universal neutral age gating is added.*
2. **App Details**:
   - **Appeal to Children**: Yes (Intentional child-directed app).
   - **Join Designed for Families Program**: Yes.
3. **Ads Declaration**:
   - Select **No, my app does not contain ads**.
4. **Parental Gate**:
   - Answer **Yes** — external links, email links, and account settings are guarded behind mathematical parental challenges (`components/ParentalGateModal.tsx`).

---

### 2.2 Data Safety Form Declarations

Exact responses for the Play Console **Data Safety** questionnaire:

#### Overview Questions:
- **Does your app collect or share any of the required user data types?** → **Yes** (Optional parent account email and crash diagnostics).
- **Is all of the user data collected by your app encrypted in transit?** → **Yes** (All traffic uses HTTPS / TLS 1.3).
- **Do you provide a way for users to request that their data is deleted?** → **Yes** (In-app deletion and web request URL provided).

#### Data Types Collected & Shared:

| Data Category | Data Type | Collected? | Shared? | Purpose | Ephemeral? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Email Address | Yes (Optional) | No | Account management & cloud backup (Parent account only). | No |
| **App Info & Performance** | Crash logs & Diagnostics | Yes | No | Analytics & app performance (Sentry). Stripped of PII. | No |
| **Audio Files** | Voice / Sound Recordings | **No** | **No** | The app only plays TTS audio; it never records or uploads microphone audio. | N/A |
| **Device / Other IDs** | Device ID / Advertising ID | **No** | **No** | No advertising identifiers or persistent device IDs collected. | N/A |

---

### 2.3 Account Deletion URL Requirement

Google Play requires apps that offer account creation to provide both an in-app deletion option and a web-based deletion URL:

- **In-App Deletion Flow**: User navigates to **Settings / Parent Controls** → passes Parent PIN / Gate → taps **Delete All Data** (executes `DELETE /api/account` and purges local device storage).
- **Web Deletion URL for Play Console**:
  ```
  https://www.bedtime-chronicles.com/privacy
  ```
  *(Sections 6 & 9 of the privacy notice specify the data deletion process and contact email `privacy@bedtime-chronicles.com`).*

---

## 3. Technical Requirements Verification

### 3.1 Package & Version Configuration (`app.json`)
- **Package Name**: `com.infinityheroes.bedtime` (Permanent identifier).
- **Version**: `1.0.0` (`versionCode: 1` — auto-incremented by EAS on subsequent builds).
- **Architecture**: `newArchEnabled: true`.

### 3.2 Android Permissions Verification
Google Play Families Policy strictly forbids unnecessary background or sensitive permissions:

```json
"android": {
  "package": "com.infinityheroes.bedtime",
  "versionCode": 1,
  "permissions": [],
  "blockedPermissions": [
    "android.permission.RECORD_AUDIO"
  ]
}
```

### 3.3 Visual Store Assets Checklist

| Asset | Specifications | Location / Status |
| :--- | :--- | :--- |
| **App Icon** | 512×512 PNG, 32-bit color, no alpha/transparency | `assets/images/icon.png` |
| **Adaptive Foreground** | 432×432 PNG (safe area 288×288) | `assets/images/android-icon-foreground.png` |
| **Adaptive Background** | 432×432 PNG / `#0B1026` | `assets/images/android-icon-background.png` |
| **Adaptive Monochrome** | 432×432 PNG for themed icons | `assets/images/android-icon-monochrome.png` |
| **Splash Screen** | 1284×2778 PNG, `#0B1026` background | `assets/images/splash-icon.png` |
| **Feature Graphic** | 1024×500 PNG/JPEG (for Play Store listing) | Upload in Play Console |
| **Phone Screenshots** | Minimum 2 screenshots (16:9 or 9:16 aspect ratio) | Generated from app runs |

---

## 4. Build & Submission Procedure

### Step 1: Verify Secrets and Tooling
Ensure `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_SUPABASE_*` are set in EAS (see `docs/operations/EAS-SECRETS-CHECKLIST.md`).

### Step 2: Build Production Android App Bundle (.aab)
```bash
# Using build helper script
bash scripts/build-android.sh production

# Or via EAS CLI directly
eas build --platform android --profile production
```

### Step 3: Upload to Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Navigate to **Infinity Heroes: Bedtime Chronicles** → **Testing** → **Internal testing**.
3. Create a new release and upload the `.aab` generated from EAS.
4. Complete the **Store Presence**, **Content Rating** (IARC), and **App Content** questionnaires using Section 2 above.
5. Promote from Internal Testing → Closed Beta / Production after verification.
