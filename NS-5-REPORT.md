# NS-5 report — DRAFT packaging definitions

## Delivery and base

- Repository: daveybehavey/Portfolio; fetched origin before creating the fresh worktree.
- Base: `4423c26d202d2b3136bcaf8a0e92abdc3395439f` (fetched origin/main, includes NS-1).
- Worktree: `C:\Users\ReuseTechBC\projects\pf-ns5`.
- Branch: `docs/ns5-packaging`.
- Deliverable: `docs/offers/ns5-packaging.md`; this required report is the only other added file.
- Bundle: `C:\Users\ReuseTechBC\projects\qns5.bundle`, incremental from the base, with `refs/heads/docs/ns5-packaging` included.
- Total token usage: unavailable from this runtime; no estimate presented as a measured total.

## Source-cited anchors and figures

All citations refer to the recorded base. Every unlabelled commercial figure in the draft is covered here. Dates and decision numbers are document metadata, not prices or scope promises.

| Figure / anchor | Source | Scope evidence |
| --- | --- | --- |
| Small Website Repairs — From $125 CAD | `src/lib/offer.ts:7` (plain form at line 8) | Examples at lines 15–19; narrow-scope exclusion and repeated $125 at line 22. Not a new-page price. |
| One-Page Launch — From $499 CAD | `src/lib/offer.ts:67` | One focused page at line 73; all inclusions at lines 73–78; exclusions at line 81. |
| Business Website — From $1,250 CAD | `src/lib/offer.ts:85` | Published `3–6 page professional website` at line 91; inclusions at lines 91–98. Recommended badge at line 89. |
| Online Store — From $2,000 CAD | `src/lib/offer.ts:103` | Inclusions at lines 107–113. No published catalog cap: the draft's cap is explicitly proposed. |
| Custom Project — Quoted per project | `src/lib/offer.ts:118` | Inclusions at lines 123–126; no numeric starting price. |
| Inquiry reply aim — 1–2 business days | `src/lib/site.ts:24` | Verbatim inquiry wording, not a delivery or support SLA. |

Shared launch inclusions: `src/lib/offer.ts:29` through line 34, for Business Website and Online Store only. Their product/tool names remain only where needed to faithfully reproduce existing inventory; the handover menu uses buyer-facing delivery language.

Additional inventory evidence:

- Homepage pricing rules and non-fixed starting points: `src/app/page.tsx:37`; package rendering uses offer.ts, as do the regional landing page and ServiceLandingView.
- Redesign deliverables: `src/lib/service-pages/website-redesign-vancouver-island.ts:66` through line 70; package mapping at line 114; later updates at line 126.
- Practical SEO deliverables: `src/lib/service-pages/seo-services-vancouver-island.ts:64` through line 69; existing-package pricing at line 117; separately quoted content/marketing at line 113.
- Business Profile deliverables: `src/lib/service-pages/google-business-profile-setup-victoria.ts:70` through line 74; standalone quoted pricing at line 118. The repair anchor is not repurposed as a Profile setup price.
- Separate copywriting/photography and ongoing services: `src/lib/service-landing.ts:37` through line 38; ongoing updates/maintenance/content/marketing at line 96.

Read the complete offer authority and homepage, regional pricing page, ServiceLandingView and WebsiteNeedsConfigurator before drafting; also inspected their source data. Inventory bullets from offer.ts were extracted directly to preserve exact copy. Reviewed supplementary service descriptions and corrected the redesign quotation against its source.

## Proposal count and approval coverage

- **9 proposed monetary items:** chatbot Starter/Core/Plus; content Starter/Core/Plus; extra page, extra content piece and rush. Each amount is labelled inline every time it appears. No invented fee for the website tiers: those retain the existing starting-price anchors with proposed scope constraints clearly distinguished.
- **54 inline PROPOSED labels**, including repeats and non-numeric scope/rule statements; this is the reproducible occurrence count, not 54 unique offers.
- **10 numbered approval groups** at the end enumerate every proposed price and reference all proposed limits, revisions, delivery classes, exclusions, upgrade paths and commercial rules without silently treating any as settled.
- New quantity figures (including word limits, answer caps and review counts) are inline-labelled. No hour or calendar delivery promises. Each tier is independently purchasable as a proposed bounded project.

## Verification and fences

- `git rev-parse --is-shallow-repository`: false. Never bundled from a shallow repository.
- Source-fidelity review, price/quantity label review and handover-menu/tier coverage review completed.
- `git diff --check` and staged whitespace check: pass.
- Only the new packaging document and this required report are added. No tracked base file changes; specifically no live file, offer.ts, pricing component, or NS-1 outreach file changed.
- No push, PR, deployment, send, prospect content, contact with anyone or external account mutation. Fetch was the only remote repository operation.
- Code/UI tests are not applicable: documentation only, no code/config/dependency changes. No tests claimed as run.
- Initial bundle: `git bundle create C:/Users/ReuseTechBC/projects/qns5.bundle 4423c26d202d2b3136bcaf8a0e92abdc3395439f..HEAD refs/heads/docs/ns5-packaging`; `git bundle verify` passed and listed the branch ref plus the exact base prerequisite.
- Local test clone: `git clone --no-local --no-checkout --single-branch --branch main C:/Users/ReuseTechBC/projects/Portfolio C:/Users/ReuseTechBC/projects/pf-ns5-bundle-test`. The clone's local main was behind the prerequisite, so fetched only `refs/remotes/origin/main:refs/heads/ns5-base` from the local Portfolio clone before verification. This is expected for an incremental bundle: it needs the base history.
- In that clone, bundle verify passed; fetching the bundle's branch ref and checking it out succeeded. Head matched the exporting branch. `git diff --check ns5-base HEAD` passed; `git diff --name-status ns5-base HEAD` listed exactly the two additions; `git status --short` was empty.
- This report update is committed before final bundle creation. Final delivery repeats bundle verification and import in a fresh base-seeded clone after the report commit; the final response reports that outcome without requiring another self-referential report commit.

## Review status and limitations

Ready for David's definitions review, not publication. He must validate feasibility and margins for all proposed amounts and scopes. No market-price research was used: the repository is the requested price authority. Current-state means the source at the recorded base, not a separately inspected deployment. The report and definitions are the only intended changes. Resolve the final head with `git rev-parse docs/ns5-packaging` or the bundle's branch ref.
