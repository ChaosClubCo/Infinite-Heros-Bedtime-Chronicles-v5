# Apple and Google Data-Disclosure Answer Sheet

**Prepared:** 2026-07-19  
**App:** Infinity Heroes: Bedtime Chronicles  
**Bundle/package:** `com.infinityheroes.bedtime`  
**Release track:** PR #377 / issue #376  
**Status:** **DRAFTED; NOT SUBMITTED**

This is a repository-grounded answer sheet for an authorized Apple App Store Connect and Google Play Console operator. It does not represent a completed platform submission.

## Assumptions that must remain true

- Voice Chat is disabled.
- Android microphone permission remains blocked.
- No advertising SDK or advertising identifier is used.
- Child profile name and age remain device-only and are removed before provider requests.
- Optional parent accounts/cloud backup remain accurately disclosed.
- The final privacy URL returns HTTP 200 on the exact submitted release.
- All enabled providers and diagnostic SDKs are included below.

## Apple App Privacy — proposed answers

| Data category | Proposed answer | Purpose/notes |
|---|---|---|
| Email Address | Collected, optional, linked to parent account, not tracking | Supabase Auth and account management |
| User ID | Collected, optional, linked, not tracking | Authentication and owner-scoped cloud sync |
| Other User Content | Collected, potentially linked, not tracking | Hero text, Mad Lib text, prompts, generated stories, optional backup; free text may contain PI |
| Audio Data | Not collected in this release | Voice disabled and microphone blocked |
| Crash Data | Collected only when production Sentry DSN is enabled | Diagnostics; requires Sentry scrub/retention evidence |
| Performance Data | Collected only when Sentry tracing is enabled | Production trace sampling is configured when DSN exists |
| Other Diagnostic Data | Collected | Security, request status, timing, provider health and error operations |
| Photos or Videos | Pending exact-build verification | Image picker dependency exists; verify whether uploads leave device |
| Precise/Coarse Location | Not intended; pending exact-build verification | `expo-location` dependency exists; prove no permission/request path |
| Advertising Data | Not collected | No advertising SDK identified |
| Purchases/Financial/Health/Contacts | No identified collection | Recheck native dependency manifest before submission |

**Tracking:** proposed answer is **No**. This remains valid only if providers and diagnostics are not used for advertising or cross-company tracking.

**Kids Category:** the release owner must select and document the applicable child age band and review all third-party SDKs under Apple Kids requirements.

## Google Play Data Safety — proposed answers

| Data type | Proposed answer | Purpose/notes |
|---|---|---|
| Email address | Collected optionally; processed by Supabase | Account management and optional backup |
| User IDs | Collected optionally | Authentication, security, owner-scoped sync |
| User-generated content/messages | Collected and processed by AI providers; optionally backed up | App functionality; free text may contain PI |
| App interactions | Collected when cloud progress/sync or diagnostics are enabled | App functionality and reliability |
| Crash logs/performance diagnostics | Collected if Sentry is enabled | Diagnostics; attach retention and scrubbing proof |
| Other diagnostics | Collected | Security, fraud prevention, reliability |
| Audio/voice recordings | Not collected in current release | Voice disabled; microphone permission blocked |
| Photos/videos | Pending exact-build verification | Verify image-picker behavior and destinations |
| Location | Not intended; pending exact-build verification | Prove no runtime permission or collection path |
| Device/advertising IDs | No advertising ID intended | Confirm exact SDK manifest and operational identifiers |
| Financial information/purchases | No identified collection | No commerce flow identified |

The Target Audience and Content answers must identify the app as child-directed. The Families declaration must include every enabled SDK/API and the no-advertising/no-audio posture.

## Providers and SDKs to review

- Supabase: parent authentication and optional cloud backup.
- Vercel/hosting infrastructure: API hosting and operational metadata.
- Anthropic, Google Gemini, OpenAI: direct AI processing when configured.
- OpenRouter and selected endpoint providers: routed AI processing.
- ElevenLabs: narration when configured.
- Sentry: crash/performance diagnostics when configured.
- Expo/React Native platform dependencies in the submitted native artifact.

## Required Apple evidence

- App/version record.
- Privacy URL returning HTTP 200.
- App Privacy answers export or screenshots.
- Kids Category/age-band decision.
- Submission timestamp and authorized reviewer.
- App Review correspondence and resolution, if any.

## Required Google evidence

- App/release-track record.
- Target Audience and Content export.
- Data Safety export or screenshots.
- Families declarations and SDK list.
- IARC result.
- Submission timestamp and authorized reviewer.
- Policy correspondence and resolution, if any.

## Official guidance

- Apple: `https://developer.apple.com/help/app-store-connect/manage-app-privacy/overview-of-app-privacy-details/`
- Apple Kids: `https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/`
- Google Data Safety: `https://support.google.com/googleplay/android-developer/answer/10787469`
- Google Families: `https://support.google.com/googleplay/android-developer/answer/9893335`

## Decision

**BLOCKED.** The proposed answers are ready for exact-build verification, privacy review, and authorized console submission. No submission receipt is present.
