import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRuleResult = {
  id: "length" | "case" | "numberOrSymbol";
  label: string;
  met: boolean;
};

const characters = (value: string) => Array.from(value);
const isLetter = (character: string) =>
  character.toLocaleUpperCase("tr-TR") !== character.toLocaleLowerCase("tr-TR");
const hasUpper = (value: string) => characters(value).some((character) => character.toLocaleUpperCase("tr-TR") === character && isLetter(character));
const hasLower = (value: string) => characters(value).some((character) => character.toLocaleLowerCase("tr-TR") === character && isLetter(character));
const hasNumberOrSymbol = (value: string) =>
  characters(value).some(
    (character) => /[0-9]/.test(character) || (!isLetter(character) && !/\s/.test(character))
  );

const COMMON_PATTERN = /^(?:password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|123456)/i;
const REPEATED_PATTERN = /(.)\1{3,}/;
const SEQUENCE_PATTERN = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|erty|asdf)/i;

export function evaluatePassword(value: string) {
  const rules: PasswordRuleResult[] = [
    {
      id: "length",
      label: "En az 8 karakter",
      met: characters(value).length >= PASSWORD_MIN_LENGTH && characters(value).length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "case",
      label: "Bir büyük ve bir küçük harf",
      met: hasUpper(value) && hasLower(value),
    },
    {
      id: "numberOrSymbol",
      label: "Bir sayı veya sembol",
      met: hasNumberOrSymbol(value),
    },
  ];
  const guessable =
    value.length > 0 &&
    (COMMON_PATTERN.test(value) || REPEATED_PATTERN.test(value) || SEQUENCE_PATTERN.test(value));
  const score = guessable
    ? Math.min(1, rules.length)
    : rules.reduce((total, rule) => total + (rule.met ? 1 : 0), 0);
  const labels = ["Boş", "Zayıf", "Orta", "Güçlü"] as const;
  return { rules, guessable, score, max: rules.length, label: labels[score] };
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "Şifre en az 8 karakter olmalıdır")
  .max(PASSWORD_MAX_LENGTH, "Şifre en fazla 128 karakter olabilir")
  .superRefine((value, context) => {
    if (!hasUpper(value)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Şifre en az bir büyük harf içermelidir" });
    }
    if (!hasLower(value)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Şifre en az bir küçük harf içermelidir" });
    }
    if (!hasNumberOrSymbol(value)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Şifre bir sayı veya sembol içermelidir" });
    }
  });

export function passwordsMatchMessage(password: string, confirmation: string) {
  if (!confirmation) return null;
  return password === confirmation ? "Şifreler eşleşiyor." : "Şifreler eşleşmiyor.";
}
