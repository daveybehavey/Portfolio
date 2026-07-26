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
npm run build
node scripts/verify-static-export.mjs
npm audit --omit=dev --audit-level=high
```

The build currently uses `next/font/google`, so it requires outbound network access. A network failure must remain visible rather than being bypassed or silently ignored.

## Pull-request CI

`.github/workflows/ci.yml` runs automatically for pull requests targeting `main` and for pushes to `main`. It:

1. Checks out the repository with persisted credentials disabled.
2. Reads the exact Node.js version from `.nvmrc`.
3. Installs and verifies npm `10.9.2`.
4. Runs `npm ci`.
5. Runs lint and TypeScript checks.
6. builds the static export.
7. verifies the required non-empty files in `out/`.
8. audits production dependencies and fails for high or critical findings.

The audit gate is intentionally scoped to `npm audit --omit=dev --audit-level=high`. Development-tool advisories should still be reviewed and tracked, but they do not block this production-dependency gate unless they affect the deployed static output or build integrity.

## CI security and deployment boundary

The CI workflow is verification-only:

- repository permissions are read-only (`contents: read`)
- no repository, environment, or Cloudflare secrets are requested
- no `pull_request_target` or manual deployment trigger is present
- no artifacts are uploaded
- no Wrangler deploy, Cloudflare API, DNS, email-routing, or Pages mutation command is executed
- `npm run pages:deploy` is never invoked
- action dependencies are pinned to immutable full commit SHAs
- superseded runs for the same pull request or branch are cancelled

A successful CI run does **not** deploy the website. Production changes require a separate reviewed process and explicit authorization immediately before execution.

## Review sequence

Before merging a pull request:

1. Confirm the workflow ran against the current head SHA.
2. Require every CI step to pass.
3. Review the exact changed files and unresolved review threads.
4. Confirm no deployment path, secret lookup, or Cloudflare mutation was introduced.
5. Merge only the reviewed head SHA.
6. Treat deployment as a separate explicitly authorized action.
