# EuroDigital durable contact intake — implemented

Every validated, Turnstile-passed contact enquiry is recorded durably in
Cloudflare D1 **before** the email send, and the delivery outcome is recorded
afterwards, so a provider-side loss can never erase the only copy of an
enquiry. (Finding S95-3; the ED2-01 test email did arrive in the inbox, but
nothing durable recorded the enquiry itself.)

## Storage

- D1 database `eurodigital-contact-intake`
  (`40e26c32-ca9b-415a-8088-63b41f2189a9`, WNAM), provisioned 2026-11-02.
- Bound as `CONTACT_DB` in the top-level (Production) section of
  `wrangler.jsonc`. Preview has no binding and skips intake on purpose: its
  deliveries go to the provider's test inbox and must not pollute the real
  enquiry table.
- Schema: `migrations/0001_contact_enquiries.sql` — one row per submission,
  keyed by the client-minted submission ID, which is also the Resend
  idempotency key. Columns: timestamps, name, email, business, project type,
  message, source page (attribution `pagePath`), the sanitized attribution
  JSON, a status (`pending` / `accepted` / `failed` / `unconfirmed`), the
  provider message ID, and a bounded failure reason. Migration 0001 was
  applied to the database at provisioning time.
- The committed-config preflight (`npm run pages:config:preflight`) requires
  the exact reviewed binding (`PRODUCTION_CONTACT_DB_BINDING`), so the
  binding cannot be dropped or repointed silently.

## Handler behavior (`server/contact.mjs`)

Origin restrictions, payload validation, Turnstile verification, recipients,
email copy, and the Resend idempotency key are unchanged. After validation
and Turnstile:

1. The enquiry is inserted with status `pending`
   (`INSERT OR IGNORE`, so a retry with the same submission ID reuses the
   record). If this write fails, the handler returns 503
   `temporarily_unavailable` and **does not send** — an enquiry that exists
   only in the provider's hands is exactly the loss this intake exists to
   stop.
2. Resend is called as before. Success still requires a nonempty provider
   message ID; the visitor is told "accepted" only on confirmed acceptance.
3. On acceptance, the row is updated to `accepted` with the provider message
   ID. If that update fails, the response is 503 `delivery_unconfirmed`
   rather than a false success: a retry with the same submission ID
   re-checks the idempotent send and retries the recording, and the pending
   enquiry is retained either way.
4. On provider rejection the row is marked `failed` with reason
   `provider_rejected:<status>`; on a network/timeout/no-ID outcome it is
   marked `unconfirmed` with reason `provider_unconfirmed`. These outcome
   writes are best-effort — the pending record is retained regardless, and
   the visitor-facing delivery error is unchanged.

Without a `CONTACT_DB` binding (Preview/local), intake is skipped and the
handler behaves exactly as it did before this change.

## Tests

`test/contact-intake.test.mjs` covers record-before-send ordering, stored
fields, acceptance with the stored provider ID, retained `failed` and
`unconfirmed` records, no send and no success on initial storage failure,
the unrecorded-acceptance retry reconciliation, and the no-binding fallback.
`test/pages-deployment.test.mjs` pins the config guard.
