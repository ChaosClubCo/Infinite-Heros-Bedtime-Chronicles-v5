# Provider Agreements and Configuration Evidence

**Evidence date:** 2026-07-19  
**Canonical repository:** `ChaosClubCo/Infinite-Heros-Bedtime-Chronicles-v5`  
**Release track:** PR #377 / issue #376  
**Candidate:** UNFROZEN — evidence must be regenerated for the reviewed merge SHA  
**Release posture:** **NO GO**

## Evidence rules

A public terms page is not proof that the production account accepted the applicable terms, has a DPA in force, uses a production-eligible plan, or has the required retention/training controls enabled. A provider receives `PASS` only when the repository contains a redacted, account-specific artifact that identifies:

1. the contracting organization;
2. the applicable agreement/DPA and effective or acceptance date;
3. the production account, workspace, project, or organization identifier;
4. the relevant retention, training, logging, and regional settings;
5. approval for this child-directed use case where the provider requires review; and
6. an independent reviewer and timestamp.

API keys and secret values must never be committed. Screenshots must redact full keys while preserving provider, organization, environment, setting names, and timestamps.

## Actual production fallback chain

| Capability | Ordered providers/models | Configuration source |
|---|---|---|
| Story text | Anthropic → Gemini → OpenAI → Meta Llama through OpenRouter → xAI through OpenRouter → Mistral through OpenRouter → Cohere through OpenRouter | `server/ai/router.ts`, `server/ai/index.ts` |
| Suggestions | Gemini → Mistral through OpenRouter → Anthropic → Meta Llama through OpenRouter → xAI through OpenRouter → Cohere through OpenRouter | `server/ai/router.ts` |
| Images/avatar/scene | Gemini → OpenAI | `server/ai/router.ts` |
| Narration | ElevenLabs | `server/elevenlabs.ts`, `server/routes/tts.ts` |
| Voice Chat | OpenAI transcription/text/TTS path, currently disabled | `server/routes.ts`, feature flags, mobile permissions |
| Authentication/cloud backup | Supabase | `lib/AuthContext.tsx`, `supabase/migrations/*` |

The PR #377 preview health response for head `e3b815b09d9827aebed99e48d42e00c7d3bffca8` showed at least one AI provider configured, ElevenLabs unavailable, Voice Chat disabled, video disabled, and all reported circuit breakers closed. That runtime observation became stale when later commits changed the branch and must be repeated for the final candidate.

## Provider ledger

| Provider | Public contractual material located | Code/configuration control | Account-specific evidence | Status |
|---|---|---|---|---|
| Anthropic API | Commercial DPA is incorporated into Anthropic commercial terms | Direct provider; first story fallback; provider health probe | No signed/accepted-account artifact found | **BLOCKED** |
| Google Gemini | Google Cloud DPA located; production must use an eligible generally available Google Cloud service, not an unapproved preview product | Direct text/image provider | No Cloud project, billing account, DPA acceptance, service/model GA, region, logging, or data-use screenshot found | **BLOCKED** |
| OpenAI API | Current Services Agreement and DPA located | Direct text/image fallback; required by Voice Chat if ever enabled | No organization/account agreement, DPA acceptance, retention approval, or project configuration artifact found | **BLOCKED** |
| OpenRouter | Current Terms/DPA references and privacy controls located | Requests now require `zdr: true` and `data_collection: "deny"` for every routed fallback | No organization settings screenshot proving prompt logging off, input/output use off, ZDR guardrail, provider/model allowlist, and production account ownership | **BLOCKED** |
| xAI via OpenRouter | xAI enterprise terms/DPA and ZDR documentation located; OpenRouter remains the direct contracting/routing layer | OpenRouter privacy constraints apply per request | No evidence that the chosen xAI endpoint is ZDR-compatible under the production OpenRouter account | **BLOCKED** |
| Mistral via OpenRouter | Current commercial terms and DPA located | OpenRouter privacy constraints apply per request | No endpoint-level ZDR/collection evidence or production account artifact | **BLOCKED** |
| Cohere via OpenRouter | Enterprise data commitments located; Cohere says a DPA must be requested for SaaS personal-data processing and ZDR requires approval | OpenRouter privacy constraints apply per request | No Cohere DPA/ZDR approval or proof that OpenRouter selects a compliant endpoint | **BLOCKED** |
| Meta Llama via OpenRouter | Model is accessed through OpenRouter; OpenRouter endpoint policy controls the actual inference provider | OpenRouter privacy constraints apply per request | No endpoint identity, provider terms, ZDR, region, or allowlist evidence | **BLOCKED** |
| ElevenLabs | Current DPA and speech service terms located | No key was present in the observed PR preview; Voice Chat disabled | No production account agreement, retention/deletion settings, data-use setting, or child-directed-use approval found | **BLOCKED / NOT CONFIGURED IN OBSERVED PREVIEW** |
| Supabase | Supabase project and disposable PR branch are connected; RLS and cascade behavior have repository and live branch evidence | Parent auth, cloud backup, deletion cascade | Account terms/DPA and production retention/security configuration have not been attached to this ledger | **BLOCKED** |
| Sentry | SDK is present and conditionally enabled by DSN | Client error reporting; sync errors may include structured `extra` context | No data-scrubbing configuration, retention setting, DPA, or store-disclosure evidence found | **BLOCKED** |

## Required account-specific artifacts

Create a private evidence folder outside the public mobile bundle and attach redacted exports or screenshots with checksums. The minimum artifact set is:

### Direct AI providers

- Organization/account/project identifier.
- Billing or production-plan status.
- Agreement/DPA acceptance or executed order form.
- Prompt/output training setting.
- Retention or zero-retention setting.
- Region/data residency where available.
- Model IDs and proof they are generally available for production.
- Child-directed use-case approval or written confirmation when required.

### OpenRouter

- Organization account identifier and administrator.
- Prompt logging disabled.
- OpenRouter use of inputs/outputs disabled.
- ZDR enabled for Anthropic, OpenAI, Google, and non-frontier model groups.
- Guardrail assigned to the production API key.
- Model allowlist limited to repository model IDs.
- Provider allowlist limited to reviewed endpoints.
- A provider-endpoint export showing each selected endpoint's ZDR and training policy.
- A successful production-like request log containing only request metadata, never prompt content.

The repository now enforces request-level `zdr: true` and `data_collection: "deny"`. This is defense in depth; it does not replace account-wide settings or account evidence.

### Supabase and Sentry

- Applicable DPA/terms acceptance.
- Organization/project identifiers.
- Data region and retention settings.
- Access-control owners and MFA evidence.
- Sentry event-scrubbing rules and a captured synthetic event proving no child name, story text, auth token, or email is transmitted.

## Public source register

These are reference materials only and do not receive release credit without account-specific acceptance/configuration evidence:

- OpenAI Services Agreement: `https://openai.com/policies/services-agreement/`
- OpenAI DPA: `https://openai.com/policies/data-processing-addendum/`
- Anthropic DPA acceptance guidance: `https://privacy.anthropic.com/en/articles/7996862-how-do-i-view-and-sign-your-data-processing-addendum-dpa`
- Google Cloud DPA: `https://cloud.google.com/terms/data-processing-addendum`
- Google generative AI preview terms: `https://cloud.google.com/terms/genai-preview-products`
- OpenRouter terms: `https://openrouter.ai/terms`
- OpenRouter ZDR: `https://openrouter.ai/docs/guides/features/zdr`
- OpenRouter provider logging: `https://openrouter.ai/docs/guides/privacy/provider-logging`
- xAI enterprise terms: `https://x.ai/legal/terms-of-service-enterprise`
- xAI DPA: `https://x.ai/legal/data-processing-addendum`
- Mistral commercial terms: `https://legal.mistral.ai/terms/commercial-terms-of-service`
- Mistral DPA: `https://legal.mistral.ai/terms/data-processing-addendum`
- Cohere enterprise data commitments: `https://cohere.com/enterprise-data-commitments`
- ElevenLabs DPA: `https://elevenlabs.io/dpa`
- ElevenLabs service-specific terms: `https://elevenlabs.io/service-specific-terms`

## Decision

No provider agreement row is independently complete. The production compliance booleans must remain false and Voice Chat must remain disabled. Provider configuration cannot receive release credit from the presence of an API key or a public terms URL.
