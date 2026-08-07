# Production closeout — Web Analytics deploy

Documentation-only closeout for the Production deployment that activated Cloudflare Pages native Web Analytics for `eurodigital.ca`. **GA4 remains disabled** unless a measurement ID is explicitly configured in a future authorized change.

## Deployed identities

| Item | Value |
|------|-------|
| Production source SHA | `348bff05ce4e8d01290cd66c1b79a99aafc68ae4` |
| Production deployment ID | `fc18bfa8-56e0-4786-b7d7-7130ece3bcb3` |
| Deployment alias | `https://fc18bfa8.eurodigital-ca.pages.dev` |
| Operator-supplied rollback deployment ID | `e6c9ca53-554c-4be9-8bc2-847074a80c7d` |
| Prior Production source (rollback) | `887d9abb55f5ef3c085e2497b7a56c137a847e7d` |

## Native Web Analytics evidence

- Cloudflare Pages native Web Analytics remains dashboard-managed for project `eurodigital-ca`.
- Application source still contains **no** manual Web Analytics token environment variable, **no** manual analytics React component, and **no** manually embedded Cloudflare insights script. Edge injection remains the only supported path.
- Post-deploy rendered Production HTML for `/`, `/privacy`, and `/projects` showed **exactly one** native Cloudflare insights script (edge injection), not a second manually embedded script.
- Real-browser Cloudflare RUM verification under the `/cdn-cgi/rum` path was part of the authorized post-deploy checklist; dashboard aggregation may lag and is not treated as an emergency rollback trigger when the single native script and network RUM request are confirmed.

## Contact delivery evidence

- Non-delivery smoke suite against `https://eurodigital.ca/api/contact` passed (`405` / `403` / `415` / `400` / `422`).
- Exactly one labelled Production verification inquiry was submitted after deploy and returned the durable success message: “Your inquiry was delivered. Expect a reply within 1–2 business days.” That message is only emitted after Turnstile validation and Resend acceptance.
- No GA4 instrumentation was enabled as part of this closeout.

## What this document does not authorize

- Additional Production or Preview deploys
- Cloudflare dashboard, DNS, Turnstile, Resend, Gmail, or Search Console mutations
- Enabling GA4
- Unscoped follow-on work beyond verified Production closeout evidence
