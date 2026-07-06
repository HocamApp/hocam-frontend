"use client";

import { useState } from "react";
import Link from "next/link";
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

const forgotSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<ForgotFormValues>({
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setGeneralError(null);
    const parsed = forgotSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.email) form.setError("email", { message: err.fieldErrors.email[0] });
      return;
    }
    try {
      await requestPasswordReset({ email: parsed.data.email });
      setSubmitted(true);
    } catch {
      setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <AuthSplitScreen
      title="Şifreni sıfırla"
      description="E-posta adresini gir, sana güvenli bir sıfırlama bağlantısı gönderelim."
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
      {submitted ? (
        <p
          role="status"
          aria-live="polite"
          className="animate-element animate-delay-300 text-sm text-neutral-400"
        >
          Eğer bu email ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı
          gönderildi.
        </p>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {generalError && <ErrorMessage message={generalError} />}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="animate-element animate-delay-300 space-y-2">
                  <FormLabel className="text-sm font-medium text-neutral-400">
                    E-posta
                  </FormLabel>
                  <FormControl>
                    <GlassInputWrapper>
                      <input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="E-posta adresini gir"
                        className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                    </GlassInputWrapper>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="animate-element animate-delay-400 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                    aria-hidden
                  />
                  Gönderiliyor...
                </span>
              ) : (
                "Bağlantı Gönder"
              )}
            </button>
          </form>
        </Form>
      )}
    </AuthSplitScreen>
  );
}
