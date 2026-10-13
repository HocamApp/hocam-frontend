/**
 * The summary of rules a student accepts before paying for a lesson package
 * (GET /api/payments/policy-copy/, apps.payments.policy_copy on the backend).
 *
 * The text is the backend's, built from the numbers the rules themselves read;
 * the web shows it and never writes a number of its own. `version` is a digest
 * of the text, sent back as `policy_accepted_version` when the student ticks the
 * box, so a purchase records exactly what was on the screen.
 */

export interface PolicySection {
  id: string;
  title: string;
  body: string;
}

export interface PolicyLink {
  label: string;
  href: string;
}

export interface PolicyCopy {
  version: string;
  /** "approved" once a lawyer has signed this exact version; "draft" before. */
  status: "draft" | "approved";
  /** True when the server refuses a purchase that does not carry the version. */
  acceptance_required: boolean;
  sections: PolicySection[];
  consent_label: string;
  /** The wording of the button that opens the payment: it states the obligation. */
  pay_button_label: string;
  links: PolicyLink[];
}
