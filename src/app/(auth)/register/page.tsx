"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { registerUser } from "@/lib/authApi";
import { AuthResponse } from "@/types";
import { ApiError } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import axios from "axios";
import { cn } from "@/lib/utils";

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

export default function RegisterPage() {
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
      role: "student",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(user.role === "tutor" ? "/dashboard/tutor" : "/dashboard/student");
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
      if (res.user.role === "tutor") router.push("/dashboard/tutor");
      else router.push("/dashboard/student");
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="mb-6 text-center">
        <Link href="/" className="text-2xl font-semibold text-black">
          Hocam
        </Link>
      </div>
      <Card className="w-full max-w-md border border-gray-200 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-black">
            Hesap Oluştur
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Öğrenci olarak kaydol
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {generalError && (
                <ErrorMessage message={generalError} />
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ornek@email.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                          aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre tekrar</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPasswordConfirm ? "text" : "password"}
                          autoComplete="new-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswordConfirm((prev) => !prev)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                          aria-label={showPasswordConfirm ? "Şifreyi gizle" : "Şifreyi göster"}
                        >
                          {showPasswordConfirm ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-black/90"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                      aria-hidden
                    />
                    Kayıt Ol
                  </span>
                ) : (
                  "Kayıt Ol"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-600">
          <span>Zaten hesabın var mı?</span>
          <Link
            href="/login"
            className="ml-1 font-medium text-black underline-offset-4 hover:underline"
          >
            Giriş yap
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
