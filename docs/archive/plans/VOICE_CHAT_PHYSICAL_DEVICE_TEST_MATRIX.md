# Voice Chat Physical-Device Test Matrix

**Prepared:** 2026-07-19  
**Release track:** PR #377 / issue #376  
**Current release posture:** Voice Chat disabled  
**Execution status:** **PHYSICAL-DEVICE RUN NOT PERFORMED**

## Current-release acceptance rule

The current release receives Voice Chat containment credit only when the exact signed iOS and Android artifacts prove:

- no Voice Chat navigation entry or actionable control;
- no microphone permission declaration or runtime prompt;
- no recording, upload, transcription, transcript-fetch, or audio-response network request;
- `/api/health` reports `voiceChatEnabled: false`;
- Voice Chat API routes return unavailable/not found and do not process audio; and
- app-store disclosures state that audio is not collected.

The observed PR #377 preview reported `voiceChatEnabled: false`, `ttsAvailable: false`, and no live TTS probe. That is server-preview evidence only, not physical-device evidence, and became stale when the branch changed.

## Required device matrix

| Platform | Required devices | OS coverage | Status |
|---|---|---|---|
| iOS | One current iPhone and one oldest-supported iPhone | Current iOS and minimum supported iOS | **BLOCKED — no device/lab session** |
| Android | One Google/Samsung-class device and one lower-memory device | Current Android and minimum supported Android | **BLOCKED — no device/lab session** |

Record model, OS version, build artifact ID, commit SHA, tester, timestamp, network type, and screen recording for every run.

## Containment tests for the current release

| ID | Test | Expected result | Evidence | Status |
|---|---|---|---|---|
| VC-C01 | Fresh install and onboarding | No microphone prompt; no Voice Chat entry point | Video + permission manifest | PENDING |
| VC-C02 | Upgrade from a historical build that exposed Voice Chat | Old navigation cannot open a recording surface; no audio request | Video + proxy capture | PENDING |
| VC-C03 | Deep-link and restored-navigation attempts to historical Voice Chat routes | Route rejected or redirected safely | Video + logs | PENDING |
| VC-C04 | Inspect native permissions after install | Android lacks RECORD_AUDIO; iOS lacks microphone usage description | Manifest/export | PENDING |
| VC-C05 | Network capture during all child/parent flows | No audio upload, transcription, conversation fetch, or provider audio endpoint | Redacted HAR/proxy report | PENDING |
| VC-C06 | Backend route probe | Audio routes unavailable while feature/compliance gate is false | HTTP evidence tied to SHA | PENDING |
| VC-C07 | App Store/Play disclosure comparison | Submitted forms say audio not collected | Store export | PENDING |

## Tests required before any future Voice Chat release

Voice Chat must not be enabled merely because configuration flags or credentials exist. A future release requires a new consent version and all tests below.

### Adversarial content

- Self-harm, violence, sexual content, grooming, drugs, weapons, hate, bullying, requests for secrets, and attempts to override the child-safety policy.
- Indirect or coded phrasing, role-play, quoted unsafe content, multilingual prompts, and background speech.
- Prompt injection embedded in spoken stories or replayed audio.
- Verify the complete text response passes moderation before any narration begins.

### Interruption and lifecycle

- Parent/child interrupts during recording, transcription, generation, and playback.
- Incoming call, audio focus loss, Bluetooth disconnect, screen lock, background/foreground, app kill, network handoff, airplane mode, and low-memory termination.
- Verify recording stops, temporary files are removed, no duplicate request is created, and UI state recovers without replaying private audio.

### Latency

Capture p50/p95/p99 for:

- recording stop to upload complete;
- upload to transcription;
- transcription to safe text completion;
- moderation completion;
- approved text to first audio byte; and
- end-to-end response.

Set product-approved budgets before testing. Averages alone are insufficient.

### Provider and dependency failures

- OpenAI unavailable, timeout, 429, 5xx, malformed response, moderation failure, and TTS failure.
- PostgreSQL unavailable or slow.
- Authentication expired/revoked.
- Partial upload and duplicate retry.
- Compliance flag missing after app launch.
- Retention job unavailable.

Expected behavior is fail closed with a parent/child-safe error; no unmoderated partial text/audio, transcript persistence after a failed request, or fallback to an unapproved provider.

## Evidence bundle structure

For each case attach:

- exact app artifact/build ID and Git commit SHA;
- device/OS/build configuration;
- test steps and expected/actual outcome;
- timestamps and measured latency;
- screen recording;
- redacted network/log capture;
- cleanup verification;
- tester and independent reviewer;
- defect link for any deviation.

## Decision

**CURRENT RELEASE:** Voice Chat remains disabled. Physical-device containment evidence is still required before release approval.  
**FUTURE VOICE RELEASE:** **NO GO** until every future-enable test passes and provider/legal/store approvals are renewed.
