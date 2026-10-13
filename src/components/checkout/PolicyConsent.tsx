"use client";

import { useState } from "react";
import type { RefObject } from "react";

import { InlineError } from "@/components/shared/InlineError";
import type { PolicyCopy } from "@/types";

export const POLICY_CONSENT_ERROR = "Ödemeye geçmek için koşulları onaylaman gerekiyor.";

interface PolicyConsentProps {
  policy: PolicyCopy;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  /** Show the "you have to accept" error under the box. */
  showError: boolean;
  /** So the page can move focus to the box when the student presses the pay
   * button without ticking it. */
  checkboxRef?: RefObject<HTMLInputElement>;
}

/**
 * The summary of rules, and the one box that accepts them.
 *
 * The summary is the backend's text (`PolicyCopy`), shown behind a disclosure
 * so the page stays short and a student who wants the details has them one
 * press away; the box and the links to the legal pages are always visible.
 * The box follows the registration clickwrap (DESIGN.md §10): a 24px box in a
 * row of at least 44px, never pre-ticked, always enabled, and pressing the pay
 * button without it shows the standard inline error and focuses the box.
 */
export function PolicyConsent({
  policy,
  accepted,
  onAcceptedChange,
  showError,
  checkboxRef,
}: PolicyConsentProps) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-labelledby="policy-title" className="mt-3">
      <div className="flex items-center justify-between gap-4">
        <h2 id="policy-title" className="text-sm font-bold">
          Önemli koşullar
        </h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="policy-sections"
          onClick={() => setOpen((value) => !value)}
          className="min-h-8 text-xs underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkout-control)]"
        >
          {open ? "Özeti gizle" : "Özeti göster"}
        </button>
      </div>

      {open && (
        <dl id="policy-sections" className="mt-2 space-y-3 text-xs leading-5">
          {policy.sections.map((section) => (
            <div key={section.id}>
              <dt className="font-bold">{section.title}</dt>
              <dd className="mt-0.5 opacity-80">{section.body}</dd>
            </div>
          ))}
        </dl>
      )}

      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2.5 text-xs leading-5">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={accepted}
          onChange={(event) => onAcceptedChange(event.target.checked)}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? "policy-consent-error" : undefined}
          className="size-6 shrink-0 cursor-pointer rounded accent-[var(--checkout-control)]"
        />
        <span>{policy.consent_label}</span>
      </label>
      <p className="text-xs leading-5 opacity-80">
        {policy.links.map((link, index) => (
          <span key={link.href}>
            {index > 0 && " · "}
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {link.label}
            </a>
          </span>
        ))}
      </p>
      {showError && (
        <InlineError
          id="policy-consent-error"
          size="sm"
          className="mt-2"
          message={POLICY_CONSENT_ERROR}
        />
      )}
    </section>
  );
}
