"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      role: undefined,
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Hocam&apos;a Katıl</CardTitle>
          <CardDescription>Hesabını oluştur</CardDescription>
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
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hesap türü</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => field.onChange("student")}
                          className={cn(
                            "rounded-lg border-2 p-4 text-left transition-colors",
                            field.value === "student"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="font-medium">Öğrenci</span>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Özel ders almak istiyorum
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("tutor")}
                          className={cn(
                            "rounded-lg border-2 p-4 text-left transition-colors",
                            field.value === "tutor"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <span className="font-medium">Hoca</span>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Özel ders vermek istiyorum
                          </p>
                        </button>
                      </div>
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
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
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
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="ml-1 font-medium text-primary underline-offset-4 hover:underline">
            Giriş yap
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
