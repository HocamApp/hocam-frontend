"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { googleAuth, loginUser, fetchMe } from "@/lib/authApi";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GlassInputWrapper } from "@/components/auth/AuthSplitScreen";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  /** When provided, the "Hesap oluştur" footer switches mode in place instead of navigating. */
  onCreateAccount?: () => void;
}

export function LoginForm({ onCreateAccount }: LoginFormProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "tutor") {
        router.replace(user.tutor_profile_id ? "/dashboard/tutor" : "/tutor/setup");
      } else {
        router.replace("/dashboard/student");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const onSubmit = async (data: LoginFormValues) => {
    setGeneralError(null);
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.email) form.setError("email", { message: err.fieldErrors.email[0] });
      if (err.fieldErrors.password) form.setError("password", { message: err.fieldErrors.password[0] });
      return;
    }

    try {
      const { token } = await loginUser(parsed.data.email, parsed.data.password);
      Cookies.set("auth_token", token, { expires: 7 });
      const user = await fetchMe();
      setAuth(user, token);
      if (user.role === "tutor") {
        router.push(user.tutor_profile_id ? "/dashboard/tutor" : "/tutor/setup");
      } else {
        router.push("/dashboard/student");
      }
    } catch {
      setGeneralError("E-posta veya şifre hatalı.");
    }
  };

  const finishGoogleSuccess = useCallback(
    async (token: string) => {
      Cookies.set("auth_token", token, { expires: 7 });
      const me = await fetchMe();
      setAuth(me, token);
      if (me.role === "tutor") {
        router.push(me.tutor_profile_id ? "/dashboard/tutor" : "/tutor/setup");
      } else {
        router.push("/dashboard/student");
      }
    },
    [router, setAuth]
  );

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setGeneralError(null);
      setGoogleLoading(true);
      try {
        const resp = await googleAuth({ credential });
        if ("needs_role" in resp) {
          // New user — collect a role, then retry with the same credential.
          setPendingCredential(credential);
        } else {
          await finishGoogleSuccess(resp.token);
        }
      } catch {
        setGeneralError("Google ile giriş başarısız oldu. Lütfen tekrar deneyin.");
      } finally {
        setGoogleLoading(false);
      }
    },
    [finishGoogleSuccess]
  );

  const handleGoogleRoleChoice = useCallback(
    async (role: "student" | "tutor") => {
      if (!pendingCredential) return;
      setGeneralError(null);
      setGoogleLoading(true);
      try {
        const resp = await googleAuth({ credential: pendingCredential, role });
        if ("needs_role" in resp) {
          setGeneralError("Hesap oluşturulamadı. Lütfen tekrar deneyin.");
          setPendingCredential(null);
          return;
        }
        await finishGoogleSuccess(resp.token);
      } catch {
        setGeneralError(
          "Google ile giriş başarısız oldu. Bağlantının süresi dolmuş olabilir, tekrar deneyin."
        );
        setPendingCredential(null);
      } finally {
        setGoogleLoading(false);
      }
    },
    [pendingCredential, finishGoogleSuccess]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-400 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  Şifre
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Şifreni gir"
                        className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-neutral-400 transition-colors hover:text-white"
                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name="rememberMe"
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white"
              />
              <span className="text-white/90">Oturumumu açık tut</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-neutral-300 transition-colors hover:text-white hover:underline"
            >
              Şifremi sıfırla
            </Link>
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="animate-element animate-delay-600 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                  aria-hidden
                />
                Giriş Yap
              </span>
            ) : (
              "Giriş Yap"
            )}
          </button>
        </form>
      </Form>

      <div className="animate-element animate-delay-700 relative flex items-center justify-center">
        <span className="w-full border-t border-white/10" />
        <span className="absolute bg-neutral-950 px-4 text-sm text-neutral-400">
          veya devam et
        </span>
      </div>

      <div className="animate-element animate-delay-800">
        {pendingCredential ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-neutral-300">
              Devam etmek için hesap türünü seç
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleRoleChoice("student")}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                Öğrenciyim
              </button>
              <button
                type="button"
                disabled={googleLoading}
                onClick={() => handleGoogleRoleChoice("tutor")}
                className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                Hocayım
              </button>
            </div>
          </div>
        ) : (
          <GoogleSignInButton onCredential={handleGoogleCredential} text="continue_with" />
        )}
      </div>

      <p className="animate-element animate-delay-900 text-center text-sm text-neutral-400">
        Hesabın yok mu?{" "}
        {onCreateAccount ? (
          <button
            type="button"
            onClick={onCreateAccount}
            className="text-white transition-colors hover:underline"
          >
            Hesap oluştur
          </button>
        ) : (
          <Link
            href="/register"
            className="text-white transition-colors hover:underline"
          >
            Hesap oluştur
          </Link>
        )}
      </p>
    </div>
  );
}
