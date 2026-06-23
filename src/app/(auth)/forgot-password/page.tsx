"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/authApi";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Şifremi Unuttum</CardTitle>
          <CardDescription>
            E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <p className="text-sm text-muted-foreground">
              Eğer bu email ile kayıtlı bir hesap varsa, şifre sıfırlama
              bağlantısı gönderildi.
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
                      Gönderiliyor...
                    </span>
                  ) : (
                    "Bağlantı Gönder"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Girişe dön
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
