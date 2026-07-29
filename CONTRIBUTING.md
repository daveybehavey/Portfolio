# Contributing to EuroDigital.ca

## Required runtime

Use the exact repository pins before installing dependencies:

- Node.js `22.17.1` from `.nvmrc` / `.node-version`
- npm `10.9.2` from `package.json`

## Local verification

Run the same checks used by GitHub Actions from a clean checkout without `.env.local`:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
node scripts/verify-static-export.mjs
npm audit --omit=dev --audit-level=high
```

The build currently uses `next/font/google`, so it requires outbound network access. A network failure must remain visible rather than being bypassed or silently ignored.

## Contact Function development

The public pages remain a static Next.js export. `functions/api/contact.js` is the only Pages Function route, and `public/_routes.json` restricts Function invocation to `/api/contact`.

The provider-independent unit tests use Node's built-in test runner and mock both external services. CI must not require or receive production credentials.

The online form is disabled when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is absent, while the direct `mailto:` fallback remains available. Production activation requires a separate reviewed setup with:

- a production Turnstile site key restricted to approved hostnames
- `TURNSTILE_SECRET_KEY` in Cloudflare Pages secret storage
- a verified Resend sending domain and sender address
- `RESEND_API_KEY` in Cloudflare Pages secret storage
- fixed `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` values
- exact `CONTACT_ALLOWED_ORIGINS` and expected Turnstile hostnames

Never place secret values in GitHub, `.env.example`, build output, browser JavaScript, CI logs, issue comments, or pull-request text. Use Cloudflare's documented Turnstile test keys for preview and automated verification, not production keys.

## Pull-request CI

`.github/workflows/ci.yml` runs automatically for pull requests targeting `main` and for pushes to `main`. It:

1. Checks out the repository with persisted credentials disabled.
2. Reads the exact Node.js version from `.nvmrc`.
3. Installs and verifies npm `10.9.2`.
4. Runs `npm ci`.
5. Runs lint and TypeScript checks.
6. Runs provider-independent unit tests.
7. Builds the static export.
8. Verifies the required non-empty files in `out/`, including `_routes.json`.
9. Audits production dependencies and fails for high or critical findings.

The audit gate is intentionally scoped to `npm audit --omit=dev --audit-level=high`. Development-tool advisories should still be reviewed and tracked, but they do not block this production-dependency gate unless they affect the deployed static output or build integrity.

## CI security and deployment boundary

The CI workflow is verification-only:

- repository permissions are read-only (`contents: read`)
- no repository, environment, email-provider, Turnstile, or Cloudflare secrets are requested
- no `pull_request_target` or manual deployment trigger is present
- no artifacts are uploaded
- no Wrangler deploy, Cloudflare API, DNS, email-routing, or Pages mutation command is executed
- `npm run pages:preview:deploy` and `npm run pages:production:deploy` are never invoked
- Preview and Production deploy guards in source require an in-command artifact build/rescan and reject dirty or non-ignored untracked working trees; CI still never executes those deploy commands
- committed `wrangler.jsonc` uses top-level `vars` for Production/local and `env.preview.vars` for Preview (no `env.production`)
- action dependencies are pinned to immutable full commit SHAs
- superseded runs for the same pull request or branch are cancelled

A successful CI run does **not** deploy the website or activate the inquiry endpoint. Production changes require a separate reviewed process and explicit authorization immediately before secret configuration and deployment. Separately run Preview or Production builds are not authorization or integrity evidence for deployment. Dry-runs prepare and verify artifacts without a Cloudflare request. Deploying without the committed Wrangler configuration is prohibited.

## Review sequence

Before merging a pull request:

1. Confirm the workflow ran against the current head SHA.
2. Require every CI step to pass.
3. Review the exact changed files and unresolved review threads.
4. Confirm no deployment path, secret lookup, or Cloudflare mutation was introduced.
5. For contact changes, confirm origin checks, server-side Turnstile validation, fixed recipient/sender values, escaped email content, idempotency, request limits, privacy copy, and mailto fallback.
6. Merge only the reviewed head SHA.
7. Treat deployment and production secret configuration as separate explicitly authorized actions.
