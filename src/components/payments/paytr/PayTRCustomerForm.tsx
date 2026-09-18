"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import { InlineError } from "@/components/shared/InlineError";

import { PayTRLegalNotice } from "./PayTRLegalNotice";
import {
  PAYTR_CUSTOMER_FIELD_ORDER,
  paytrCustomerSchema,
  type PayTRCustomerField,
  type PayTRCustomerFormValues,
} from "./paytrCustomerSchema";

/**
 * The only form HOCAM shows for a payment. It collects a name, a phone number
 * and an address — the fields PayTR requires of the merchant — and nothing
 * else. Card number, expiry, CVV, OTP and 3D Secure stay inside the provider's
 * own iframe, which is why there is a line here saying so.
 *
 * Values are never restored after a reload: the form holds them in memory for
 * exactly as long as the attempt takes.
 */

export interface PayTRCustomerFormProps {
  onSubmit: (values: PayTRCustomerFormValues) => void | Promise<void>;
  /** The parent's token request is in flight. */
  isSubmitting?: boolean;
  /** Safe, already-mapped server messages from describePayTRCheckoutError. */
  fieldErrors?: Partial<Record<PayTRCustomerField, string>>;
  formError?: string | null;
}

const FIELD_LABELS: Record<PayTRCustomerField, string> = {
  user_name: "Ad soyad",
  user_phone: "Telefon",
  user_address: "Adres",
};

const inputClassName =
  "w-full rounded-[10px] border border-[#5c6b6d] bg-white px-3 text-base text-[#02171a] placeholder:text-[#5c6b6d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2 focus-visible:ring-offset-white read-only:bg-[#fbf6f6]";

export function PayTRCustomerForm({
  onSubmit,
  isSubmitting = false,
  fieldErrors,
  formError,
}: PayTRCustomerFormProps) {
  const fieldId = React.useId();
  const form = useForm<PayTRCustomerFormValues>({
    defaultValues: { user_name: "", user_phone: "", user_address: "" },
    mode: "onSubmit",
  });
  const [summary, setSummary] = React.useState<string | null>(null);
  // Synchronous, so three impatient clicks still buy exactly one attempt. The
  // server opens a new PayTR attempt for every accepted POST.
  const inFlight = React.useRef(false);

  const ids = (field: PayTRCustomerField) => ({
    input: `${fieldId}-${field}`,
    error: `${fieldId}-${field}-error`,
  });

  const errorFor = (field: PayTRCustomerField) =>
    form.formState.errors[field]?.message ?? fieldErrors?.[field];

  const handleValid = async (values: PayTRCustomerFormValues) => {
    if (inFlight.current || isSubmitting) return;
    const parsed = paytrCustomerSchema.safeParse(values);
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      for (const field of PAYTR_CUSTOMER_FIELD_ORDER) {
        const message = issues[field]?.[0];
        if (message) form.setError(field, { message });
      }
      const firstInvalid = PAYTR_CUSTOMER_FIELD_ORDER.find(
        (field) => issues[field]?.[0]
      );
      if (firstInvalid) {
        setSummary("Eksik veya hatalı alanları kontrol et.");
        form.setFocus(firstInvalid);
      }
      return;
    }

    setSummary(null);
    inFlight.current = true;
    try {
      await onSubmit(parsed.data);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(handleValid)}
      className="rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6"
    >
      <h2 className="text-[1.375rem] font-semibold leading-8">
        Ödeme için gereken bilgiler
      </h2>
      <p className="mt-2 text-sm text-[#5c6b6d]">Tüm alanlar zorunludur.</p>

      <div className="mt-6 space-y-5">
        {PAYTR_CUSTOMER_FIELD_ORDER.map((field) => {
          const { input, error } = ids(field);
          const message = errorFor(field);
          const shared = {
            id: input,
            readOnly: isSubmitting,
            "aria-invalid": message ? (true as const) : undefined,
            "aria-describedby": message ? error : undefined,
          };
          return (
            <div key={field}>
              <label
                htmlFor={input}
                className="mb-2 block text-sm font-medium text-[#02171a]"
              >
                {FIELD_LABELS[field]}
              </label>
              {field === "user_address" ? (
                <textarea
                  {...shared}
                  {...form.register("user_address")}
                  autoComplete="street-address"
                  rows={3}
                  className={`${inputClassName} min-h-[7rem] resize-y py-3`}
                />
              ) : (
                <input
                  {...shared}
                  {...form.register(field)}
                  type={field === "user_phone" ? "tel" : "text"}
                  inputMode={field === "user_phone" ? "tel" : undefined}
                  autoComplete={field === "user_phone" ? "tel" : "name"}
                  className={`${inputClassName} h-12`}
                />
              )}
              {message && (
                <InlineError
                  id={error}
                  // The field already points here through aria-describedby;
                  // a second, assertive announcement would repeat it.
                  role="presentation"
                  size="sm"
                  message={message}
                  className="mt-2"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* One polite announcement per failed submit, instead of one per field. */}
      <p role="status" className="sr-only">
        {summary ?? ""}
      </p>

      {formError && <InlineError message={formError} className="mt-5" />}

      <PayTRLegalNotice className="mt-6" />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 flex min-h-[3rem] w-full items-center justify-center rounded-full bg-[var(--pink-deep)] px-5 py-3 text-base font-medium text-white transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2 disabled:bg-[#e6dddd] disabled:text-[#5c6b6d]"
      >
        {isSubmitting ? "Ödeme ekranı hazırlanıyor…" : "Güvenli ödemeye geç"}
      </button>
      <p className="mt-3 text-sm text-[#5c6b6d]">
        Kart bilgilerini PayTR ödeme ekranında gireceksin.
      </p>
    </form>
  );
}
