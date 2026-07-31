"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ListChecks,
  MailCheck,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";

import {
  cancelTutorAccountDeletion,
  confirmDeletionOtp,
  fetchDeletionStatus,
  fetchTutorDeletionPrecheck,
  pauseTutorProfile,
  republishTutorProfile,
  requestDeletionOtp,
  requestTutorAccountDeletion,
  resumeTutorProfile,
  type TutorDeletionCancelResult,
  type TutorDeletionPrecheck,
} from "@/lib/authApi";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeletionOptionsList } from "./DeletionOptionsList";

type TutorStep = "intro" | "options" | "confirm" | "otp" | "status";

interface TutorDeletionFlowProps {
  accountEmail: string;
}

/**
 * Tutor variant of the account deletion flow. Tutors get a reversible
 * alternative (pausing the profile) up front, and deletion goes through an
 * offboarding period where upcoming lessons and earnings resolve before the
 * account is erased.
 */
export function TutorDeletionFlow({ accountEmail }: TutorDeletionFlowProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<TutorStep>("intro");
  const [precheck, setPrecheck] = useState<TutorDeletionPrecheck | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [cancelResult, setCancelResult] =
    useState<TutorDeletionCancelResult | null>(null);

  const statusQuery = useQuery({
    queryKey: ["account-deletion-status"],
    queryFn: fetchDeletionStatus,
    staleTime: 60_000,
    retry: false,
  });
  const activeStatus =
    statusQuery.data && statusQuery.data.active ? statusQuery.data : null;

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  const canConfirm =
    confirmText.trim() === "SİL" ||
    (accountEmail.length > 0 &&
      confirmText.trim().toLowerCase() === accountEmail.toLowerCase());

  const handlePause = async () => {
    setError(null);
    setBusy(true);
    try {
      await pauseTutorProfile();
      setPaused(true);
      toast.success("Profiliniz duraklatıldı. Dilediğinizde geri açabilirsiniz.");
    } catch {
      setError("Profil duraklatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const handleResume = async () => {
    setError(null);
    setBusy(true);
    try {
      await resumeTutorProfile();
      setPaused(false);
      toast.success("Profiliniz yeniden yayında.");
    } catch {
      setError("Profil açılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const handleStartPrecheck = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await fetchTutorDeletionPrecheck();
      setPrecheck(result);
      if (
        result.blockers.length > 0 ||
        result.warnings.length > 0 ||
        result.offboarding_preview.length > 0
      ) {
        setStep("options");
      } else {
        setStep("confirm");
      }
    } catch {
      setError("Hesap silme kontrolü yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const handleRequestOtp = async () => {
    setError(null);
    setBusy(true);
    setOtpVerified(false);
    try {
      await requestDeletionOtp();
      setOtpCooldown(60);
      setStep("otp");
    } catch {
      setError("Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmOtp = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      setError("6 haneli doğrulama kodunu girin.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // OTP is single-use: skip re-confirm on retry after a failed request
      // (the backend would reject the already-consumed code).
      if (!otpVerified) {
        await confirmDeletionOtp(otpCode);
        setOtpVerified(true);
      }
      await requestTutorAccountDeletion(confirmText);
      setStep("status");
      setOtpCode("");
      await queryClient.invalidateQueries({
        queryKey: ["account-deletion-status"],
      });
    } catch {
      setError(
        "Kod doğrulanamadı veya işlem tamamlanamadı. Kodu kontrol edip tekrar deneyin."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await cancelTutorAccountDeletion();
      setCancelResult(result);
      toast.success("Silme işlemi iptal edildi.");
      await queryClient.invalidateQueries({
        queryKey: ["account-deletion-status"],
      });
    } catch {
      setError("Silme işlemi iptal edilemedi. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  const handleRepublish = async () => {
    setError(null);
    setBusy(true);
    try {
      await republishTutorProfile({ confirm: true });
      toast.success("Profiliniz yeniden yayında.");
      setCancelResult(null);
      setStep("intro");
      setConfirmText("");
      await queryClient.invalidateQueries({
        queryKey: ["account-deletion-status"],
      });
    } catch {
      setError("Profil yeniden yayımlanamadı. Lütfen tekrar deneyin.");
    } finally {
      setBusy(false);
    }
  };

  // Post-cancellation panel: either an immediate republish path or the list
  // of offboarding actions that must resolve before the profile can go live.
  if (cancelResult) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Hesabı sil</CardTitle>
          <CardDescription>Silme işlemi iptal edildi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cancelResult.can_republish ? (
            <>
              <Alert>
                <PlayCircle className="h-4 w-4" />
                <AlertTitle>Profiliniz şu anda yayında değil.</AlertTitle>
                <AlertDescription>
                  Kapanış süreci geri alınabildi. Profilinizi yeniden
                  yayımlayarak arama sonuçlarına ve yeni öğrenci kabulüne geri
                  dönebilirsiniz.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                onClick={handleRepublish}
                disabled={busy}
              >
                Profili yeniden yayımla
              </Button>
            </>
          ) : (
            <>
              <Alert>
                <ListChecks className="h-4 w-4" />
                <AlertTitle>
                  Profiliniz, başlayan işlemler tamamlanana kadar kapalı kalır.
                </AlertTitle>
                <AlertDescription>
                  Aşağıdaki kapanış işlemleri çözülmeden profil otomatik
                  açılmaz:
                </AlertDescription>
              </Alert>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {(cancelResult.started_actions ?? []).map((action) => (
                  <li key={action.type} className="rounded-lg border p-3">
                    <p className="font-medium text-foreground">{action.label}</p>
                    <p className="mt-0.5">{action.reason}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {error && <ErrorMessage message={error} />}
        </CardContent>
      </Card>
    );
  }

  // Offboarding in progress (just started or returning to the page).
  if (step === "status" || activeStatus) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Hesabı sil</CardTitle>
          <CardDescription>Kapanış süreci devam ediyor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Kapanış süreci başladı.</AlertTitle>
            <AlertDescription>
              Yaklaşan dersleriniz ve hakedişleriniz çözüldükten sonra
              hesabınız silinecek. Durumu bu sayfadan takip edebilirsiniz.
            </AlertDescription>
          </Alert>
          {error && <ErrorMessage message={error} />}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={busy}
          >
            Silme işlemini iptal et
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-lg text-destructive">Hesabı sil</CardTitle>
        <CardDescription>
          Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "intro" && (
          <>
            <Alert>
              <PauseCircle className="h-4 w-4" />
              <AlertTitle>Önce daha esnek bir seçenek:</AlertTitle>
              <AlertDescription>
                Hesabınızı tamamen silmek yerine profilinizi
                duraklatabilirsiniz: arama sonuçlarından çıkar, yeni öğrenci
                kabulü kapanır; dilediğinizde geri açarsınız.
              </AlertDescription>
            </Alert>
            {paused && (
              <p className="text-sm text-muted-foreground">
                Profiliniz şu anda duraklatılmış durumda.
              </p>
            )}
            {error && <ErrorMessage message={error} />}
            <div className="flex flex-col gap-2 sm:flex-row">
              {paused ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResume}
                  disabled={busy}
                  className="flex-1"
                >
                  Profili yeniden aç
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePause}
                  disabled={busy}
                  className="flex-1"
                >
                  Profili duraklat
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleStartPrecheck}
                disabled={busy}
                className="flex-1 border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Kalıcı silmeye devam et
              </Button>
            </div>
          </>
        )}

        {step === "options" && precheck && (
          <>
            {precheck.offboarding_preview.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground">
                  Kalıcı silme başlatılırsa kapanış sürecinde gerçekleşecekler:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {precheck.offboarding_preview.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {(precheck.blockers.length > 0 || precheck.warnings.length > 0) && (
              <DeletionOptionsList
                blockers={precheck.blockers}
                warnings={precheck.warnings}
                onContinue={() => setStep("confirm")}
              />
            )}
            {precheck.blockers.length === 0 &&
              precheck.warnings.length === 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("confirm")}
                >
                  Devam et
                </Button>
              )}
            {error && <ErrorMessage message={error} />}
          </>
        )}

        {step === "confirm" && (
          <>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Bu işlem kalıcıdır.</AlertTitle>
              <AlertDescription>
                Profiliniz, dersleriniz ve mesajlarınız dahil tüm hesap
                verileriniz, kapanış süreci tamamlandıktan sonra kalıcı olarak
                silinir ve geri getirilemez.
              </AlertDescription>
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="tutor-delete-confirm">
                Onaylamak için{" "}
                <span className="font-semibold text-foreground">SİL</span>{" "}
                yazın veya e-posta adresinizi girin.
              </Label>
              <Input
                id="tutor-delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="SİL"
                autoComplete="off"
                className="max-w-xs"
              />
            </div>
            {error && <ErrorMessage message={error} />}
            <Button
              type="button"
              variant="destructive"
              onClick={handleRequestOtp}
              disabled={!canConfirm || busy}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Hesabı kalıcı olarak sil
            </Button>
          </>
        )}

        {step === "otp" && (
          <>
            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Son adım: e-posta doğrulaması</AlertTitle>
              <AlertDescription>
                {accountEmail} adresine 6 haneli bir kod gönderdik.
              </AlertDescription>
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="tutor-deletion-otp">Doğrulama kodu</Label>
              <div className="mt-1 flex flex-col gap-2 min-[420px]:flex-row">
                <Input
                  id="tutor-deletion-otp"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError(null);
                  }}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  className="w-full min-[420px]:max-w-[12rem]"
                />
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full min-[420px]:w-auto"
                  onClick={handleConfirmOtp}
                  disabled={busy || otpCode.length !== 6}
                >
                  Silme işlemini onayla
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRequestOtp}
              disabled={busy || otpCooldown > 0}
            >
              {otpCooldown > 0
                ? `Kodu yeniden gönder (${otpCooldown})`
                : "Kodu yeniden gönder"}
            </Button>
            {error && <ErrorMessage message={error} />}
            <p className="text-xs text-muted-foreground">
              Bu işlemi siz başlatmadıysanız hesabınızın güvenliği için
              şifrenizi değiştirin.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
