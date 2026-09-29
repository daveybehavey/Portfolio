# AGENTS.md

These rules apply to the entire repository.

## Goal
Ship small, reviewable changes that improve the product without weakening security, accessibility, performance, maintainability, or factual accuracy.

## Work rules
- Work only on the issue/task you were given. Do not expand scope without explicit approval.
- Use an isolated branch/worktree. Never work directly on `main`.
- Prefer existing architecture, components, dependencies, and patterns over introducing new ones.
- Do not invent customer results, rankings, revenue, traffic, conversion, testimonials, or other unsupported claims.
- Do not weaken tests, guards, auth, CSP, Turnstile, origin restrictions, deployment safety, or validation to make a task pass.
- Never expose secrets or commit credentials.
- Never force-push `main`.
- Never deploy, merge, mutate Cloudflare/Resend/DNS/Search Console/analytics accounts, send outreach, spend money, or perform other external side effects without explicit owner approval.

## When to stop and ask
Stop and request a decision when the task requires:
- product direction or visual-taste judgment that is not defined by the issue;
- pricing, customer promises, or unsupported business claims;
- production deployment or external-account changes;
- auth/security-policy changes beyond the approved scope;
- destructive/irreversible data changes;
- materially broader architecture or dependency changes than the task requires.

## Verification
For code/config/dependency changes, run the CI-equivalent checks applicable to the change:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run pages:config:preflight`
- `npm audit --omit=dev --audit-level=high`

For UI changes, also verify representative desktop and mobile behavior and accessibility. Use existing browser/Playwright tooling where appropriate.

Do not claim success if a required check did not run. Report the limitation instead.

## Completion report
Return:
1. what changed;
2. files changed;
3. exact checks run and results;
4. known risks/limitations;
5. PR link or branch/head SHA;
6. whether the change is ready for the named independent reviewer.

Do not merge or deploy unless the owner explicitly authorizes it.
