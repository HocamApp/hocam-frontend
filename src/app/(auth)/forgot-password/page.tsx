"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/authApi";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AuthSplitScreen, GlassInputWrapper } from "@/components/auth/AuthSplitScreen";

const RESEND_COOLDOWN_SECONDS = 60;

const forgotSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi gir."),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

// Safe, enumeration-free messages. Backend `detail` payloads are never rendered.
function mapRequestError(err: unknown): string {
  if (axios.isAxiosError(err) && err.response?.status === 429) {
    return "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar dene.";
  }
  return "Bir sorun oluştu. Lütfen biraz sonra tekrar dene.";
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const submittingRef = useRef(false);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const form = useForm<ForgotFormValues>({
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  // Move focus to the success heading when it appears (screen-reader announcement).
  useEffect(() => {
    if (sent) successHeadingRef.current?.focus();
  }, [sent]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onSubmit = async (data: ForgotFormValues) => {
    if (submittingRef.current) return;
    setGeneralError(null);
    // Frontend trim only — backend validation still applies.
    const parsed = forgotSchema.safeParse({ email: data.email.trim() });
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.email) form.setError("email", { message: err.fieldErrors.email[0] });
      return;
    }
    submittingRef.current = true;
    try {
      await requestPasswordReset({ email: parsed.data.email });
      setSentEmail(parsed.data.email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setSent(true);
    } catch (err) {
      setGeneralError(mapRequestError(err));
    } finally {
      submittingRef.current = false;
    }
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    setGeneralError(null);
    setResending(true);
    try {
      await requestPasswordReset({ email: sentEmail });
      // Same generic success state — no account-existence signal.
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setGeneralError(mapRequestError(err));
    } finally {
      setResending(false);
    }
  };

  const onChangeEmail = () => {
    setGeneralError(null);
    form.setValue("email", sentEmail);
    setSent(false);
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <AuthSplitScreen
      title="Şifreni sıfırla"
      description="Hesabında kullandığın e-posta adresini gir. Şifreni yenileyebilmen için sana bir sıfırlama bağlantısı göndereceğiz."
      footer={
        <p className="animate-element animate-delay-500 text-center text-sm">
          <Link
            href="/login"
            className="text-neutral-300 transition-colors hover:text-white hover:underline"
          >
            Girişe dön
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="animate-element animate-delay-300 space-y-5">
          <div className="space-y-2">
            <h2
              ref={successHeadingRef}
              tabIndex={-1}
              className="text-xl font-semibold text-white focus:outline-none"
            >
              E-postanı kontrol et
            </h2>
            <p className="text-sm text-neutral-400">
              Bu e-posta adresiyle eşleşen bir hesap varsa, şifre sıfırlama
              bağlantısını gönderdik. Gelen kutunu ve spam klasörünü kontrol et.
            </p>
          </div>
          {generalError && <ErrorMessage message={generalError} />}
          <div className="space-y-3">
            <button
              type="button"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
              className="w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                    aria-hidden
                  />
                  Gönderiliyor...
                </span>
              ) : cooldown > 0 ? (
                `Tekrar gönder (${cooldown})`
              ) : (
                "Bağlantıyı tekrar gönder"
              )}
            </button>
            <button
              type="button"
              onClick={onChangeEmail}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 font-medium text-neutral-200 transition-colors hover:bg-white/10"
            >
              E-posta adresini değiştir
            </button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            {generalError && <ErrorMessage message={generalError} />}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="animate-element animate-delay-300 space-y-2">
                  <FormLabel htmlFor="reset-email" className="text-sm font-medium text-neutral-400">
                    E-posta adresi
                  </FormLabel>
                  <FormControl>
                    <GlassInputWrapper>
                      <input
                        {...field}
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        placeholder="ornek@email.com"
                        className="w-full rounded-2xl bg-transparent p-4 text-base text-white placeholder:text-neutral-500 focus:outline-none lg:text-sm"
                      />
                    </GlassInputWrapper>
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="animate-element animate-delay-400 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                    aria-hidden
                  />
                  Gönderiliyor...
                </span>
              ) : (
                "Sıfırlama bağlantısı gönder"
              )}
            </button>
          </form>
        </Form>
      )}
    </AuthSplitScreen>
  );
}
