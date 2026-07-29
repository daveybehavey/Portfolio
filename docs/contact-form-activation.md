# Contact form activation runbook

This runbook activates the source merged in PR #9 without weakening the repository's deployment boundary.

## Safety boundary

The contact form remains disabled unless both the public Turnstile sitekey is included in the static build and the Pages Function receives all required runtime configuration.

Do not perform any of these actions without explicit authorization immediately before the action:

- create or change DNS records
- authorize Resend to change Cloudflare DNS through Domain Connect
- create or rotate production Turnstile credentials
- create or change Cloudflare Pages variables or secrets
- deploy a preview or production build
- change Cloudflare email routing

Never paste secret values into GitHub, issue comments, pull requests, CI, screenshots, browser JavaScript, or build logs.

## Official references

- [Cloudflare Pages environment variables and secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages local development](https://developers.cloudflare.com/pages/functions/local-development/)
- [Cloudflare Turnstile testing credentials](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Resend domain management](https://resend.com/docs/dashboard/domains/introduction)
- [Resend domain setup with Cloudflare](https://resend.com/docs/knowledge-base/cloudflare)
- [Resend safe testing addresses](https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing)

## Phase 1 — confirm current state

Record the following before any provider or Cloudflare change:

- current `main` SHA
- current production deployment identifier and timestamp
- current Pages project name and production branch
- current custom domains attached to the Pages project
- current build command and output directory
- current production and preview variables by **name only**
- current Cloudflare Email Routing status for `contact@eurodigital.ca`
- rollback deployment identifier

Do not record secret values. Cloudflare secrets cannot be read after creation and should be treated as write-only.

## Phase 2 — prepare a Resend testing path

1. Create or confirm the Resend account.
2. Create a narrowly scoped API key for this form.
3. Do not verify or modify DNS yet.
4. For preview testing, use Resend's testing sender and delivery event addresses:
   - sender: `EuroDigital Preview <onboarding@resend.dev>`
   - recipient: `delivered@resend.dev`
5. Keep the API key only in approved secret storage or a temporary ignored local environment file.

The `delivered@resend.dev` address simulates delivery without sending to a real inbox. It is used only for preview validation.

## Phase 3 — prepare Turnstile testing credentials

Use Cloudflare's documented always-pass testing pair for local and preview testing:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

These are public testing credentials, not production credentials. Never use them in production.

The official always-pass test sitekey produces Cloudflare’s documented dummy token (`XXXX.DUMMY.TOKEN.XXXX`). The contact handler still sends that token to Cloudflare Siteverify and requires `success: true`. Dummy Siteverify responses may return non-production hostname/action metadata (for example `hostname: "example.com"` and a missing or non-`contact` action). Those metadata fields are **not** guaranteed to equal `127.0.0.1` / `contact`.

The application skips **only** the hostname and action metadata checks when **all four** safeguards match:

1. exact official always-pass test secret;
2. exact official dummy token;
3. sender mailbox `onboarding@resend.dev`;
4. recipient mailbox `delivered@resend.dev`.

Any other combination keeps the strict production rules: non-empty hostname, hostname in `TURNSTILE_ALLOWED_HOSTNAMES`, and action exactly `contact`. Production preflight rejects all documented Cloudflare test credentials.

Production requires a separate Turnstile widget restricted to the exact production hostnames. Do not add `localhost` or preview hosts to the production widget.

## Phase 4 — local configuration preflight

Create ignored local files from the safe examples. Do not commit them.

Example `.env.local`:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

Example `.dev.vars`:

```env
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RESEND_API_KEY=<approved-preview-api-key>
CONTACT_FROM_EMAIL=EuroDigital Preview <onboarding@resend.dev>
CONTACT_TO_EMAIL=delivered@resend.dev
CONTACT_ALLOWED_ORIGINS=http://127.0.0.1:8788
TURNSTILE_ALLOWED_HOSTNAMES=127.0.0.1
```

Run the preflight without printing values:

```powershell
npm run contact:preflight -- --mode test --env-file .env.local --env-file .dev.vars
```

Expected result: zero failed checks.

Build and start Pages locally:

```powershell
npm run build
npm run pages:preview
```

Wrangler serves static assets and Pages Functions together, normally at `http://127.0.0.1:8788` or the URL it prints.

Run non-delivery smoke checks using the exact host and port Wrangler printed:

```powershell
npm run contact:smoke -- --url http://127.0.0.1:8788 --allow-host 127.0.0.1:8788
```

The smoke command sends deliberately invalid requests only. It never supplies a valid Turnstile token or a valid delivery payload.

## Phase 5 — local browser checks

Using the official test credentials and Resend testing recipient:

1. Load the contact section with JavaScript enabled.
2. Confirm all fields have visible labels and keyboard focus indicators.
3. Complete the Turnstile test widget using keyboard navigation.
4. Submit one test inquiry.
5. Confirm the pending state is announced.
6. Confirm the success message is announced only after the server returns success.
7. Confirm Resend records the `delivered@resend.dev` test event.
8. Confirm no real mailbox receives a message.
9. Confirm a second click during the pending state cannot create another request.
10. Test expiry, script blocking, offline mode, malformed input, and provider failure behavior.
11. Confirm the direct email fallback remains visible and usable.
12. Confirm browser and Function logs contain no message body, email address, token, or secret.

## Phase 6 — approved preview environment

A preview deployment changes the Cloudflare Pages project and therefore requires explicit authorization immediately before configuration or deployment.

### Committed non-secret Preview variables

[`wrangler.jsonc`](../wrangler.jsonc) is the source of truth for non-secret Pages settings. Cloudflare Pages applies top-level `vars` to local and Production; `env.preview.vars` overrides Preview. Do not use an `env.production` block. The file is loaded with a maintained JSONC parser (inline comments and trailing commas are valid). Guarded build/deploy helpers spawn with `shell: false`; on Windows they run `npm`/`npx` through Node’s CLI scripts so spaced `--commit-message` values and shell metacharacters remain single arguments. Preview plain-text overrides are versioned under `env.preview.vars`:

| Name | Type | Preview value |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | plain text (committed) | `1x00000000000000000000AA` |
| `CONTACT_FROM_EMAIL` | plain text (committed) | `EuroDigital Preview <onboarding@resend.dev>` |
| `CONTACT_TO_EMAIL` | plain text (committed) | `delivered@resend.dev` |
| `CONTACT_ALLOWED_ORIGINS` | plain text (committed) | `https://contact-preview.eurodigital-ca.pages.dev` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | plain text (committed) | `contact-preview.eurodigital-ca.pages.dev` |

Encrypted secrets remain dashboard-managed only:

| Name | Type | Preview value |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | encrypted secret | official always-pass test secret key |
| `RESEND_API_KEY` | encrypted secret | narrowly scoped Resend API key |

Do not commit secret values. Do not deploy with a bare `wrangler pages deploy out` command that omits the committed configuration — a direct upload can replace Pages configuration and silently drop required plain-text variables.

Authorized Preview commands:

```powershell
npm run pages:preview:build
npm run pages:preview:deploy -- --dry-run
npm run pages:preview:deploy
```

`npm run pages:preview:build` remains useful for local inspection, but it is **not** artifact-integrity evidence for deployment. Preview deploy always creates and verifies its own artifact before Wrangler: validate `wrangler.jsonc`, require branch `contact-preview`, enforce a clean working tree (no tracked changes and no non-ignored untracked files), run the Preview build, rescan `out/` with Preview expectations (test sitekey present; production sitekey absent; `_routes.json` includes `/api/contact`), re-check that Git branch/HEAD/tree are unchanged, then invoke Wrangler. Neither Preview nor Production may upload an arbitrary pre-existing `out/`. A Preview `--dry-run` exercises that full path and stops before any Cloudflare request.

The deploy guard requires project `eurodigital-ca`, environment `preview`, current git branch `contact-preview`, and Wrangler deploy branch `contact-preview`. It uses committed `wrangler.jsonc` (`--config=wrangler.jsonc`).

Run the test-mode preflight against a temporary ignored file containing the intended names and values before entering secrets into Cloudflare.

After an explicitly authorized preview deployment, run:

```powershell
npm run contact:smoke -- --url https://contact-preview.eurodigital-ca.pages.dev --allow-host contact-preview.eurodigital-ca.pages.dev
```

Then repeat the browser checks from Phase 5.

Do not move to production if any expected status, header, browser state, Resend event, or privacy behavior differs from the reviewed implementation.

## Phase 7 — production provider preparation

### Resend domain

Resend recommends a dedicated sending subdomain to separate sending reputation. Choose an approved project-controlled subdomain, then use only the DNS records displayed by Resend.

Before changing DNS:

1. Record every proposed record, name, type, target, priority, and proxy state.
2. Check for conflicts with existing Cloudflare Email Routing and MX records.
3. Confirm the sending setup does not change receipt of `contact@eurodigital.ca`.
4. Obtain explicit authorization for the exact DNS mutations.
5. Prefer DNS-only status where Resend requires it.
6. Wait for SPF and DKIM verification in Resend.
7. Add DMARC only through a separately reviewed DNS change when appropriate.

Do not enable Resend inbound email for the sending subdomain unless a separate inbound-mail design is approved.

### Production Turnstile widget

Create a separate production widget with only the required hostnames:

- `eurodigital.ca`
- `www.eurodigital.ca` only if that hostname serves the form directly

Use the reviewed `contact` action. Record the widget name and allowed hostnames, but never record the secret key in GitHub.

## Phase 8 — production configuration preflight

Before entering production values into Cloudflare, assemble them through an approved local secret method or a temporary ignored file with restrictive local permissions.

Run:

```powershell
npm run contact:preflight -- --mode production --env-file <temporary-ignored-file>
```

Production preflight requires:

- no documented Turnstile testing key
- a plausible Resend API key
- a sender on a project-controlled domain, not `resend.dev`
- recipient exactly `contact@eurodigital.ca`
- exact HTTPS production origins
- Turnstile hostname alignment with every allowed origin

Delete the temporary file after configuration and verification.

## Phase 9 — production Pages variables and secrets

Committed Production plain-text variables live in top-level `vars` in [`wrangler.jsonc`](../wrangler.jsonc) (not under `env.production`):

| Name | Type | Requirement |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | plain text (committed) | `0x4AAAAAAEAJbd2XaAk7ZRBR` |
| `CONTACT_FROM_EMAIL` | plain text (committed) | `EuroDigital <website@send.eurodigital.ca>` |
| `CONTACT_TO_EMAIL` | plain text (committed) | `contact@eurodigital.ca` |
| `CONTACT_ALLOWED_ORIGINS` | plain text (committed) | `https://eurodigital.ca,https://www.eurodigital.ca` |
| `TURNSTILE_ALLOWED_HOSTNAMES` | plain text (committed) | `eurodigital.ca,www.eurodigital.ca` |

With explicit authorization immediately before the change, configure **only** the encrypted Production secrets in the Cloudflare dashboard:

| Name | Type | Requirement |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | encrypted secret | production widget secret |
| `RESEND_API_KEY` | encrypted secret | narrowly scoped production API key |

Cloudflare requires a redeployment for changed Pages variables and secrets to take effect. Deploy only through the guarded package commands that use the committed Wrangler configuration.

Do not add secrets to a Wrangler configuration file, GitHub Actions, or repository settings for this manual activation.

## Phase 10 — final deployment gate

Immediately before production deployment, record:

- exact `main` SHA
- passing CI run for that SHA
- exact source diff since the current production deployment
- Pages project and branch
- production variable names present
- Resend domain verification status
- Turnstile widget hostname list
- preview test evidence
- rollback deployment identifier
- explicit authorization for the production deployment

Then use only the guarded production path:

```powershell
npm run pages:production:preflight
npm run pages:production:deploy -- --expected-sha <exact-main-sha> --authorize-production-deploy
```

`npm run pages:production:build` remains available for local inspection, but it is **not** authorization or integrity evidence for deployment. Production deploy always creates and verifies its own artifact before Wrangler: validate `wrangler.jsonc`, enforce a clean working tree (no tracked changes and no non-ignored untracked files), run the production build, rescan `out/` (production sitekey present; test sitekeys and secret-shaped values absent; `_routes.json` includes `/api/contact`), re-check Git state, then invoke Wrangler. Ignored build output such as `out/` is permitted because Git omits it from porcelain status. Do not add broad production-guard exceptions for local evidence directories — move them outside the repo or use a narrow local `.git/info/exclude` entry.

The production deploy guard requires: branch `main`, clean working tree under that strengthened definition, `HEAD == origin/main`, matching `--expected-sha`, project `eurodigital-ca`, and the one-time `--authorize-production-deploy` flag. Do not improvise a bare `wrangler pages deploy out` command.

A production `--dry-run` exercises the full artifact preparation and verification path and stops before any Cloudflare request.

This repository does **not** claim Production secrets are already configured or that Production has been redeployed with the contact form.

## Phase 11 — production verification

After deployment:

1. Run non-delivery smoke checks against the exact production host:

   ```powershell
   npm run contact:smoke -- --url https://eurodigital.ca --allow-host eurodigital.ca
   ```

2. Load the production form in a normal browser and a private window.
3. Submit one controlled inquiry with a unique non-sensitive marker.
4. Confirm the message reaches `contact@eurodigital.ca` once.
5. Confirm the trusted sender uses the verified production domain.
6. Confirm the visitor address appears only as `reply_to`.
7. Reply to confirm normal reply behavior.
8. Confirm success analytics occurs once and only after delivery.
9. Test blocked Turnstile, expired token, offline mode, and provider-error presentation.
10. Confirm static pages and assets remain outside Function execution.
11. Inspect logs for status and provider health only; do not add personal-data logging.

Keep issue #8 open until this evidence is recorded.

## Rollback

Use the fastest safe rollback appropriate to the failure:

### Disable online submission while preserving contact

Remove or blank `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the production build environment and redeploy the last reviewed source. The form will fail closed and retain the direct email link.

### Revert the deployment

Restore the recorded prior Cloudflare Pages deployment. Current rollback baseline:

```text
f0ddd72c-3740-4340-a9f7-4e98b63cf807
```

Verify the homepage, projects, privacy page, and mailto fallback afterward.

### Revoke provider access

If credentials may be exposed:

1. Rotate or revoke the Resend API key.
2. Rotate the Turnstile secret key.
3. Update Cloudflare secrets only after new credentials are ready.
4. Redeploy and verify.

Do not delete DNS records during an incident unless the exact effect on SPF, DKIM, email routing, and rollback is understood and separately authorized.

## Completion evidence for issue #8

Record only non-secret evidence:

- source and deployment SHAs
- CI run URL and result
- provider/domain verification status
- Turnstile widget name and hostname list
- variable and secret **names** configured
- preview URL and smoke result
- production smoke result
- controlled delivery timestamp and non-sensitive marker
- rollback identifier
- confirmation that no secret value entered GitHub or logs
