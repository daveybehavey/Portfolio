"use client";

import Link from "next/link";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  type FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ButtonA } from "@/components/Button";
import { trackGenerateLead } from "@/lib/analytics";
import { collectLeadAttribution } from "@/lib/lead-attribution";
import {
  CONTACT_PROJECT_TYPES,
  resolveProjectTypeFromSearch,
} from "@/lib/website-needs";

const TURNSTILE_ACTION = "contact";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

const projectTypes = CONTACT_PROJECT_TYPES;

type TurnstileOptions = {
  sitekey: string;
  action: string;
  theme: "auto";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type SubmissionStatus =
  | { state: "idle"; message: string }
  | { state: "submitting"; message: string }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

type ContactResponse = {
  ok?: boolean;
  code?: string;
  message?: string;
  reference?: string;
  fieldErrors?: Record<string, string>;
  retryAfterSeconds?: number;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

function createSubmissionId(): string {
  const cryptoApi = globalThis.crypto;
  if (typeof cryptoApi?.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }

  if (typeof cryptoApi?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoApi.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

/**
 * Sync project type from the URL on mount and on client navigations
 * (e.g. Small Website Repairs CTA → ?projectType=small-repair#contact).
 * Manual select changes stay until the query string itself changes.
 */
function ContactFormInner({ email }: { email: string }) {
  const id = useId();
  const searchParams = useSearchParams();
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const submissionFingerprintRef = useRef<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>({
    state: "idle",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [projectTypeValue, setProjectTypeValue] = useState("");

  const nameId = `${id}-name`;
  const emailId = `${id}-email`;
  const businessId = `${id}-business`;
  const projectTypeId = `${id}-project-type`;
  const messageId = `${id}-message`;
  const statusId = `${id}-status`;
  const hintId = `${id}-hint`;
  const nameErrorId = `${nameId}-error`;
  const emailErrorId = `${emailId}-error`;
  const businessErrorId = `${businessId}-error`;
  const projectTypeErrorId = `${projectTypeId}-error`;
  const messageErrorId = `${messageId}-error`;
  const turnstileErrorId = `${id}-turnstile-error`;
  const submissionErrorId = `${id}-submission-error`;

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const projectTypeFromSearch = resolveProjectTypeFromSearch(
    searchParams.toString() ? `?${searchParams.toString()}` : "",
  );

  useEffect(() => {
    setProjectTypeValue(projectTypeFromSearch);
  }, [projectTypeFromSearch]);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }, []);

  useEffect(() => {
    if (
      !TURNSTILE_SITE_KEY ||
      !turnstileReady ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetIdRef.current
    ) {
      return;
    }

    turnstileWidgetIdRef.current = window.turnstile.render(
      turnstileContainerRef.current,
      {
        sitekey: TURNSTILE_SITE_KEY,
        action: TURNSTILE_ACTION,
        theme: "auto",
        callback: (token) => {
          setTurnstileToken(token);
          setStatus((current) =>
            current.state === "error"
              ? { state: "idle", message: "" }
              : current,
          );
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setStatus({
            state: "error",
            message: "Spam protection expired. Complete it again.",
          });
        },
        "error-callback": () => {
          setTurnstileToken("");
          setStatus({
            state: "error",
            message:
              "Spam protection could not load. Use the email link or try again.",
          });
        },
        "timeout-callback": () => {
          setTurnstileToken("");
          setStatus({
            state: "error",
            message: "Spam protection timed out. Complete it again.",
          });
        },
      },
    );

    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      }
      turnstileWidgetIdRef.current = null;
    };
  }, [turnstileReady]);

  async function submitContactForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!TURNSTILE_SITE_KEY) {
      setStatus({
        state: "error",
        message:
          "The online form is not configured in this build. Use the email link instead.",
      });
      return;
    }

    if (!turnstileToken) {
      setStatus({
        state: "error",
        message: "Complete the spam-protection check first.",
      });
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);
    const businessFields = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      business: String(data.get("business") || ""),
      projectType: String(data.get("projectType") || ""),
      message: String(data.get("message") || ""),
    };
    // Keep one submission ID across unchanged retries so the server can
    // reconcile a retry with the original attempt; mint a new ID as soon as
    // any business field changes so an edited inquiry is never reconciled
    // against the earlier content.
    const fingerprint = JSON.stringify(businessFields);
    if (
      !submissionIdRef.current ||
      submissionFingerprintRef.current !== fingerprint
    ) {
      submissionIdRef.current = createSubmissionId();
      submissionFingerprintRef.current = fingerprint;
    }
    const payload = {
      ...businessFields,
      website: String(data.get("website") || ""),
      turnstileToken,
      submissionId: submissionIdRef.current,
      attribution: collectLeadAttribution(),
    };

    setFieldErrors({});
    setStatus({ state: "submitting", message: "Sending your inquiry…" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as ContactResponse;

      if (!response.ok || !result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setStatus({
          state: "error",
          message:
            result.message ||
            "The message could not be delivered. Your entries are still here; retry or use the email link.",
        });
        resetTurnstile();
        return;
      }

      trackGenerateLead({ method: "contact_form", location: "contact" });
      setStatus({
        state: "success",
        message:
          result.message ||
          "Your inquiry was accepted by our email service for delivery.",
      });
      form.reset();
      setProjectTypeValue("");
      submissionIdRef.current = null;
      submissionFingerprintRef.current = null;
      resetTurnstile();
    } catch {
      setStatus({
        state: "error",
        message:
          "The form could not reach the server. Your entries are still here; retry or use the email link.",
      });
      resetTurnstile();
    }
  }

  const isSubmitting = status.state === "submitting";
  const onlineFormAvailable = Boolean(TURNSTILE_SITE_KEY);

  return (
    <>
      {onlineFormAvailable ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileReady(true)}
          onError={() =>
            setStatus({
              state: "error",
              message:
                "Spam protection could not load. Use the email link or try again.",
            })
          }
        />
      ) : null}

      <form
        className="grid gap-4"
        aria-describedby={`${hintId} ${statusId}`}
        onSubmit={submitContactForm}
      >
        <div className="grid gap-1.5">
          <label htmlFor={nameId} className="text-xs font-medium text-slate-600">
            Name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            minLength={2}
            maxLength={100}
            className={inputClassName}
            aria-invalid={fieldErrors.name ? true : undefined}
            aria-describedby={fieldErrors.name ? nameErrorId : undefined}
            onChange={() => clearFieldError("name")}
            required
          />
          <FieldError id={nameErrorId} message={fieldErrors.name} />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor={emailId} className="text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            maxLength={254}
            className={inputClassName}
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? emailErrorId : undefined}
            onChange={() => clearFieldError("email")}
            required
          />
          <FieldError id={emailErrorId} message={fieldErrors.email} />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor={businessId}
            className="text-xs font-medium text-slate-600"
          >
            Business
          </label>
          <input
            id={businessId}
            name="business"
            type="text"
            autoComplete="organization"
            placeholder="Business name + industry"
            minLength={2}
            maxLength={160}
            className={inputClassName}
            aria-invalid={fieldErrors.business ? true : undefined}
            aria-describedby={fieldErrors.business ? businessErrorId : undefined}
            onChange={() => clearFieldError("business")}
            required
          />
          <FieldError id={businessErrorId} message={fieldErrors.business} />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor={projectTypeId}
            className="text-xs font-medium text-slate-600"
          >
            Project type
          </label>
          <select
            id={projectTypeId}
            name="projectType"
            className={inputClassName}
            value={projectTypeValue}
            onChange={(event) => {
              setProjectTypeValue(event.target.value);
              clearFieldError("projectType");
            }}
            aria-invalid={fieldErrors.projectType ? true : undefined}
            aria-describedby={
              fieldErrors.projectType ? projectTypeErrorId : undefined
            }
            required
          >
            {projectTypes.map((projectType) => (
              <option
                key={projectType.value || "placeholder"}
                value={projectType.value}
                disabled={!projectType.value}
              >
                {projectType.label}
              </option>
            ))}
          </select>
          <FieldError
            id={projectTypeErrorId}
            message={fieldErrors.projectType}
          />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor={messageId}
            className="text-xs font-medium text-slate-600"
          >
            Project details
          </label>
          <textarea
            id={messageId}
            name="message"
            placeholder="What would you like fixed or improved? For a larger project, tell us what the website should help customers do, plus any timing or features that matter."
            rows={6}
            minLength={20}
            maxLength={5000}
            className={`${inputClassName} resize-y`}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={fieldErrors.message ? messageErrorId : undefined}
            onChange={() => clearFieldError("message")}
            required
          />
          <FieldError id={messageErrorId} message={fieldErrors.message} />
        </div>

        <div
          className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
          aria-hidden="true"
        >
          <label htmlFor={`${id}-website`}>Leave this field empty</label>
          <input
            id={`${id}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {onlineFormAvailable ? (
          <div className="grid gap-1.5">
            <span className="text-xs font-medium text-slate-600">
              Spam protection
            </span>
            <div ref={turnstileContainerRef} />
            <FieldError
              id={turnstileErrorId}
              message={fieldErrors.turnstileToken}
            />
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Online submission is not configured in this build. Email directly
            instead.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonA
            href={`mailto:${email}?subject=Website%20project%20inquiry`}
            variant="secondary"
            className="sm:flex-1"
            analyticsLocation="contact"
            analyticsLabel="Email directly"
          >
            Email directly
          </ButtonA>
          <button
            type="submit"
            disabled={!onlineFormAvailable || !turnstileToken || isSubmitting}
            className="inline-flex touch-manipulation items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition duration-200 ease-out hover:bg-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none motion-reduce:active:scale-100 sm:flex-1"
          >
            {isSubmitting ? "Sending…" : "Send inquiry"}
          </button>
        </div>

        <p id={hintId} className="text-xs leading-relaxed text-slate-500">
          The online form uses Cloudflare Turnstile and Resend. Success
          confirms acceptance by the email service; errors preserve your
          entries. You can also email directly. Read the{" "}
          <Link
            href="/privacy"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            privacy notice
          </Link>
          .
        </p>
        <FieldError
          id={submissionErrorId}
          message={fieldErrors.submissionId}
        />
        <p
          id={statusId}
          role="status"
          aria-live="polite"
          className={[
            "min-h-5 text-sm",
            status.state === "success"
              ? "text-emerald-700"
              : status.state === "error"
                ? "text-red-700"
                : "text-slate-600",
          ].join(" ")}
        >
          {status.message}
        </p>
      </form>
    </>
  );
}

export function ContactForm({ email }: { email: string }) {
  return (
    <Suspense fallback={null}>
      <ContactFormInner email={email} />
    </Suspense>
  );
}
