"use client";

import { useId } from "react";
import { ButtonA } from "@/components/Button";

export function ContactForm({ email }: { email: string }) {
  const id = useId();
  const nameId = `${id}-name`;
  const businessId = `${id}-business`;
  const messageId = `${id}-message`;

  return (
    <form
      className="grid gap-4"
      aria-describedby={`${id}-hint`}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") || "");
        const business = String(data.get("business") || "");
        const message = String(data.get("message") || "");
        const subject = encodeURIComponent("Project inquiry");
        const body = encodeURIComponent(`Name: ${name}\nBusiness: ${business}\n\nMessage:\n${message}\n`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      }}
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
          className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={businessId} className="text-xs font-medium text-slate-600">
          Business
        </label>
        <input
          id={businessId}
          name="business"
          type="text"
          autoComplete="organization"
          placeholder="Business name + industry"
          className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={messageId} className="text-xs font-medium text-slate-600">
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          placeholder="What do you need built? (website, app, timeline, etc.)"
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 placeholder:text-slate-400 transition-colors focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          required
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonA href={`mailto:${email}?subject=Project%20inquiry`} variant="secondary" className="sm:flex-1">
          Email directly
        </ButtonA>
        <button
          type="submit"
          className="inline-flex touch-manipulation items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition duration-200 ease-out hover:bg-blue-500 active:scale-[0.98] motion-reduce:active:scale-100 sm:flex-1"
        >
          Send message
        </button>
      </div>
      <p id={`${id}-hint`} className="text-xs text-slate-500">
        Opens your email app to send to {email}.
      </p>
    </form>
  );
}
