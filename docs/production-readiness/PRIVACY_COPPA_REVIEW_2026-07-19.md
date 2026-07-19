# Privacy and COPPA Review — 2026-07-19

**Application:** Infinity Heroes: Bedtime Chronicles  
**Audience:** Privacy counsel, release owner, Apple/Google reviewers  
**Supersedes for release decisions:** `docs/COPPA-COMPLIANCE.md` dated 2026-04-08  
**Release track:** PR #377 / issue #376  
**Result:** **TECHNICAL REVIEW COMPLETE; FINAL LEGAL REVIEW BLOCKED**

> This document is an engineering and privacy-readiness assessment, not legal advice. Only qualified counsel or the accountable privacy owner may approve the final COPPA position.

## Executive conclusion

The current candidate is materially safer than the April audit:

- explicit child profile name and age remain on device and are discarded at the server boundary;
- Voice Chat is disabled, microphone permission is blocked, and no current client audio path exists;
- protected features are gated behind a parent-facing consent record tied to an exact disclosure hash/version;
- account deletion removes PostgreSQL chat records, Supabase Auth identity, and cloud-sync records before local device cleanup;
- child-facing AI output uses server-authoritative safety controls; and
- a current parent-facing privacy notice exists and is now served from bundled source rather than a serverless filesystem path.

The candidate still cannot receive final privacy/COPPA approval because:

1. no independent counsel approval is attached;
2. public provider terms are not account-specific DPA/configuration evidence;
3. free-text hero descriptions, hero names, Mad Lib words, feedback, and generated story content may contain personal information even though explicit profile fields are stripped;
4. the arithmetic grown-up gate is a barrier but is not, by itself, an enumerated high-assurance verifiable parental-consent method;
5. Sentry is conditionally enabled without attached scrubbing/retention proof; and
6. Apple and Google disclosures have not been submitted and accepted.

## Current product and audience

- The app is directed to children, described in repository material as ages 3–9.
- iOS bundle identifier and Android package are `com.infinityheroes.bedtime`.
- Android explicitly blocks `android.permission.RECORD_AUDIO`.
- Voice Chat and video are disabled in the observed PR preview.
- The app has optional parent authentication and cloud backup.
- There are no advertising SDKs or social/stranger messaging features identified in the current dependency and route review.

Because the product is child-directed, COPPA applies to covered collection and processing; the release cannot rely on a general-audience posture.

## Data-flow assessment

| Data | Location/recipient | Current control | Review status |
|---|---|---|---|
| Child profile name and age | Device AsyncStorage | Removed from server/provider payload construction | **PASS — code control** |
| Parent email/auth identifier | Supabase Auth | Optional parent account; owner-scoped auth | **PENDING — DPA/account evidence** |
| Stories/progress/profile stub | Device; optional Supabase sync | RLS, owner predicates, deletion cascade; cloud stub excludes child name/age | **PASS code / PENDING live isolation** |
| Hero name/description and Mad Lib text | AI provider prompts | Length/safety validation; not guaranteed to be non-PII | **HIGH-RISK OPEN ITEM** |
| Generated stories/images | Device; providers during generation; optional cloud backup | Auth, moderation, optional sync | **PENDING provider/store disclosure** |
| Narration text/audio | ElevenLabs only when configured; local/server cache as implemented | TTS not configured in observed preview | **BLOCKED agreement/config evidence** |
| Voice audio/transcripts | Disabled in current client release; legacy transcripts may remain until deletion/retention purge | Permission blocked, feature flag false, retention/delete controls | **PASS containment / future enablement forbidden** |
| Error/diagnostic data | Sentry when DSN configured; server logs | Conditional SDK initialization; no attached production scrub proof | **BLOCKED** |
| Network metadata | Hosting/providers | Operational necessity | **PENDING final disclosures/retention** |

## Notice and consent review

### Notice

The bundled `/privacy` notice discloses:

- device-local child profile information;
- optional parent account and cloud backup;
- AI/provider processing;
- disabled Voice Chat posture;
- legacy transcript retention;
- deletion rights;
- no targeted advertising or behavioral profiling; and
- a privacy contact address.

The notice must be smoke-tested at the exact final deployment and its published URL entered into App Store Connect and Google Play Console.

### Consent

The repository records consent version, exact disclosure hash, timestamp, locale, and parent-gate method. Material disclosure changes invalidate previous consent.

The current arithmetic grown-up gate should not be described as conclusively satisfying every verifiable-parental-consent scenario. Counsel must decide whether the data-minimization posture means the app may rely on notice/consent appropriate to its actual collection, or whether a higher-assurance method is required. No release artifact may label this legal question `PASS` without named human approval.

## Required remediation before legal approval

1. **Provider evidence:** complete every row in `PROVIDER_AGREEMENTS_AND_CONFIGURATION_EVIDENCE.md`.
2. **Free-text PI decision:** counsel and product owner must choose and document one of:
   - prohibit personal information in all free-text fields with clear parent-facing copy and enforceable validation/redaction;
   - remove free-text fields from child-facing flows; or
   - retain them and approve the necessary VPC/provider/store disclosures.
3. **Sentry:** prove `beforeSend`/scrubbing removes auth tokens, emails, story content, profile values, prompts, and sync payloads; attach retention/DPA evidence.
4. **Retention:** document operational log, Sentry, provider, cloud backup, narration cache, and legacy transcript periods in one retention schedule.
5. **Deletion:** complete the authenticated physical-device test in `DELETION_E2E_PROTOCOL.md`.
6. **Store forms:** submit the exact mappings in `APPLE_GOOGLE_DATA_DISCLOSURE_PACKET.md` and attach confirmation records.
7. **Publication:** verify `/privacy` on the final production SHA, not a preview or historical deployment.

## Counsel approval block

The following fields must be completed by a qualified reviewer. An automated agent must not fill them.

- Reviewer name and role: **PENDING**
- Organization/firm: **PENDING**
- Review date: **PENDING**
- Documents reviewed: **PENDING**
- Approved jurisdictions/storefronts: **PENDING**
- VPC determination and rationale: **PENDING**
- Free-text personal-information determination: **PENDING**
- Provider/subprocessor approval: **PENDING**
- Required notice changes: **PENDING**
- Final decision: **BLOCKED**

## Authoritative regulatory references

- FTC COPPA overview and amended Rule: `https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy`
- FTC six-step compliance plan: `https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business`
- FTC COPPA FAQ: `https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions`

## Release decision

**NO GO.** Technical controls reduce risk but do not constitute final legal approval, provider acceptance, store submission, or physical-device evidence.
