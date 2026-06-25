"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { loginUser, fetchMe } from "@/lib/authApi";
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

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

interface LoginFormProps {
  /** When provided, the "Hesap oluştur" footer switches mode in place instead of navigating. */
  onCreateAccount?: () => void;
}

export function LoginForm({ onCreateAccount }: LoginFormProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

      {/* TODO: wire Google auth when backend supports it — visual/disabled for now */}
      <button
        type="button"
        disabled
        title="Yakında"
        className="animate-element animate-delay-800 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-white/10 py-4 text-white opacity-60"
      >
        <GoogleIcon />
        Google ile devam et
      </button>

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
