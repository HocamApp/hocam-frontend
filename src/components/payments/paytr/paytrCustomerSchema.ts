import { z } from "zod";

/**
 * The three things PayTR needs from the student, and the only validation the
 * browser performs on them. The backend validates again and is authoritative;
 * this exists so a missing field is caught before a token attempt is spent.
 */

/** Separators people actually type: spaces (including the non-breaking one
 * pasted from contact apps), brackets, dashes, dots and slashes. */
const PHONE_SEPARATORS = /[\s ()[\]\-–—./]/g;

/**
 * Strips formatting and keeps an optional single leading +, because the
 * country code belongs to the person typing it. Nothing is prefixed, assumed
 * or trimmed to fit: a number this cannot normalize is rejected, not repaired.
 */
export function normalizePayTRPhone(raw: string): string {
  return raw.trim().replace(PHONE_SEPARATORS, "");
}

/** E.164 allows 15 digits; the backend column stops at 20 characters. Seven
 * digits is the shortest national number in use, and is not a country rule. */
const PHONE_SHAPE = /^\+?\d{7,}$/;
const PHONE_MAX_LENGTH = 20;

const trimmed = z.string().transform((value) => value.trim());

export const paytrCustomerSchema = z.object({
  user_name: trimmed.refine(
    (value) => value.length >= 2 && value.length <= 60,
    { message: "Ad soyad 2–60 karakter olmalı." }
  ),
  user_address: trimmed.refine(
    (value) => value.length >= 5 && value.length <= 400,
    { message: "Adres 5–400 karakter olmalı." }
  ),
  user_phone: z
    .string()
    .transform(normalizePayTRPhone)
    .refine(
      (value) => PHONE_SHAPE.test(value) && value.length <= PHONE_MAX_LENGTH,
      { message: "Geçerli bir telefon numarası gir." }
    ),
});

export type PayTRCustomerFormValues = z.infer<typeof paytrCustomerSchema>;
export type PayTRCustomerField = keyof PayTRCustomerFormValues;

/** Submit order, which is also the order errors are reported in. */
export const PAYTR_CUSTOMER_FIELD_ORDER: PayTRCustomerField[] = [
  "user_name",
  "user_phone",
  "user_address",
];
