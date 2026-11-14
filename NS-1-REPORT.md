# NS-1 report

Prepared 2026-11-13. DRAFTS ONLY.

## Delivery and scope

- Repository: daveybehavey/Portfolio; fetched default branch: main.
- Base: `3332cd8192480376547f4a81bea26f68265ba624`.
- Fresh worktree: `C:/Users/ReuseTechBC/projects/pf-ns1`.
- Branch: `docs/ns1-fuzzy-email-pack`.
- Product deliverable: `docs/outreach/ns1-fuzzy-email-pack.md` only. This required report is the sole additional repository file. No existing files, site code, config, or packages changed.
- Bundle: `C:/Users/ReuseTechBC/projects/qns1.bundle`, incremental from the base, including `refs/heads/docs/ns1-fuzzy-email-pack`.
- No push, PR, deployment, email, prospect research/list, CRM wiring, or contact with anyone occurred.

## Catalogue and counts

16 variables: `entry_gap`, `booking_path`, `mobile_obstacle`, `listing_gap`, `contact_label`, `hours_mismatch`, `service_area`, `faq_question`, `answer_location`, `handoff_route`, `policy_split`, `source_post`, `review_theme`, `content_gap`, `seasonal_detail`, `image_context` (each uses double braces in the pack).

Counts are whitespace-delimited body words; a placeholder counts as one word. Subjects and the mandatory identification/unsubscribe footer are excluded. The second figure uses the fictional catalogue substitutions. Actual senders must recount after truthful substitution.

| Offer | Initial: template / filled | +3 days: template / filled | +7 days: template / filled | +14 days: template / filled |
| --- | --- | --- | --- | --- |
| Website proposal / build | 97 / 136 | 48 / 59 | 64 / 74 | 37 / 50 |
| Existing-site chatbot | 102 / 132 | 47 / 59 | 68 / 80 | 36 / 43 |
| Content repurposing | 102 / 128 | 48 / 59 | 64 / 74 | 34 / 42 |

All initial templates contain exactly three distinct, load-bearing observations. All follow-ups contain one observation; each first follow-up introduces a new one. All 15 subject options have at most six words. The +7-day messages deliver a useful paragraph directly and ask for no action beyond a reply. The initial and +3-day limits also pass with the supplied fictional values.

## Pricing and factual integrity

Used only One-Page Launch from $499 CAD, verified at the fetched base in `src/lib/offer.ts:66-67` (offer name and price). The email qualifies it as a lean scope requiring confirmation. No other numeric price is included. Chatbot/content use per-project quoting as directed by the brief; no numeric rate or published fixed package is asserted for them. Contact email comes from `src/lib/site.ts:3`.

The three offers follow the NS-5 menu supplied in the task. No separate NS-5 record was found in the searched source/docs, and no deployed proposal generator or chatbot capability is asserted. This is a human proposal workflow.

Fictional-example attestation: Fernwake Repairs, Driftfern Walks, and Mossglass Pottery and every associated observation were invented solely as clearly labelled examples. None was researched or presented as a real prospect. No real prospect business names, customer identities, scraped personal data, invented performance figures, clients, or results are included. EuroDigital and David Heslop appear only as the required sender identity; geographic place names are not prospect identities.

## Checks and limitations

- `git rev-parse --is-shallow-repository`: false; source is a full repository.
- `node C:/Users/ReuseTechBC/projects/ns1-validation/check.cjs`: PASS. Uses the marked Markdown parser installed outside the repo. Checks heading nesting, one four-column table with 16 data rows, rendered HTML with four header cells and 64 data cells, defined variable references, three variables per initial, initial and first-follow-up word bounds, and all subject counts. Count output and rendered HTML remain outside the repository.
- Manual review: fictional-filled initial bodies also fit 90–140 words; first follow-ups fit 40–70. Observations drive each offer's rationale. Consent, footer, human follow-up stops, and five-minute kill rule are present.
- `git diff --cached --check`: required before commit; no whitespace errors.
- Repository test suite is irrelevant to this docs-only change and was not run. No code/config/dependency change requires the AGENTS.md CI checks.
- CASL skeleton checked against official CRTC implied-consent guidance and FAQs plus Government of Canada consent guidance, linked directly in the pack. It is labelled exactly “legal-shape checklist, NOT legal advice”. This is not legal clearance to send.
- Mailing address remains the expressly requested marketing-footer placeholder. David must confirm address, consent, monitored reply/unsubscribe handling, and each final message before use. No live unsubscribe or inbox test was performed because this is a document-only task.
- Total token usage: not available from the session tools; no estimate substituted.

## Bundle verification

The incremental bundle requires the recorded base history. Test recovery uses a fresh local clone seeded from the full source repository, checks out the base, fetches the bundle's named branch, and compares its HEAD and file scope with the worktree. A direct empty clone of an incremental bundle is not expected to work without its prerequisite.

Final delivery verification is performed after this report is committed: `git bundle verify`, `git bundle list-heads`, and local test-clone recovery. The resulting branch is ready for David's review as draft documentation only; no independent reviewer was named in the task.

Verification result: the first bundle passed `git bundle verify` and named-branch recovery in a local test clone; `git fsck --full` passed and the diff contained only the pack and this report. After recording this result, the final bundle is recreated and verified again in a fresh transport-based, single-branch clone, with an explicit check that the final delivery commit is absent before fetching the bundle. This avoids relying on shared Git objects. Final HEAD and bundle checksum are returned with delivery rather than embedded in their own commit.

Commit identity: command-local `Codex <codex@openai.com>` because the PC had no Git author identity configured; no global Git configuration changed.
