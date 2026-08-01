"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { confirmPasswordReset } from "@/lib/authApi";
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

const resetSchema = z
  .object({
    new_password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.password_confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["password_confirm"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

const PASSWORD_FIELD_KEYS = ["new_password", "password_confirm"] as const;

function InvalidLinkScreen() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <AuthSplitScreen
      title={
        <span ref={headingRef} tabIndex={-1} className="block focus:outline-none">
          Bağlantı geçersiz veya süresi dolmuş
        </span>
      }
      description="Bu sıfırlama bağlantısı artık kullanılamıyor. Yeni bir bağlantı isteyebilirsin."
      footer={
        <p className="animate-element animate-delay-400 text-center text-sm">
          <Link
            href="/login"
            className="text-neutral-300 transition-colors hover:text-white hover:underline"
          >
            Girişe dön
          </Link>
        </p>
      }
    >
      <div className="animate-element animate-delay-300">
        <Link
          href="/forgot-password"
          className="block w-full rounded-2xl bg-white py-4 text-center font-medium text-neutral-950 transition-colors hover:bg-white/90"
        >
          Yeni bağlantı gönder
        </Link>
      </div>
    </AuthSplitScreen>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // uid/token are captured once on mount, then scrubbed from the address bar so
  // the secrets do not linger in history, referrers or screenshots.
  const [credentials, setCredentials] = useState<{ uid: string; token: string } | null>(null);
  const [linkChecked, setLinkChecked] = useState(false);
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current) return;
    capturedRef.current = true;
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");
    if (uid && token) setCredentials({ uid, token });
    window.history.replaceState(null, "", window.location.pathname);
    setLinkChecked(true);
  }, [searchParams]);

  const [linkInvalid, setLinkInvalid] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const submittingRef = useRef(false);

  const form = useForm<ResetFormValues>({
    defaultValues: { new_password: "", password_confirm: "" },
    mode: "onSubmit",
  });

  if (!linkChecked) return null;

  if (!credentials || linkInvalid) {
    return <InvalidLinkScreen />;
  }

  const onSubmit = async (data: ResetFormValues) => {
    if (submittingRef.current) return;
    setGeneralError(null);
    const parsed = resetSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.new_password) form.setError("new_password", { message: err.fieldErrors.new_password[0] });
      if (err.fieldErrors.password_confirm) form.setError("password_confirm", { message: err.fieldErrors.password_confirm[0] });
      return;
    }
    submittingRef.current = true;
    try {
      await confirmPasswordReset({
        uid: credentials.uid,
        token: credentials.token,
        new_password: parsed.data.new_password,
        password_confirm: parsed.data.password_confirm,
      });
      toast.success("Şifren başarıyla yenilendi. Yeni şifrenle giriş yapabilirsin.");
      router.push("/login");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const status = err.response.status;
        const body = err.response.data as Record<string, unknown> | null | undefined;
        const keys = body && typeof body === "object" ? Object.keys(body) : [];
        const passwordKeys = keys.filter((key) =>
          (PASSWORD_FIELD_KEYS as readonly string[]).includes(key)
        );
        if (status >= 400 && status < 500) {
          if (passwordKeys.length > 0) {
            // Password validation errors stay inline, next to their fields.
            for (const key of passwordKeys) {
              const value = body?.[key];
              const message = Array.isArray(value) ? String(value[0]) : String(value);
              form.setError(key as (typeof PASSWORD_FIELD_KEYS)[number], { message });
            }
          } else {
            // uid/token problems (invalid, expired, used) — never distinguished.
            setLinkInvalid(true);
          }
        } else {
          setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } else {
        setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <AuthSplitScreen
      title="Yeni şifre belirle"
      description="Hesabına tekrar güvenle dönebilmen için yeni şifreni oluştur."
      footer={
        <p className="animate-element animate-delay-600 text-center text-sm">
          <Link
            href="/login"
            className="text-neutral-300 transition-colors hover:text-white hover:underline"
          >
            Girişe dön
          </Link>
        </p>
      }
    >
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {generalError && <ErrorMessage message={generalError} />}

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem className="animate-element animate-delay-300 space-y-2">
                  <FormLabel htmlFor="new-password" className="text-sm font-medium text-neutral-400">
                    Yeni şifre
                  </FormLabel>
                  <FormControl>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          {...field}
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Yeni şifreni gir"
                          className="w-full rounded-2xl bg-transparent p-4 pr-12 text-base text-white placeholder:text-neutral-500 focus:outline-none lg:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white"
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <Eye className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password_confirm"
              render={({ field }) => (
                <FormItem className="animate-element animate-delay-400 space-y-2">
                  <FormLabel htmlFor="password-confirm" className="text-sm font-medium text-neutral-400">
                    Şifre tekrar
                  </FormLabel>
                  <FormControl>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          {...field}
                          id="password-confirm"
                          type={showPasswordConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Yeni şifreni tekrar gir"
                          className="w-full rounded-2xl bg-transparent p-4 pr-12 text-base text-white placeholder:text-neutral-500 focus:outline-none lg:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white"
                          aria-label={showPasswordConfirm ? "Şifre tekrarını gizle" : "Şifre tekrarını göster"}
                          aria-pressed={showPasswordConfirm}
                        >
                          {showPasswordConfirm ? (
                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <Eye className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </GlassInputWrapper>
                  </FormControl>
                  <FormMessage role="alert" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="animate-element animate-delay-500 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
            >
              {form.formState.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                    aria-hidden
                  />
                  Kaydediliyor...
                </span>
              ) : (
                "Şifremi Sıfırla"
              )}
            </button>
          </form>
      </Form>
    </AuthSplitScreen>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
