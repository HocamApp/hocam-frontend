"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Cookies from "js-cookie";
import { useAuth } from "@/hooks/useAuth";
import { loginUser, fetchMe } from "@/lib/authApi";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, setAuth, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);

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
          <CardTitle>Tekrar Hoş Geldin</CardTitle>
          <CardDescription>Hesabına giriş yap</CardDescription>
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
                      <Input
                        type="password"
                        autoComplete="current-password"
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
                    Giriş Yap
                  </span>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
            Şifremi unuttum
          </Link>
          <span>
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Kayıt ol
            </Link>
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
