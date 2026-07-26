"use client";

import Link from "next/link";
import Script from "next/script";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ButtonA } from "@/components/Button";
import { trackGenerateLead } from "@/lib/analytics";

const TURNSTILE_ACTION = "contact";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

const projectTypes = [
  { value: "", label: "Choose the closest fit" },
  { value: "one-page", label: "One-Page Launch" },
  { value: "business-website", label: "Business Website" },
  { value: "online-store", label: "Online Store" },
  { value: "custom", label: "Custom Project" },
  { value: "unsure", label: "Not sure yet" },
] as const;

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
};

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

export function ContactForm({ email }: { email: string }) {
  const id = useId();
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>({
    state: "idle",
    message: "",
  });

  const nameId = `${id}-name`;
  const emailId = `${id}-email`;
  const businessId = `${id}-business`;
  const projectTypeId = `${id}-project-type`;
  const messageId = `${id}-message`;
  const statusId = `${id}-status`;
  const hintId = `${id}-hint`;

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
    const submissionId = submissionIdRef.current ?? createSubmissionId();
    submissionIdRef.current = submissionId;
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      business: String(data.get("business") || ""),
      projectType: String(data.get("projectType") || ""),
      message: String(data.get("message") || ""),
      website: String(data.get("website") || ""),
      turnstileToken,
      submissionId,
    };

    setStatus({ state: "submitting", message: "Sending your inquiry…" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => ({}))) as ContactResponse;

      if (!response.ok || !result.ok) {
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
        message: result.message || "Your inquiry was delivered.",
      });
      form.reset();
      submissionIdRef.current = null;
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
            required
          />
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
            required
          />
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
            required
          />
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
            defaultValue=""
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
            placeholder="What does your business do, what should the website help customers do, and what timing or features matter?"
            rows={6}
            minLength={20}
            maxLength={5000}
            className={`${inputClassName} resize-y`}
            required
          />
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
          The online form uses Cloudflare Turnstile for spam protection and a
          server-side email provider for delivery. Read the{" "}
          <Link
            href="/privacy"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            privacy notice
          </Link>
          . The direct email link remains available as a fallback.
        </p>
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
