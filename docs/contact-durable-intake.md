# EuroDigital durable contact intake — blocked

Durable intake is not implemented. The task brief requires stopping if the build
needs a new environment variable, and prohibits configuration/environment changes.

## Repository evidence

- `functions/api/contact.js` passes the request and Pages environment to
  `server/contact.mjs`.
- `server/contact.mjs` validates the request, verifies Turnstile, and calls Resend.
  Acceptance requires a nonempty provider message ID. There is no durable write.
- `wrangler.jsonc` configures production and preview variables, with no KV, D1,
  R2, or Durable Object bindings. No existing durable intake system or database
  adapter was found in the repository.
- `.env.example` and `.dev.vars.example` contain contact delivery configuration,
  with no durable storage binding.

Cloudflare Pages Functions do not provide an implicit persistent filesystem or
database. Browser storage, process memory, and provider acceptance do not satisfy
the requirement to durably store the enquiry before sending email.

## Decision required

Authorize a separately reviewed Cloudflare storage resource and environment
binding before implementation. A Cloudflare D1 database is a small native option
for an enquiry table and status updates; it would require provisioning, a binding
(for example `CONTACT_DB`), and a schema migration. None were added or applied.
An existing owner-managed store could instead be used once its supported binding
and access pattern are supplied. Repository inspection does not establish whether
an unbound resource exists in the Cloudflare account; no account changes or
external contact sends were performed.

## Implementation requirements after authorization

Preserve origin restrictions, payload validation, Turnstile, recipients, email
copy, and the existing Resend idempotency key. After validation and Turnstile:

1. Await a durable enquiry write containing the submission ID, timestamp, name,
   email, message, and pending status before calling Resend. Preserve the other
   validated enquiry fields needed to reconcile the existing email.
2. Record accepted status and the provider message ID only on confirmed
   acceptance. Distinguish provider rejection from an unconfirmed timeout or
   malformed response, and retain a bounded reason for reconciliation.
3. Return visitor success only after storage and provider acceptance with an ID.
   Define retry handling and status-write failure behavior so an already accepted
   email cannot cause a false success or lose its original pending enquiry.
4. Test record-before-send ordering, stored-plus-provider-ID acceptance, retained
   failure records, and no send or success on initial storage failure. Also cover
   status-update failures and retries with the same submission ID.

The runtime and UI remain unchanged in this blocker-only draft. These new intake
tests cannot establish the requested behavior until storage is authorized and the
implementation exists.
