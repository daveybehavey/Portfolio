# S4 — Portfolio bug-class sweep (review only)

Repository: `daveybehavey/Portfolio`. Evidence baseline: [`4dde436c94b525a020907cdad504d2e5bc5b006a`](https://github.com/daveybehavey/Portfolio/tree/4dde436c94b525a020907cdad504d2e5bc5b006a). Review date: 2026-11-03 (America/Vancouver).

**DRAFT ONLY. Analysis/design document; no implementation approval. Never merge, mark ready, or deploy this task.**

## Scope and evidence standard

The four StarMapAppV2 examples in the task define search patterns; they are not evidence of defects in this repository. Reviewed Portfolio's contact client and server, attribution helpers, configurator, reveal/accordion surfaces, CI ordering, runtime pins, and selected test/deployment guard implementations. Read-only inspection of guard code does not authorize changing production configuration. No payment, checkout, HD-download (DL-1), print-order, price/SKU/promo, production configuration/flag, or StarMapCo design/rendering changes are proposed here. All existing tracked files remain byte-identical to the baseline.

CONFIRMED means the behavior follows from current source plus a local reproduction or an explicit CI/test execution path. It does not mean an observed production incident. SUSPECTED means a concrete code path merits follow-up, but reachability, requirements, or browser behavior is unresolved. No defect is inferred merely from a `catch`, fallback, hidden panel, or duplicated constant.

| Class | Confirmed | Suspected / limit |
| --- | --- | --- |
| (a) Silent degradation of a user benefit | None | A1: missing runtime intake binding can bypass durable capture; preview/local intentionally do this |
| (b) Stale snapshot persists after awaits | B1: success clears a newer unsent contact draft | Browser integration not run; actual handler reproduced with stubs |
| (c) Feedback gated behind reveal | None in the exact computed-only-after-opening sense | C1: contact warning visibility depends on the surrounding animation reveal; adjacent visibility risk |
| (d) Config/test pins drift from guarded code | D1: built identity guard is disconnected from fresh CI build output (coverage wiring, not a version-pin mismatch) | D2: incomplete runtime-pin parity enforcement; current values agree |

## CONFIRMED

### B1 — Successful older submission clears newer contact edits

**Class (b); priority: medium.** An inquiry is sent from snapshot A, the visitor edits draft B while awaiting the response, then success for A clears B. No persistence of B occurs. This is the destructive stale-completion variant of the class, rather than a database overwrite.

Evidence at the baseline:

- [`src/components/ContactForm.tsx:241–268`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L241-L268): captures FormData/business fields and a fingerprint before starting the request.
- [`ContactForm.tsx:274–304`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L274-L304): awaits fetch and JSON, then unconditionally calls `form.reset()`, clears controlled project type, and discards submission identity. There is no comparison with current draft contents.
- [`ContactForm.tsx:340–463`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L340-L463) and [`509–515`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L509-L515): fields remain editable; only the send button is disabled during submission.
- [`test/website-needs.test.mjs:128–151`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/test/website-needs.test.mjs#L128-L151): source-string assertions require the reset sequence but do not exercise editing across a delayed response. Passing this test does not protect draft B.

Local reproduction: transpiled the actual TSX module with the installed TypeScript compiler; supplied stub React hooks/JSX, FormData, analytics, and a deferred fetch. Invoked its rendered form's actual submit handler with message A; changed the form model to B before resolving `{ok: true}`; asserted the outbound JSON still contained A and the current message was then erased by reset. Passed. No network request or inquiry was sent. This proves handler ordering; it is not an end-to-end browser or Turnstile test.

Review-only design: retain an identity/version for the submitted draft; after success compare the current draft with that submission before clearing it. Preserve newer edits and make clear which inquiry was accepted. Any future regression test should delay the response, edit at least a text field and project type, then verify the accepted old submission does not erase the new draft. Also cover unchanged success and failed-response preservation. No fix in this PR.

### D1 — Fresh CI build does not run the built identity guard

**Class (d), adjacent test-wiring drift; priority: low.** This is a confirmed coverage gap, not a confirmed incorrect public identity or mismatched dependency pin.

- [`test/local-identity.test.mjs:169–180`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/test/local-identity.test.mjs#L169-L180): the built-pages test skips without `out/`, unless `REQUIRE_STATIC_EXPORT=1` is set. Its actual output/schema checks follow at [`182–209`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/test/local-identity.test.mjs#L182-L209).
- [`.github/workflows/ci.yml:66–83`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/.github/workflows/ci.yml#L66-L83): `npm test` runs before build. The only post-build test reruns are native analytics and revenue-engine tests, each with required output. Local identity is absent.
- [`scripts/verify-static-export.mjs:4–39`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/scripts/verify-static-export.mjs#L4-L39): the general artifact verifier checks existence, type, and size, not identity/schema content. It does not replace that omitted test.

Local reproduction with no `out/`: `node --test test/local-identity.test.mjs test/website-needs.test.mjs test/contact-intake.test.mjs` passed 35 and skipped exactly the built identity case. This matches the pre-build CI path. Source identity tests still run, and revenue-engine checks overlap some concerns; the gap is limited to the omitted test's built-output assertions. No production failure is claimed.

Review-only design: a future change could explicitly run the identity suite against the fresh build with output required, using the existing post-build pattern. Review workflow ownership before implementing. No CI/config edits here.

## SUSPECTED — not established defects

### A1 — Runtime absence of intake storage silently removes durable capture

**Class (a); conditional production risk only.**

- [`server/contact.mjs:395–403`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/server/contact.mjs#L395-L403): `getIntakeDb` returns null for an absent binding or missing `prepare`; comments explicitly allow no binding for preview/local.
- [`server/contact.mjs:603–655`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/server/contact.mjs#L603-L655) and [`719–731`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/server/contact.mjs#L719-L731): null skips durable intake but still permits provider acceptance/success.
- [`test/contact-intake.test.mjs:505–514`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/test/contact-intake.test.mjs#L505-L514): explicitly tests and accepts this behavior; passed locally with mocked provider calls.
- Counterevidence: [`scripts/pages-deployment-lib.mjs:478–501`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/scripts/pages-deployment-lib.mjs#L478-L501) rejects missing or repointed committed production bindings and documents the intended preview exception.

If a production runtime ever lacks this binding despite those guards, visitors could receive acceptance without a durable backup. That runtime condition was not inspected or established; do not report preview behavior as a bug. Next evidence needed: authorized read-only runtime binding evidence and agreement on whether production runtime must fail closed. Any follow-up must preserve the intentional preview path and respect the production-config fence. No runtime/account changes or live sends were performed.

### C1 — Contact warnings sit inside an opacity reveal

**Class (c), adjacent visibility risk only; exact example pattern not found.**

- [`src/app/page.tsx:517–565`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/app/page.tsx#L517-L565): wraps the contact card and form in `Reveal`.
- [`src/components/Reveal.tsx:20–41`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/Reveal.tsx#L20-L41) and [`43–57`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/Reveal.tsx#L43-L57): starts invisible for normal-motion users, relying on IntersectionObserver at threshold 0.12; no observer-unavailable fallback.
- [`ContactForm.tsx:481–497`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L481-L497) and [`534–547`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/ContactForm.tsx#L534-L547): configuration warning and live status are rendered within the form.

Counterevidence: Reveal always mounts its children. It gates opacity, not warning computation. Contact errors are not computed only after opening a panel; missing-key feedback is explicit. Reduced-motion CSS also makes contents visible. Thus this does **not** establish the precise defect from the task's example. A browser scenario where the observer cannot reveal the card could hide warnings alongside the entire form; that remains untested. Next evidence: representative viewport/reduced-motion/observer-failure checks with a local form stub, never a live inquiry. Consider an always-visible critical-feedback surface only if the failure is demonstrated.

### D2 — Runtime-pin parity guard covers only part of the declared contract

**Class (d); potential future drift, no current mismatch.**

- [`.github/workflows/ci.yml:40–55`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/.github/workflows/ci.yml#L40-L55): setup reads `.nvmrc`; Node verification compares against that same file. npm verification compares engines and packageManager, while installation repeats a literal npm version.
- [`package.json:5–9`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/package.json#L5-L9), [`.nvmrc:1`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/.nvmrc#L1), and [`.node-version:1`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/.node-version#L1): all current Node declarations agree at 22.17.1, and npm declarations/install agree at 10.9.2. CI does not compare engines.node or `.node-version` with `.nvmrc`.

A later isolated change to those unchecked Node declarations could evade this guard. No divergent values were found, so this is a maintenance-risk candidate rather than an existing pin defect. Next evidence: an offline fixture/mutation check showing a mismatch escaping the pin verifier; do not change actual pins/configuration for this document. A future parity assertion could cover all declared sources without choosing new runtime versions.

## Negative evidence and boundaries

- Server stale-overwrite patterns were checked: [`server/contact.mjs:487–502`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/server/contact.mjs#L487-L502) conditionally updates only non-accepted rows; `603–640` inserts then rereads authoritative content. Existing mocked tests for accepted-state preservation, replayed attribution, and same-ID concurrency pass. No additional confirmed server race reported.
- Configurator recommendations are calculated on selection, not when a result drawer opens ([`WebsiteNeedsConfigurator.tsx:63–71`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/WebsiteNeedsConfigurator.tsx#L63-L71)). Its presence change clears focus (`103–105`), preventing an obsolete focus selection from carrying over. No price/value changes considered.
- Disclosure preceding the design comparison is outside its slider content ([`BeforeAfterCompare.tsx:130–149`](https://github.com/daveybehavey/Portfolio/blob/4dde436c94b525a020907cdad504d2e5bc5b006a/src/components/BeforeAfterCompare.tsx#L130-L149)). No exact class-(c) defect confirmed in the inspected surfaces.
- Optional analytics no-ops and attribution sanitization were not counted as silent-benefit-loss defects without a violated product contract. No claim of exhaustive absence of bugs or production verification.

## Coordination and validation

Open-PR inventory checked at intake and before writing: #60 owns `docs/wave-3-preparation.md` and `docs/wave-3-url-inventory.md`; #61 owns six files under `docs/wave3-content/`. Changed-file lists were retrieved for both. None overlaps this new document or the candidate source files. No other open PR was returned. Do not implement findings against newly claimed files without rechecking ownership; if a collision appears, stop and record it in the PR body.

Exact local checks:

- `npm run lint` — passed, zero warnings/errors from ESLint; Next emitted its CLI deprecation notice.
- `node --test test/local-identity.test.mjs test/website-needs.test.mjs test/contact-intake.test.mjs` — 36 tests, 35 passed, 1 skipped (built identity, no `out/`), zero failed. All provider interactions in these tests are mocked.
- `node /workspace/work/s4/reproduce.cjs` — passed B1 handler-order reproduction described above; scratch file excluded from the PR.
- `git diff --cached --check` — passed before commit. Document evidence links checked locally for baseline file existence and valid line ranges; changed-path check requires exactly this one added Markdown file.

No build, full suite, typecheck, audit, browser integration, live contact smoke test, deployment, external messages, or account/config changes performed. AGENTS.md's full CI-equivalent suite applies to code/config/dependency changes; this task adds only documentation. Automatic PR CI status is not asserted here. Byte identity of existing source/assets/config means no StarMapCo render input changed; no new render comparison is claimed.

Ready for independent findings review; no independent reviewer was named. B1 is the main actionable finding. D1 is a demonstrated guard-coverage gap. A1, C1, and D2 require the additional evidence stated above before being promoted or implemented.
