"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import { registerUser } from "@/lib/authApi";
import { AuthResponse } from "@/types";
import { ApiError } from "@/types";
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
import { cn } from "@/lib/utils";
import { GlassInputWrapper } from "@/components/auth/AuthSplitScreen";

const registerSchema = z
  .object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
    password_confirm: z.string(),
    role: z.enum(["student", "tutor"]).optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Şifreler eşleşmiyor",
    path: ["password_confirm"],
  })
  .refine((data) => data.role === "student" || data.role === "tutor", {
    message: "Hesap türü seçin",
    path: ["role"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  /** Initial selected account type. */
  initialRole?: "student" | "tutor";
  /** When provided, the "Giriş yap" footer switches mode in place instead of navigating. */
  onSignIn?: () => void;
  /** Reports the currently selected role so the parent can drive the heading description. */
  onRoleChange?: (role: "student" | "tutor") => void;
}

export function RegisterForm({
  initialRole = "student",
  onSignIn,
  onRoleChange,
}: RegisterFormProps) {
  const router = useRouter();
  const { setAuth, isAuthenticated, isLoading, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      role: initialRole,
    },
    mode: "onSubmit",
  });

  const role = form.watch("role");

  useEffect(() => {
    if (role === "student" || role === "tutor") {
      onRoleChange?.(role);
    }
  }, [role, onRoleChange]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === "tutor") {
        router.replace(user.tutor_profile_id ? "/dashboard/tutor" : "/tutor/setup");
      } else {
        router.replace("/dashboard/student");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  const onSubmit = async (data: RegisterFormValues) => {
    setGeneralError(null);
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.email) form.setError("email", { message: err.fieldErrors.email[0] });
      if (err.fieldErrors.password) form.setError("password", { message: err.fieldErrors.password[0] });
      if (err.fieldErrors.password_confirm) form.setError("password_confirm", { message: err.fieldErrors.password_confirm[0] });
      if (err.fieldErrors.role) form.setError("role", { message: err.fieldErrors.role[0] });
      return;
    }

    try {
      const res: AuthResponse = await registerUser({
        ...parsed.data,
        role: parsed.data.role as "student" | "tutor",
      });
      setAuth(res.user, res.token);
      if (res.user.role === "tutor") {
        router.push("/tutor/setup");
      } else {
        router.push("/dashboard/student");
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data) {
        const body = err.response.data as ApiError;
        if (body.email) form.setError("email", { message: body.email[0] });
        if (body.password) form.setError("password", { message: body.password[0] });
        if (body.password_confirm) form.setError("password_confirm", { message: body.password_confirm[0] });
        if (body.role) form.setError("role", { message: body.role[0] });
        const otherKeys = Object.keys(body).filter((k) => !["email", "password", "password_confirm", "role"].includes(k));
        if (otherKeys.length > 0) {
          setGeneralError(otherKeys.map((k) => (body as Record<string, string[]>)[k].join(" ")).join(" "));
        }
      } else if (axios.isAxiosError(err) && err.response) {
        setGeneralError(`Sunucu hatası (${err.response.status}). Lütfen tekrar deneyin.`);
      } else {
        setGeneralError("Bağlantı kurulamadı. API sunucusunun (http://localhost:8000) çalıştığından emin olun.");
      }
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

  const roleButtonClass = (value: "student" | "tutor") =>
    cn(
      "flex-1 rounded-2xl border py-3 text-sm font-medium transition-colors",
      role === value
        ? "border-white bg-white text-neutral-950"
        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
    );

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {generalError && <ErrorMessage message={generalError} />}

          <div className="animate-element animate-delay-300 flex gap-3">
            <button
              type="button"
              onClick={() => form.setValue("role", "student")}
              className={roleButtonClass("student")}
            >
              Öğrenci
            </button>
            <button
              type="button"
              onClick={() => form.setValue("role", "tutor")}
              className={roleButtonClass("tutor")}
            >
              Hoca
            </button>
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-400 space-y-2">
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
              <FormItem className="animate-element animate-delay-500 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  Şifre
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
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

          <FormField
            control={form.control}
            name="password_confirm"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-600 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  Şifre tekrar
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        {...field}
                        type={showPasswordConfirm ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Şifreni tekrar gir"
                        className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-neutral-400 transition-colors hover:text-white"
                        aria-label={showPasswordConfirm ? "Şifreyi gizle" : "Şifreyi göster"}
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* role refine error surfaces here if no role selected */}
          <FormField
            control={form.control}
            name="role"
            render={() => (
              <FormItem className="space-y-0">
                <FormMessage />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="animate-element animate-delay-700 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                  aria-hidden
                />
                Kayıt Ol
              </span>
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>
      </Form>

      <p className="animate-element animate-delay-800 text-center text-sm text-neutral-400">
        Zaten hesabın var mı?{" "}
        {onSignIn ? (
          <button
            type="button"
            onClick={onSignIn}
            className="text-white transition-colors hover:underline"
          >
            Giriş yap
          </button>
        ) : (
          <Link href="/login" className="text-white transition-colors hover:underline">
            Giriş yap
          </Link>
        )}
      </p>
    </div>
  );
}
