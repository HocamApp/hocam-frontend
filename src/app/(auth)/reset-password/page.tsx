"use client";

import { Suspense, useState } from "react";
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

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const form = useForm<ResetFormValues>({
    defaultValues: { new_password: "", password_confirm: "" },
    mode: "onSubmit",
  });

  if (!uid || !token) {
    return (
      <AuthSplitScreen
        title="Bağlantı geçersiz"
        description="Şifre sıfırlama bağlantısı eksik veya hatalı."
        footer={
          <p className="animate-element animate-delay-400 text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-neutral-300 transition-colors hover:text-white hover:underline"
            >
              Şifre sıfırlama isteği gönder
            </Link>
          </p>
        }
      >
        <div className="animate-element animate-delay-300">
          <ErrorMessage message="Bu bağlantı geçerli değil. Lütfen yeni bir şifre sıfırlama isteği gönderin." />
        </div>
      </AuthSplitScreen>
    );
  }

  const onSubmit = async (data: ResetFormValues) => {
    setGeneralError(null);
    const parsed = resetSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.new_password) form.setError("new_password", { message: err.fieldErrors.new_password[0] });
      if (err.fieldErrors.password_confirm) form.setError("password_confirm", { message: err.fieldErrors.password_confirm[0] });
      return;
    }
    try {
      await confirmPasswordReset({
        uid,
        token,
        new_password: parsed.data.new_password,
        password_confirm: parsed.data.password_confirm,
      });
      toast.success("Şifren başarıyla sıfırlandı. Yeni şifrenle giriş yapabilirsin.");
      router.push("/login");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response && err.response.status >= 400 && err.response.status < 500) {
        setGeneralError(
          "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin."
        );
      } else {
        setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
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
                  <FormLabel className="text-sm font-medium text-neutral-400">
                    Yeni şifre
                  </FormLabel>
                  <FormControl>
                    <GlassInputWrapper>
                      <div className="relative">
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder="Yeni şifreni gir"
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
                <FormItem className="animate-element animate-delay-400 space-y-2">
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
                          placeholder="Yeni şifreni tekrar gir"
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
