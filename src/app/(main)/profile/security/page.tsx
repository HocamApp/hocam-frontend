"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Clock,
  KeyRound,
  LogOut,
  MailCheck,
  ShieldCheck,
  Send,
  Trash2,
} from "lucide-react";

import {
  changePassword,
  confirmEmailVerificationCode,
  deleteMyAccount,
  fetchSecuritySettings,
  logoutAllSessions,
  requestEmailVerificationCode,
} from "@/lib/authApi";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/providers/AuthProvider";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
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
  const router = useRouter();
  const { logout, user } = useAuth();
  const { clearAuth, setAuth } = useAuthContext();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const accountEmail = user?.email ?? "";
  const canDeleteAccount =
    deleteConfirm.trim() === "SİL" ||
    (accountEmail.length > 0 &&
      deleteConfirm.trim().toLowerCase() === accountEmail.toLowerCase());

  const { data, isLoading } = useQuery({
    queryKey: ["security-settings"],
    queryFn: fetchSecuritySettings,
    staleTime: 30_000,
  });

  const handleRequestCode = async () => {
    setCodeError(null);
    setRequestingCode(true);
    try {
      await requestEmailVerificationCode();
      setCodeSent(true);
      toast.success("Doğrulama kodu e-postanıza gönderildi.");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setCodeError("Yeni kod istemeden önce kısa bir süre bekleyin.");
      } else {
        setCodeError("Kod gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setRequestingCode(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setCodeError("6 haneli doğrulama kodunu girin.");
      return;
    }
    setCodeError(null);
    setConfirmingCode(true);
    try {
      await confirmEmailVerificationCode(code);
      setCode("");
      setCodeSent(false);
      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("E-posta adresiniz doğrulandı.");
    } catch {
      setCodeError("Kod doğrulanamadı. Kodu kontrol edip tekrar deneyin.");
    } finally {
      setConfirmingCode(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      const { token, user: updatedUser } = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        password_confirm: newPasswordConfirm,
      });
      setAuth(updatedUser, token);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setShowPasswordForm(false);
      toast.success("Şifreniz güncellendi.");
    } catch (err: any) {
      const data = err?.response?.data;
      const message =
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.password_confirm?.[0] ||
        "Şifre değiştirilemedi. Lütfen tekrar deneyin.";
      setPasswordError(message);
    } finally {
      setChangingPassword(false);
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

  const handleDeleteAccount = async () => {
    if (!canDeleteAccount || deletingAccount) return;
    setDeleteError(null);
    setDeletingAccount(true);
    try {
      await deleteMyAccount();
      // Clear local auth state/cookie, then send the user to sign-up again.
      clearAuth();
      toast.success("Hesabınız kalıcı olarak silindi.");
      router.push("/register");
    } catch {
      setDeleteError("Hesap silinemedi. Lütfen tekrar deneyin.");
      setDeletingAccount(false);
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
                        onChange={(e) => {
                          setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setCodeError(null);
                        }}
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
                    {codeError && (
                      <p className="mt-1.5 text-sm text-destructive">
                        {codeError}
                      </p>
                    )}
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
              {data?.has_usable_password !== false && (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm((v) => !v)}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  Şifre değiştir
                </Button>
              )}
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

            {data?.has_usable_password === false && (
              <p className="text-sm text-muted-foreground">
                Bu hesap Google ile giriş yapıyor, bu yüzden ayrı bir şifren yok.
                Giriş yapmaya devam etmek için Google ile giriş yap seçeneğini kullan.
              </p>
            )}

            {showPasswordForm && data?.has_usable_password !== false && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Mevcut şifre</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Yeni şifre</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password-confirm">Yeni şifre (tekrar)</Label>
                  <Input
                    id="new-password-confirm"
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => {
                      setNewPasswordConfirm(e.target.value);
                      setPasswordError(null);
                    }}
                    autoComplete="new-password"
                  />
                </div>
                {passwordError && <ErrorMessage message={passwordError} />}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={
                      changingPassword ||
                      !currentPassword ||
                      !newPassword ||
                      !newPasswordConfirm
                    }
                  >
                    {changingPassword && (
                      <span
                        className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        aria-hidden
                      />
                    )}
                    Şifreyi güncelle
                  </Button>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Mevcut şifrenizi mi unuttunuz?
                  </Link>
                </div>
              </div>
            )}
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

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Hesabı sil</CardTitle>
            <CardDescription>
              Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bu işlem kalıcıdır.</AlertTitle>
              <AlertDescription>
                Profiliniz, ders talepleriniz, rezervasyonlarınız ve mesajlarınız
                dahil tüm hesap verileriniz kalıcı olarak silinir ve geri getirilemez.
              </AlertDescription>
            </Alert>

            <div className="space-y-1.5">
              <Label htmlFor="delete-confirm">
                Onaylamak için{" "}
                <span className="font-semibold text-foreground">SİL</span> yazın
                veya e-posta adresinizi girin.
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="SİL"
                autoComplete="off"
                className="max-w-xs"
              />
            </div>

            {deleteError && <ErrorMessage message={deleteError} />}

            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!canDeleteAccount || deletingAccount}
            >
              {deletingAccount ? (
                <span
                  className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Hesabı kalıcı olarak sil
            </Button>
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
