"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  KeyRound,
  LogOut,
  MailCheck,
  ShieldCheck,
  Send,
} from "lucide-react";

import {
  confirmEmailVerificationCode,
  fetchSecuritySettings,
  logoutAllSessions,
  requestEmailVerificationCode,
} from "@/lib/authApi";
import { useAuth } from "@/hooks/useAuth";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function formatLastSeen(value: string | null): string {
  if (!value) return "Henüz kayıt yok";
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SecurityContent() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [code, setCode] = useState("");
  const [requestingCode, setRequestingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["security-settings"],
    queryFn: fetchSecuritySettings,
    staleTime: 30_000,
  });

  const handleRequestCode = async () => {
    setRequestingCode(true);
    try {
      await requestEmailVerificationCode();
      setCodeSent(true);
      toast.success("Doğrulama kodu e-postanıza gönderildi.");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        toast.error("Yeni kod istemeden önce kısa bir süre bekleyin.");
      } else {
        toast.error("Kod gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setRequestingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("6 haneli doğrulama kodunu girin.");
      return;
    }
    setConfirmingCode(true);
    try {
      await confirmEmailVerificationCode(code);
      setCode("");
      setCodeSent(false);
      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("E-posta adresiniz doğrulandı.");
    } catch {
      toast.error("Kod doğrulanamadı. Kodu kontrol edip tekrar deneyin.");
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await logoutAllSessions();
      toast.success("Tüm oturumlardan çıkış yapıldı.");
      logout();
    } catch {
      toast.error("Oturumlar kapatılamadı. Lütfen tekrar deneyin.");
      setLoggingOutAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-3">
          <Link href="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Profile dön
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Güvenlik Ayarları
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              E-posta doğrulaması, şifre ve oturum kontrollerinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">E-posta doğrulaması</CardTitle>
                <CardDescription>
                  Hesap e-postanız: {data?.email}
                </CardDescription>
              </div>
              <Badge variant={data?.is_email_verified ? "default" : "secondary"}>
                {data?.is_email_verified ? "Doğrulandı" : "Doğrulanmadı"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.is_email_verified ? (
              <Alert>
                <BadgeCheck className="h-4 w-4" />
                <AlertTitle>E-posta adresiniz doğrulanmış.</AlertTitle>
                <AlertDescription>
                  Bu hesap, güvenli bildirimler ve ileride açılacak hassas işlemler için hazır.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert>
                  <MailCheck className="h-4 w-4" />
                  <AlertTitle>Doğrulama gerekiyor.</AlertTitle>
                  <AlertDescription>
                    6 haneli kod e-postanıza gönderilir ve 10 dakika geçerlidir.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={requestingCode}
                    className="sm:w-auto"
                  >
                    {requestingCode ? (
                      <span
                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden
                      />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Kod gönder
                  </Button>
                  <div className="flex-1">
                    <Label htmlFor="verification-code">Doğrulama kodu</Label>
                    <div className="mt-1 flex gap-2">
                      <Input
                        id="verification-code"
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        className="max-w-[12rem]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleConfirmCode}
                        disabled={confirmingCode || code.length !== 6}
                      >
                        {confirmingCode ? "Kontrol ediliyor" : "Doğrula"}
                      </Button>
                    </div>
                  </div>
                </div>

                {codeSent && (
                  <p className="text-sm text-muted-foreground">
                    Kod gönderildi. Gelen kutunuzu ve spam klasörünüzü kontrol edin.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Şifre ve oturumlar</CardTitle>
            <CardDescription>
              Son aktiflik: {formatLastSeen(data?.last_seen_at ?? null)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" asChild>
                <Link href="/forgot-password">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Şifre değiştir
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
              >
                {loggingOutAll ? (
                  <span
                    className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden
                  />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Tüm oturumlardan çıkış yap
              </Button>
            </div>
            <Separator />
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Hocam şu anda tek tokenlı oturum sistemi kullanıyor; tüm oturumlardan çıkış,
                mevcut erişim tokenınızı geçersiz kılar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <RouteGuard requireAuth>
      <SecurityContent />
    </RouteGuard>
  );
}
