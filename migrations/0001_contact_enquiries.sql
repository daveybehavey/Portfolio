-- 0001: durable EuroDigital contact enquiries.
-- One row per form submission, keyed by the client-minted submission ID,
-- which is also the Resend idempotency key for the delivery attempt.
-- The handler inserts the row (status 'pending') after validation and the
-- Turnstile check, BEFORE calling Resend, then records the outcome so a
-- provider-side loss can never erase the only copy of an enquiry.
CREATE TABLE IF NOT EXISTS contact_enquiries (
  submission_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business TEXT NOT NULL,
  project_type TEXT NOT NULL,
  message TEXT NOT NULL,
  source_page TEXT,
  attribution TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'failed', 'unconfirmed')),
  provider_message_id TEXT,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_enquiries_created_at
  ON contact_enquiries (created_at);
