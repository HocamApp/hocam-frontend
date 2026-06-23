"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { confirmPasswordReset } from "@/lib/authApi";
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
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<ResetFormValues>({
    defaultValues: { new_password: "", password_confirm: "" },
    mode: "onSubmit",
  });

  if (!uid || !token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader>
            <CardTitle>Geçersiz Bağlantı</CardTitle>
            <CardDescription>
              Şifre sıfırlama bağlantısı eksik veya hatalı.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorMessage message="Bu bağlantı geçerli değil. Lütfen yeni bir şifre sıfırlama isteği gönderin." />
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Şifre sıfırlama isteği gönder
            </Link>
          </CardFooter>
        </Card>
      </div>
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
      setSuccess(true);
    } catch {
      setGeneralError(
        "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin."
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Yeni Şifre Belirle</CardTitle>
          <CardDescription>
            Hesabın için yeni bir şifre oluştur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-muted-foreground">
              Şifren başarıyla sıfırlandı. Yeni şifrenle giriş yapabilirsin.
            </p>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {generalError && <ErrorMessage message={generalError} />}
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Şifre</FormLabel>
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
                      <FormLabel>Şifre Tekrar</FormLabel>
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
                      Kaydediliyor...
                    </span>
                  ) : (
                    "Şifremi Sıfırla"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          {success ? (
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Giriş yap
            </Link>
          ) : (
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Girişe dön
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
