# Wave-3 preparation pack — DRAFT / evidence incomplete

Prepared 2026-11-03 (America/Vancouver). Source baseline: `main` at `efa3490f7684ba072127fa7be9884f6a3d509144`.

Preparation only. This document proposes decisions; it changes no route, customer-facing copy, redirect, canonical, sitemap, schema, analytics, or configuration. No merge or deployment is authorized. Wave-3 implementation is blocked on the unverified items below.

## Inventory reconciliation and decision rule

The request names **26 city/service URLs**. The verified source contains **18**: 17 entries in [the service registry](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/index.ts) plus [the primary website-design hub](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-landing.ts). [The sitemap](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/app/sitemap.ts) also contains non-service pages and blog paths; those are not silently relabelled as city/service URLs. Eight requested URL identities remain unresolved. This is not a completed 26-URL disposition or numeric GSC baseline.

**Keep** means provisionally retain the URL and qualify its content against the survivor standard; it does not certify existing copy. **Merge** means preserve useful material in a named relevant survivor, then separately approve a one-hop permanent redirect. **Retire** means remove an obsolete intent only after checking demand, backlinks, conversions, and alternatives. Neither merge nor retire is justified by absent measurements. The provisional keep decisions follow [PR #58's recommendation](https://github.com/daveybehavey/Portfolio/pull/58) to avoid consolidation without 90-day page-level GSC evidence. They are planning recommendations, not observed performance findings.

## Disposition map — 18 verified URLs

All paths below are relative to `https://eurodigital.ca`. Every verified URL receives a disposition and reason. No merge or retire is proposed on the presently available evidence.

| URL | Proposed disposition | Reason / required work | Source |
|---|---|---|---|
| `/ecommerce-websites-vancouver-island` | Keep (provisional) | Distinct store-build intent and product journey; owned-product proof must retain its disclosure. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/ecommerce-websites-vancouver-island.ts) |
| `/google-business-profile-setup-victoria` | Keep (provisional) | Distinct profile-setup intent; retain eligibility and service-area constraints without implying an office. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/google-business-profile-setup-victoria.ts) |
| `/seo-courtenay-bc` | Keep (provisional) | Reported 67% overlap requires substantial differentiation; missing GSC evidence does not establish zero demand. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/seo-courtenay-bc.ts) |
| `/seo-duncan` | Keep (provisional) | Reported 64% overlap needs differentiation, but real MaestrosServices website context merits preservation; it is not SEO outcome proof. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/seo-duncan.ts) |
| `/seo-nanaimo` | Keep (provisional) | Reported 66% overlap requires substantial differentiation; missing GSC evidence does not justify erasing possible signals. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/seo-nanaimo.ts) |
| `/seo-services-vancouver-island` | Keep (provisional) | Primary search-foundations hub and candidate destination if a later approved consolidation is justified. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/seo-services-vancouver-island.ts) |
| `/seo-victoria-bc` | Keep (provisional) | Reported 2% sibling overlap and materially different scope explanations; retain explicit no-SEO-client disclosure. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/seo-victoria-bc.ts) |
| `/small-website-repairs` | Keep (provisional) | Distinct narrow repair intent; preserve the boundary between repairs and a full build. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/small-website-repairs.ts) |
| `/web-design-campbell-river` | Keep (provisional) | Preserve the campbell river design intent provisionally while demand is unknown; the established design family has reported 63–74% overlap and must meet the standard below. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-campbell-river.ts) |
| `/web-design-comox-valley` | Keep (provisional) | Preserve the comox valley design intent provisionally while demand is unknown; the established design family has reported 63–74% overlap and must meet the standard below. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-comox-valley.ts) |
| `/web-design-duncan-cowichan` | Keep (provisional) | Preserve disclosed family-business website context for a business serving Duncan; differentiate the shared design template. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-duncan-cowichan.ts) |
| `/web-design-langford` | Keep (provisional) | Wave-2 page reported at 10% overlap; preserve its distinct buyer information and no-local-client disclosure. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-langford.ts) |
| `/web-design-nanaimo` | Keep (provisional) | Preserve the nanaimo design intent provisionally while demand is unknown; the established design family has reported 63–74% overlap and must meet the standard below. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-nanaimo.ts) |
| `/web-design-parksville-qualicum` | Keep (provisional) | Wave-2 page reported at 7% overlap; preserve Oceanside coverage and no-local-client disclosure. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-parksville-qualicum.ts) |
| `/web-design-sooke-bc` | Keep (provisional) | Preserve the sooke bc design intent provisionally while demand is unknown; the established design family has reported 63–74% overlap and must meet the standard below. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-sooke-bc.ts) |
| `/web-design-victoria-bc` | Keep (provisional) | Preserve the victoria bc design intent provisionally while demand is unknown; the established design family has reported 63–74% overlap and must meet the standard below. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/web-design-victoria-bc.ts) |
| `/website-design-vancouver-island` | Keep (provisional) | Primary website-design hub and natural destination for any later design-page consolidation. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-landing.ts) |
| `/website-redesign-vancouver-island` | Keep (provisional) | Distinct existing-site redesign intent; survivor must explain migration and scope decisions. | [Content](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/service-pages/website-redesign-vancouver-island.ts) |

### Unresolved requested inventory

| Requested entries | URL | Disposition | Reason |
|---|---|---|---|
| 19–26 (eight entries, not source order) | Unverified; no URL supplied or found | Unassigned | Need the authoritative 26-URL list. Do not invent slugs or assign merge/retire to unidentified pages. |

Before finalizing any merge, capture the source URL's useful unique material, exact destination, query-intent compatibility, inbound links, backlink evidence and conversions. Preserve Duncan's project context if it ever moves to the SEO hub; retain the family relationship and website-only proof limits. If demand exists, prefer differentiation in place. Only verified zero-signal pages with no distinct reader need should be candidates for merge; retirement additionally needs evidence that the intent is obsolete and no useful destination exists. Missing data is never zero-signal evidence.

## Survivor content standard

### Existing overlap evidence

[PR #58, finding 6](https://github.com/daveybehavey/Portfolio/pull/58) reports extraction and comparison of content-module string literals:

| SEO page | Approximate literal words | Share appearing verbatim in a sibling |
|---|---:|---:|
| Nanaimo | 1,021 | 66% |
| Courtenay | 1,016 | 67% |
| Duncan | 1,055 | 64% |
| Victoria | 928 | 2% |

The trio shares 40 literals of at least 40 characters (about 621 words counted once), including deliverable headings, process bodies, fit lists and FAQ answers. Victoria was excluded from that finding because its material is distinct. The six established web-design city pages were reported at 63–74%; Langford 10% and Parksville/Qualicum 7%. These are historical PR-reported literal comparisons, not newly reproduced rendered-page measurements or Google's duplication scores. The PR does not provide a standalone dated measurement artifact; its report date must not be substituted for a GSC observation period. No percentage here establishes a ranking effect or a universal safe threshold.

### Required content for every kept page

1. **A distinct reader decision.** State who the page serves, the specific task it helps them evaluate, and how its intent differs from the hub and nearest sibling. City-name substitution and generic local-business commentary do not qualify.
2. **Verified local relevance.** Give useful, sourced information affecting service delivery or a buyer's decision in that area. State actual coverage and remote/service-area delivery honestly. No fabricated office, local client, neighbourhood expertise or city-specific demand claim. If there is no verified local evidence, retain that gap in the review rather than filling it with plausible prose.
3. **A differentiated substantive body.** Explain the area/service-specific starting situation, choices, deliverables, exclusions and handoff in original sections. Shared commercial facts may remain consistent; repeated process, fit and FAQ blocks must not constitute most of the useful page. Point to a hub for general background where appropriate.
4. **Evidence with limits.** Link inspectable work only when relevant. Disclose owned/family relationships. MaestrosServices demonstrates website work, not proven SEO improvement; Victoria SEO must retain its no-client/no-results truth posture. No invented testimonials, rankings, leads, traffic or revenue.
5. **Useful service-specific questions.** Answer actual scope, eligibility, ownership and next-step questions for this intent. Do not manufacture local FAQs merely to expand text. Shared pricing facts must match `offer.ts`; no new price, retainer or package promise.
6. **A complete customer path.** A clear next step, relevant hub/peer links and a truthful scope boundary. No orphaned survivor. Later implementation must verify canonical, sitemap, schema and internal links together; none changes in this PR.

### Acceptance review before implementation approval

- Record the intended query/reader need and a source ledger for every local assertion and proof item.
- Compare each candidate against the hub and every sibling, highlighting exact repeated substantive blocks. Repeat the PR #58 literal comparison only with its extraction/counting rules recorded, and separately inspect rendered main content with navigation/footer/CTA boilerplate excluded. Keep metrics from the two methods separate.
- Record per-page word counts, overlap numerator/denominator, compared URLs, exclusions, source commit and measurement date. The historic 66/67/64/2 figures are reference observations, not mechanically reproducible without the original script/counting details.
- Require a reviewer to identify the unique buyer value in the intro, main sections and FAQs. Merely paraphrasing the same generic template fails even if verbatim overlap drops. A low percentage alone does not pass; no unsupported numeric cutoff is adopted.
- If evidence cannot sustain distinct content, revisit merge into the relevant hub after the measurement gate. Do not produce live replacement copy as part of this preparation PR.

## Measurement baseline — existing-report evidence only

**No dated GSC report or export was found in the current tracked tree, available local files, or available Git history filenames.** GitHub searches for GSC/report/wave material surfaced PR #58's explicit request for measurements, not a per-page numeric report. Consequently the table below is a completeness register, not a claim of current search performance. No live Search Console account was queried or changed. `Unavailable` means unknown, never zero; no report date or reporting window is inferred from Git timestamps.

| URL | GSC average position | GSC clicks | Report date | Observation period | Source/status |
|---|---|---|---|---|---|
| `/ecommerce-websites-vancouver-island` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/google-business-profile-setup-victoria` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/seo-courtenay-bc` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/seo-duncan` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/seo-nanaimo` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/seo-services-vancouver-island` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/seo-victoria-bc` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/small-website-repairs` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-campbell-river` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-comox-valley` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-duncan-cowichan` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-langford` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-nanaimo` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-parksville-qualicum` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-sooke-bc` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/web-design-victoria-bc` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/website-design-vancouver-island` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| `/website-redesign-vancouver-island` | Unavailable | Unavailable | Not found | Not found | No existing report located |
| Eight unresolved URLs (19–26) | Unavailable | Unavailable | Not found | Not found | URL identities and reports missing |

When reports are located, transcribe each page's figures exactly and cite the report path/link, report creation/export date, observation start/end, property, search type and filters (country, device, query). Keep reports with different windows separate. Page-average position is an impression-weighted GSC aggregate, not a fixed rank; do not average page averages or mix query rows with page rows. An absent row is unknown unless the export is verified complete for that URL/filter combination.

For a later implementation decision, obtain the 90-day clicks **and impressions** requested by PR #58, average position and CTR per exact canonical page; record query overlap and conversion evidence separately. Capture a fresh pre-change baseline when implementation is actually approved. Compare equivalent windows at about 28 and 90 days after any separately approved deployment; record deployment date, redirects and other interventions before attributing changes to wave 3. The reporting plan creates no scheduled job and makes no account changes.

## Sources and unverified items

Primary sources:

- Exact base commit and per-page modules linked in the disposition map; registry, hub and sitemap links establish the 18-URL inventory.
- [PR #58](https://github.com/daveybehavey/Portfolio/pull/58), finding 6: reported overlaps, shared sections, consolidation alternatives and missing GSC evidence. Its tests describe that earlier code PR, not this docs change.
- [PR #54](https://github.com/daveybehavey/Portfolio/pull/54): wave-2 page identity, distinct content and truth disclosures; no per-page GSC baseline.
- [Offer source](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/offer.ts) and [case studies](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/src/lib/case-studies.ts): authoritative scope/pricing and relationship/proof limits for future survivors.
- [AGENTS.md](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/AGENTS.md) and [CI workflow](https://github.com/daveybehavey/Portfolio/blob/efa3490f7684ba072127fa7be9884f6a3d509144/.github/workflows/ci.yml): repository rules and verification-only CI.

Unverified / blocking final preparation approval:

- Authoritative 26-URL inventory and reconciliation of the eight missing identities.
- Location of the requested existing reports, dated position/click figures for every page, reporting windows and filters. No numeric baseline can be certified yet.
- Fresh 90-day impressions, query cannibalization, backlinks, conversions and current live indexing/canonical/redirect state; source code does not prove them.
- Original overlap extraction script and exact denominator rules; the reported overlap has not been independently remeasured here.
- Evidence sufficient for local differentiation on each provisional survivor. Current pages are not certified to pass this proposed standard.
- Independent review and owner decision on any later content, consolidation or retirement proposal. This draft is ready for evidence-gap review only, not implementation approval.
