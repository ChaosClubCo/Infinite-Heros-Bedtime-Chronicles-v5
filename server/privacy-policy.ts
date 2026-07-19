export const PRIVACY_POLICY_HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="index,follow">
  <title>Privacy Policy — Infinity Heroes: Bedtime Chronicles</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f7f7fb; color: #202234; line-height: 1.65; }
    main { width: min(880px, calc(100% - 32px)); margin: 32px auto; padding: 36px; background: #fff; border: 1px solid #e4e5ef; border-radius: 18px; }
    h1, h2 { line-height: 1.2; color: #15172a; }
    h1 { margin-top: 0; font-size: clamp(2rem, 5vw, 3rem); }
    h2 { margin-top: 2rem; font-size: 1.35rem; }
    .subtitle { color: #61647a; }
    .highlight { padding: 18px; border-left: 4px solid #6657d9; background: #f0efff; border-radius: 8px; }
    a { color: #4938c8; }
    li + li { margin-top: .35rem; }
    footer { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e4e5ef; color: #61647a; font-size: .95rem; }
    @media (max-width: 600px) { main { margin: 0; width: 100%; border: 0; border-radius: 0; padding: 24px 18px; } }
  </style>
</head>
<body>
<main>
  <h1>Privacy Policy</h1>
  <p class="subtitle">Infinity Heroes: Bedtime Chronicles — Last updated: July 19, 2026</p>

  <div class="highlight">
    <strong>Summary for parents:</strong> Child profile name and age stay on the device and are discarded by the server before AI requests are built. A parent may create an optional account for cloud backup. Voice Chat is unavailable in this release: the app does not request microphone permission or send Voice Chat audio. Delete All Data removes the parent account, cloud records, retained legacy Voice Chat history, and local device data after server deletion succeeds.
  </div>

  <h2>1. Information we collect</h2>
  <p><strong>Stored on the device:</strong></p>
  <ul>
    <li>Child profiles, including name, age range, favorite hero, and avatar choices.</li>
    <li>Generated stories, illustrations, narration cache, badges, streaks, and achievements.</li>
    <li>App settings and parent controls, including the locally protected parent PIN.</li>
    <li>A parental-consent record containing the consent version, exact disclosure hash, acceptance time, locale, and parent-gate verification method.</li>
  </ul>

  <p><strong>Optional parent account and cloud backup:</strong></p>
  <ul>
    <li>A parent email address, account identifier, and authentication records are handled by Supabase.</li>
    <li>When cloud backup is enabled, stories and progress records are stored under the parent account.</li>
    <li>The cloud profile stub does not contain the child's name or age.</li>
  </ul>

  <p><strong>Sent to our services and approved providers:</strong></p>
  <ul>
    <li>Fictional hero details and parent-selected story preferences needed to create a story.</li>
    <li>Explicit child profile name and age fields are discarded by the server and are not included in story or suggestion provider prompts.</li>
    <li>Approved text for narration or other requested media generation.</li>
    <li>No Voice Chat audio is collected or sent by the current release.</li>
  </ul>

  <p><strong>Retained on our servers:</strong></p>
  <ul>
    <li>Cloud-backup records when the parent turns that feature on.</li>
    <li>Any legacy Voice Chat conversation titles and sanitized transcripts created by a previously approved build, until their retention period expires or the parent uses Delete All Data.</li>
    <li>Security, rate-limit, request, and error information needed to operate and protect the service.</li>
  </ul>
  <p>The current release does not intentionally collect or retain raw Voice Chat recordings. AI providers may process or retain other requested generation data according to the provider terms and agreements applicable to the production service.</p>

  <h2>2. How we use information</h2>
  <ul>
    <li>Generate bedtime stories, illustrations, and narration.</li>
    <li>Save and synchronize stories and progress when a parent enables cloud backup.</li>
    <li>Authenticate the parent account and enforce owner-only access.</li>
    <li>Prevent abuse, investigate errors, and protect service reliability.</li>
    <li>Verify that parental consent matches the exact current disclosure version.</li>
  </ul>
  <p>We do <strong>not</strong> use child information for targeted advertising, sale of personal information, or behavioral profiling.</p>

  <h2>3. Service providers</h2>
  <p>Depending on the feature and approved production configuration, providers may include Supabase for authentication and cloud storage; Anthropic Claude, Google Gemini, OpenAI, or approved OpenRouter-routed providers for text and image generation; ElevenLabs for narration; and infrastructure or error-monitoring providers.</p>
  <p>Voice Chat processing is not enabled for this release. Any future release that enables microphone or transcription processing requires separately recorded provider, privacy, retention, safety, device, and app-store approvals plus a new parental-consent version.</p>

  <h2>4. Children's privacy and parental consent</h2>
  <div class="highlight">
    <ul>
      <li>A parent or guardian must pass the grown-up gate and consent before protected app features are available.</li>
      <li>The consent record stores the current version, exact disclosure hash, timestamp, locale, and parent-gate method.</li>
      <li>Material disclosure changes invalidate older records and require renewed consent.</li>
      <li>Accounts and cloud backup are optional parent-controlled features.</li>
      <li>There are no public child profiles, stranger messaging, advertising networks, or social feeds.</li>
      <li>Child-facing AI responses are generated under a child-safety policy and checked before display or narration.</li>
      <li>Voice Chat is unavailable in this release and cannot receive release credit from configuration alone.</li>
    </ul>
  </div>

  <h2>5. Data retention</h2>
  <ul>
    <li><strong>Device data:</strong> remains until the parent deletes it, resets the app, or uninstalls the app.</li>
    <li><strong>Cloud backup:</strong> remains until deleted by the parent or the parent account is deleted.</li>
    <li><strong>Legacy Voice Chat transcripts:</strong> are automatically purged no later than 30 days after creation and are also removed by Delete All Data.</li>
    <li><strong>Parent authentication:</strong> remains until the parent account is deleted.</li>
    <li><strong>Operational and provider records:</strong> follow documented production settings and applicable provider agreements.</li>
  </ul>

  <h2>6. Parental rights</h2>
  <p>Parents and guardians can:</p>
  <ul>
    <li>Turn cloud backup off.</li>
    <li>Delete individual child profiles, stories, and progress records.</li>
    <li>Use Delete All Data to remove retained server data, the Supabase account and cloud records, and local device data.</li>
    <li>Receive a PII-free server deletion receipt that includes the deployed release identity.</li>
    <li>Withdraw consent and restart the parental-consent flow.</li>
    <li>Contact us to ask a privacy question or report a deletion problem.</li>
  </ul>

  <h2>7. Data security</h2>
  <p>We protect data in transit using HTTPS/TLS. Server endpoints use authentication, owner scoping, rate limiting, input validation, bounded context, and server-authoritative output safety checks. The current client contains no Voice Chat microphone, recording, transcript-fetch, or audio-message path.</p>

  <h2>8. Changes to this policy</h2>
  <p>We may update this policy as the service changes. The Last updated date at the top identifies the current version. Material changes to child-data practices require an updated parent-facing notice and renewed consent.</p>

  <h2>9. Contact us</h2>
  <p>For privacy questions or deletion problems, email <a href="mailto:privacy@bedtime-chronicles.com">privacy@bedtime-chronicles.com</a>.</p>

  <footer>This notice describes the current release configuration. It is not a substitute for independent legal advice or regulator guidance.</footer>
</main>
</body>
</html>`;
