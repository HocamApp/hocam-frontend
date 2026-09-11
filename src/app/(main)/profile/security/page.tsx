"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  MailCheck,
  ShieldCheck,
  Send,
  Trash2,
  X,
} from "lucide-react";

import {
  cancelAccountDeletion,
  changePassword,
  confirmDeletionOtp,
  confirmEmailVerificationCode,
  fetchDeletionPrecheck,
  fetchDeletionStatus,
  fetchSecuritySettings,
  logoutAllSessions,
  requestDeletionOtp,
  requestAccountDeletion,
  requestEmailVerificationCode,
  requestPasswordChange,
  type DeletionPrecheck,
} from "@/lib/authApi";
import type { VerificationChallenge } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { useAuthContext } from "@/providers/AuthProvider";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { DeletionOptionsList } from "@/components/profile/DeletionOptionsList";
import { RetentionOfferDialog } from "@/components/profile/RetentionOfferDialog";
import { TutorDeletionFlow } from "@/components/profile/TutorDeletionFlow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput, type OtpInputHandle, type OtpStatus } from "@/components/ui/otp-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { passwordSchema, passwordsMatchMessage } from "@/lib/passwordPolicy";
import { formatCountdown, secondsUntil } from "@/lib/verificationChallenge";
import { cn } from "@/lib/utils";

function formatLastSeen(value: string | null): string {
  if (!value) return "Henüz kayıt yok";
  return new Date(value).toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeletionDate(value: string): string {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type DeleteStep = "confirm" | "options" | "otp" | "scheduled";

// Retention offer is shown at most once per browser session (tab lifetime).
const OFFER_SHOWN_STORAGE_KEY = "hocam:retention-offer-shown";

function SecurityContent() {
  const queryClient = useQueryClient();
  const { logout, user, isTutor } = useAuth();
  const { setAuth } = useAuthContext();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<OtpStatus>("idle");
  const [emailChallenge, setEmailChallenge] = useState<VerificationChallenge | null>(null);
  const [requestingCode, setRequestingCode] = useState(false);
  const [confirmingCode, setConfirmingCode] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>("confirm");
  const [precheck, setPrecheck] = useState<DeletionPrecheck | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerShown, setOfferShown] = useState(() => {
    try {
      return sessionStorage.getItem(OFFER_SHOWN_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [deletionOtp, setDeletionOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpConfirming, setOtpConfirming] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChallenge, setPasswordChallenge] = useState<VerificationChallenge | null>(null);
  const [passwordCode, setPasswordCode] = useState("");
  const [passwordCodeStatus, setPasswordCodeStatus] = useState<OtpStatus>("idle");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [deletionFlowOpen, setDeletionFlowOpen] = useState(false);
  const deletionPanelRef = useRef<HTMLDivElement>(null);
  const emailOtpRef = useRef<OtpInputHandle>(null);
  const passwordOtpRef = useRef<OtpInputHandle>(null);
  const confirmingEmailRef = useRef(false);
  const confirmingPasswordRef = useRef(false);

  const passwordEvaluation = passwordSchema.safeParse(newPassword);
  const passwordMatchMessage = passwordsMatchMessage(newPassword, newPasswordConfirm);
  const emailExpiresIn = secondsUntil(emailChallenge?.expires_at, clock);
  const emailResendIn = secondsUntil(emailChallenge?.resend_available_at, clock);
  const passwordExpiresIn = secondsUntil(passwordChallenge?.expires_at, clock);
  const passwordResendIn = secondsUntil(passwordChallenge?.resend_available_at, clock);

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

  // An active deletion request replaces the delete form with a status card.
  // Student-only here; tutors get the same query inside TutorDeletionFlow.
  const deletionStatusQuery = useQuery({
    queryKey: ["account-deletion-status"],
    queryFn: fetchDeletionStatus,
    staleTime: 60_000,
    retry: false,
    enabled: !isTutor,
  });
  const activeDeletion =
    deletionStatusQuery.data && deletionStatusQuery.data.active
      ? deletionStatusQuery.data
      : null;

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setTimeout(() => setOtpCooldown((v) => v - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCooldown]);

  useEffect(() => {
    if (!emailChallenge && !passwordChallenge) return;
    const updateClock = () => setClock(Date.now());
    const timer = window.setInterval(updateClock, 1000);
    document.addEventListener("visibilitychange", updateClock);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateClock);
    };
  }, [emailChallenge, passwordChallenge]);

  useEffect(() => {
    if (!deletionFlowOpen) return;
    deletionPanelRef.current?.scrollIntoView?.({
      behavior: "smooth",
      block: "start",
    });
  }, [deletionFlowOpen]);

  const closeDeletionFlow = () => {
    setDeletionFlowOpen(false);
    setDeleteStep("confirm");
    setDeleteConfirm("");
    setDeletionOtp("");
    setDeleteError(null);
    setPrecheck(null);
    setOfferOpen(false);
    setOtpVerified(false);
    setScheduledAt(null);
  };

  const handleRequestCode = async () => {
    if (emailChallenge && emailResendIn > 0) return;
    setCodeError(null);
    setCodeStatus("idle");
    setRequestingCode(true);
    try {
      const challenge = await requestEmailVerificationCode();
      setEmailChallenge(challenge);
      setClock(Date.now());
      setCode("");
      emailOtpRef.current?.clear();
      setCodeSent(true);
      toast.success("Doğrulama kodu e-postanıza gönderildi.");
    } catch (err: any) {
      const challenge = err?.response?.data;
      if (challenge?.challenge_id && challenge?.expires_at && challenge?.resend_available_at) {
        setEmailChallenge(challenge);
        setCodeSent(true);
        setClock(Date.now());
      }
      if (err?.response?.status === 429) {
        setCodeError("Yeni kod istemeden önce kısa bir süre bekleyin.");
      } else {
        setCodeError("Kod gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setRequestingCode(false);
    }
  };

  const handleConfirmCode = async (submittedCode = code) => {
    if (confirmingEmailRef.current || confirmingCode) return;
    if (!/^\d{6}$/.test(submittedCode)) {
      setCodeError("6 haneli doğrulama kodunu girin.");
      setCodeStatus("error");
      return;
    }
    if (!emailChallenge || emailExpiresIn <= 0) {
      setCodeError("Kodun süresi doldu. Yeni bir kod isteyin.");
      setCodeStatus("error");
      return;
    }
    setCodeError(null);
    setCodeStatus("idle");
    confirmingEmailRef.current = true;
    setConfirmingCode(true);
    try {
      await confirmEmailVerificationCode(submittedCode, emailChallenge.challenge_id);
      setCodeStatus("success");
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setCode("");
      setCodeSent(false);
      setEmailChallenge(null);
      await queryClient.invalidateQueries({ queryKey: ["security-settings"] });
      toast.success("E-posta adresiniz doğrulandı.");
    } catch (err: any) {
      const response = err?.response;
      setCodeStatus(response ? "error" : "idle");
      setCodeError(
        response?.data?.code?.[0] ||
          response?.data?.detail ||
          (response
            ? "Kod doğrulanamadı. Kodu kontrol edip tekrar deneyin."
            : "Bağlantı kurulamadı. Aynı kodla tekrar deneyin.")
      );
    } finally {
      confirmingEmailRef.current = false;
      setConfirmingCode(false);
    }
  };

  const handleRequestPasswordChange = async () => {
    if (passwordChallenge && passwordResendIn > 0) return;
    if (newPassword !== newPasswordConfirm) {
      setPasswordError("Şifreler eşleşmiyor.");
      return;
    }
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      setPasswordError(validation.error.issues[0]?.message ?? "Yeni şifre geçerli değil.");
      return;
    }
    if (!currentPassword) {
      setPasswordError("Mevcut şifrenizi girin.");
      return;
    }
    setPasswordError(null);
    setChangingPassword(true);
    try {
      const challenge = await requestPasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
        password_confirm: newPasswordConfirm,
      });
      setPasswordChallenge(challenge);
      setPasswordCode("");
      setPasswordCodeStatus("idle");
      setClock(Date.now());
      passwordOtpRef.current?.clear();
      toast.success("Doğrulama kodu e-postanıza gönderildi.");
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.challenge_id && data?.expires_at && data?.resend_available_at) {
        setPasswordChallenge(data);
        setClock(Date.now());
      }
      const message =
        data?.current_password?.[0] ||
        data?.new_password?.[0] ||
        data?.password_confirm?.[0] ||
        data?.detail ||
        "Şifre değiştirilemedi. Lütfen tekrar deneyin.";
      setPasswordError(message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleConfirmPasswordChange = async (submittedCode = passwordCode) => {
    if (confirmingPasswordRef.current || changingPassword) return;
    if (!/^\d{6}$/.test(submittedCode)) {
      setPasswordCodeStatus("error");
      setPasswordError("6 haneli doğrulama kodunu girin.");
      return;
    }
    if (!passwordChallenge || passwordExpiresIn <= 0) {
      setPasswordCodeStatus("error");
      setPasswordError("Kodun süresi doldu. Yeni bir kod isteyin.");
      return;
    }

    setPasswordError(null);
    setPasswordCodeStatus("idle");
    confirmingPasswordRef.current = true;
    setChangingPassword(true);
    try {
      const { token, user: updatedUser } = await changePassword({
        challenge_id: passwordChallenge.challenge_id,
        code: submittedCode,
      });
      setPasswordCodeStatus("success");
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setAuth(updatedUser, token);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setPasswordCode("");
      setPasswordChallenge(null);
      setShowPasswordForm(false);
      toast.success("Şifreniz güncellendi.");
    } catch (err: any) {
      const response = err?.response;
      setPasswordCodeStatus(response ? "error" : "idle");
      setPasswordError(
        response?.data?.code?.[0] ||
          response?.data?.detail ||
          (response
            ? "Kod doğrulanamadı. Kodu kontrol edip tekrar deneyin."
            : "Bağlantı kurulamadı. Aynı kodla tekrar deneyin.")
      );
    } finally {
      confirmingPasswordRef.current = false;
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

  // Step 0 → 1: the destructive button now STARTS the flow with a precheck
  // instead of deleting immediately.
  const handleStartDeletion = async () => {
    if (!canDeleteAccount || deletingAccount) return;
    setDeleteError(null);
    setDeletingAccount(true);
    try {
      const result = await fetchDeletionPrecheck();
      setPrecheck(result);
      if (result.blockers.length > 0 || result.warnings.length > 0) {
        setDeleteStep("options");
      } else {
        proceedAfterPrecheck(result);
      }
    } catch {
      setDeleteError("Hesap silme kontrolü yapılamadı. Lütfen tekrar deneyin.");
    } finally {
      setDeletingAccount(false);
    }
  };

  // Step 2: eligible students see the retention offer once per browser
  // session (sessionStorage — survives a page reload within the tab);
  // everyone else goes straight to the OTP step.
  const proceedAfterPrecheck = (result: DeletionPrecheck) => {
    if (result.retention_offer?.eligible && !offerShown) {
      setOfferOpen(true);
      return;
    }
    void startOtpStep();
  };

  const handleContinueFromOptions = () => {
    if (precheck) proceedAfterPrecheck(precheck);
  };

  const markOfferShown = () => {
    setOfferShown(true);
    try {
      sessionStorage.setItem(OFFER_SHOWN_STORAGE_KEY, "1");
    } catch {
      // Storage unavailable (private mode) — in-memory flag still applies.
    }
  };

  // Closing the dialog via X / outside click / Escape is a neutral dismissal:
  // no API call, and the dialog won't reopen this session.
  const handleOfferOpenChange = (open: boolean) => {
    setOfferOpen(open);
    if (!open) markOfferShown();
  };

  const handleOfferDecline = () => {
    setOfferOpen(false);
    markOfferShown();
    void startOtpStep();
  };

  // Step 3: e-mail OTP confirmation.
  const startOtpStep = async () => {
    setDeleteStep("otp");
    setDeleteError(null);
    setOtpSending(true);
    setOtpVerified(false);
    try {
      await requestDeletionOtp();
      setOtpCooldown(60);
    } catch {
      setDeleteError("Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleResendDeletionOtp = async () => {
    if (otpCooldown > 0 || otpSending) return;
    setDeleteError(null);
    setOtpSending(true);
    try {
      await requestDeletionOtp();
      setOtpCooldown(60);
      toast.success("Yeni kod e-postanıza gönderildi.");
    } catch {
      setDeleteError("Kod gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setOtpSending(false);
    }
  };

  // Step 4: OTP confirmed → schedule the deletion (grace window, no logout).
  const handleConfirmDeletion = async () => {
    if (!/^\d{6}$/.test(deletionOtp)) {
      setDeleteError("6 haneli doğrulama kodunu girin.");
      return;
    }
    setDeleteError(null);
    setOtpConfirming(true);
    try {
      // OTP is single-use: once confirmed, a retry of a failed request must
      // not re-confirm (the backend would reject the consumed code and the
      // user would be stuck until resend).
      if (!otpVerified) {
        await confirmDeletionOtp(deletionOtp);
        setOtpVerified(true);
      }
      const result = await requestAccountDeletion(deleteConfirm);
      setScheduledAt(result.scheduled_deletion_at ?? null);
      setDeleteStep("scheduled");
      setDeletionOtp("");
      await queryClient.invalidateQueries({
        queryKey: ["account-deletion-status"],
      });
    } catch {
      setDeleteError(
        "Kod doğrulanamadı veya işlem tamamlanamadı. Kodu kontrol edip tekrar deneyin."
      );
    } finally {
      setOtpConfirming(false);
    }
  };

  const handleCancelDeletion = async () => {
    setDeleteError(null);
    setCancellingDeletion(true);
    try {
      await cancelAccountDeletion();
      toast.success("Silme işlemi iptal edildi.");
      setDeleteStep("confirm");
      setDeleteConfirm("");
      setPrecheck(null);
      setScheduledAt(null);
      setDeletionFlowOpen(false);
      await queryClient.invalidateQueries({
        queryKey: ["account-deletion-status"],
      });
    } catch {
      setDeleteError("Silme işlemi iptal edilemedi. Lütfen tekrar deneyin.");
    } finally {
      setCancellingDeletion(false);
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
    <div className="mx-auto w-full min-w-0 max-w-5xl overflow-x-clip px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="-ml-3 mb-3">
          <Link href="/profile">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Profil&apos;e dön
          </Link>
        </Button>
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-transparent bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
              Güvenlik Ayarları
            </h1>
            <p className="mt-2 text-base text-[var(--ink-mid)]">
              Hesap e-postanızı, şifrenizi ve oturum kontrollerinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="rounded-[var(--radius-card)] border-[var(--line)] bg-[var(--surface)]">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-lg">E-posta doğrulaması</CardTitle>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {data?.email}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  /* The column layout below sm stretches its children, which
                     turned a two-word status into a full-bleed gold band. The
                     badge is a label, so it takes only the width it needs. */
                  "max-md:self-start max-md:w-fit",
                  data?.is_email_verified
                    ? "border-[var(--success)] text-[var(--success)]"
                    : "border-[var(--gold-ink)]/20 bg-[var(--gold)] text-[var(--gold-ink)] max-md:border-[var(--line)] max-md:bg-transparent max-md:text-[var(--ink)]"
                )}
              >
                {data?.is_email_verified
                  ? "Doğrulandı"
                  : data?.email_verification_enabled === false
                    ? "Geçici olarak kapalı"
                    : "Doğrulanmadı"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              E-posta doğrulaması; şifre sıfırlama, hesap silme ve önemli
              güvenlik bildirimleri için kullanılır.
            </p>
            {data?.is_email_verified ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-input)] border border-[var(--success)]/25 bg-[var(--surface)] p-4 text-sm">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                <p className="leading-relaxed text-foreground">
                  E-postanız doğrulandı. Hassas hesap işlemleri için bu adresi
                  kullanacağız.
                </p>
              </div>
            ) : data?.email_verification_enabled === false ? (
              <Alert>
                <MailCheck className="h-4 w-4" />
                <AlertTitle>E-posta doğrulaması geçici olarak kapalı.</AlertTitle>
                <AlertDescription>
                  Hesabınızı e-posta ve şifrenizle kullanabilirsiniz. Doğrulama yeniden
                  açıldığında bu ekrandan tamamlayabileceksiniz.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm leading-relaxed text-foreground">
                    Bu e-posta size ait mi? 6 haneli bir kod göndererek
                    hesabınızı güvenceye alın.
                  </p>
                  <p className="text-sm text-[var(--ink-mid)]">
                    Kod 2 dakika geçerlidir ve yalnızca bir kez kullanılabilir.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={requestingCode || (Boolean(emailChallenge) && emailResendIn > 0)}
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
                    {emailChallenge
                      ? emailResendIn > 0
                        ? `Tekrar gönder (${emailResendIn} sn)`
                        : "Kodu tekrar gönder"
                      : "Kod gönder"}
                  </Button>
                </div>

                {codeSent && emailChallenge && (
                  <div className="space-y-3 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--paper)] p-4">
                    <OtpInput
                      ref={emailOtpRef}
                      label="E-posta doğrulama kodu"
                      disabled={confirmingCode || emailExpiresIn <= 0}
                      status={codeStatus}
                      errorMessage={codeError ?? ""}
                      successMessage="Kod doğrulandı."
                      hint={
                        emailExpiresIn > 0
                          ? `Kodun geçerlilik süresi: ${formatCountdown(emailExpiresIn)}`
                          : "Kodun süresi doldu. Yeni bir kod isteyin."
                      }
                      onChange={(value) => {
                        setCode(value);
                        if (codeStatus !== "success") setCodeStatus("idle");
                        setCodeError(null);
                      }}
                      onComplete={(value) => void handleConfirmCode(value)}
                      autoFocus
                    />
                    {codeError && codeStatus === "idle" && (
                      <div className="space-y-2">
                        <ErrorMessage message={codeError} />
                        {code.length === 6 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleConfirmCode()}
                            disabled={confirmingCode}
                          >
                            Aynı kodla tekrar dene
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[var(--radius-card)] border-[var(--line)] bg-[var(--surface)]">
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
              <div className="space-y-4 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--paper)] p-5">
                {passwordChallenge ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-foreground">E-postanıza gönderilen kodu girin</p>
                      <p className="mt-1 text-sm text-[var(--ink-mid)]">
                        Kod 2 dakika geçerlidir. Altıncı rakamı girdiğinizde otomatik kontrol edilir.
                      </p>
                    </div>
                    <OtpInput
                      ref={passwordOtpRef}
                      label="Şifre değişikliği doğrulama kodu"
                      disabled={changingPassword || passwordExpiresIn <= 0}
                      status={passwordCodeStatus}
                      errorMessage={passwordError ?? ""}
                      successMessage="Kod doğrulandı."
                      hint={
                        passwordExpiresIn > 0
                          ? `Kodun geçerlilik süresi: ${formatCountdown(passwordExpiresIn)}`
                          : "Kodun süresi doldu. Yeni bir kod isteyin."
                      }
                      onChange={(value) => {
                        setPasswordCode(value);
                        if (passwordCodeStatus !== "success") setPasswordCodeStatus("idle");
                        setPasswordError(null);
                      }}
                      onComplete={(value) => void handleConfirmPasswordChange(value)}
                      autoFocus
                    />
                    {passwordError && passwordCodeStatus === "idle" && (
                      <div className="space-y-2">
                        <ErrorMessage message={passwordError} />
                        {passwordCode.length === 6 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleConfirmPasswordChange()}
                            disabled={changingPassword}
                          >
                            Aynı kodla tekrar dene
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleRequestPasswordChange()}
                        disabled={changingPassword || passwordResendIn > 0}
                      >
                        {passwordResendIn > 0
                          ? `Tekrar gönder (${passwordResendIn} sn)`
                          : "Kodu tekrar gönder"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setPasswordChallenge(null);
                          setPasswordCode("");
                          setPasswordCodeStatus("idle");
                          setPasswordError(null);
                        }}
                      >
                        Bilgileri düzenle
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="current-password">Mevcut şifre</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          autoComplete="current-password"
                          className="pr-11"
                        />
                        <button
                          type="button"
                          aria-label={showCurrentPassword ? "Mevcut şifreyi gizle" : "Mevcut şifreyi göster"}
                          aria-pressed={showCurrentPassword}
                          onClick={() => setShowCurrentPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password">Yeni şifre</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          maxLength={128}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError(null);
                          }}
                          autoComplete="new-password"
                          className="pr-11"
                        />
                        <button
                          type="button"
                          aria-label={showNewPassword ? "Yeni şifreyi gizle" : "Yeni şifreyi göster"}
                          aria-pressed={showNewPassword}
                          onClick={() => setShowNewPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrength value={newPassword} className="pt-1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password-confirm">Yeni şifre (tekrar)</Label>
                      <div className="relative">
                        <Input
                          id="new-password-confirm"
                          type={showNewPasswordConfirm ? "text" : "password"}
                          value={newPasswordConfirm}
                          maxLength={128}
                          onChange={(e) => {
                            setNewPasswordConfirm(e.target.value);
                            setPasswordError(null);
                          }}
                          autoComplete="new-password"
                          className="pr-11"
                        />
                        <button
                          type="button"
                          aria-label={showNewPasswordConfirm ? "Şifre tekrarını gizle" : "Şifre tekrarını göster"}
                          aria-pressed={showNewPasswordConfirm}
                          onClick={() => setShowNewPasswordConfirm((value) => !value)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground"
                        >
                          {showNewPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordMatchMessage && (
                        <p
                          role="status"
                          className={cn(
                            "text-sm",
                            newPassword === newPasswordConfirm
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          )}
                        >
                          {passwordMatchMessage}
                        </p>
                      )}
                    </div>
                    {passwordError && <ErrorMessage message={passwordError} />}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        onClick={() => void handleRequestPasswordChange()}
                        disabled={
                          changingPassword ||
                          !currentPassword ||
                          !passwordEvaluation.success ||
                          newPassword !== newPasswordConfirm
                        }
                      >
                        {changingPassword && (
                          <span
                            className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                            aria-hidden
                          />
                        )}
                        Doğrulama kodu gönder
                      </Button>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Mevcut şifrenizi mi unuttunuz?
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tanımadığınız bir işlem fark ederseniz şifrenizi değiştirin ve
              tüm oturumlardan çıkış yapın.
            </p>
          </CardContent>
        </Card>

        {isTutor ? (
          <TutorDeletionFlow accountEmail={accountEmail} />
        ) : !activeDeletion && deleteStep !== "scheduled" && !deletionFlowOpen ? (
          <Card className="rounded-[var(--radius-card)] border-[var(--line)] bg-[var(--surface)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hesap yönetimi</CardTitle>
              <CardDescription>
                Hesabınızla ilgili kalıcı işlemleri buradan yönetebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletionFlowOpen(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Hesabı sil
              </Button>
            </CardContent>
          </Card>
        ) : (
        <Card ref={deletionPanelRef} className="scroll-mt-6 rounded-[var(--radius-card)] border-[var(--error)]/40 bg-[var(--surface)]">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-destructive">Hesabı sil</CardTitle>
                <CardDescription>
                  Hesabınızı kalıcı olarak silin. Bu işlem geri alınamaz.
                </CardDescription>
              </div>
              {!activeDeletion && deleteStep !== "scheduled" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeDeletionFlow}
                  aria-label="Silme alanını kapat"
                  className="-mr-2 -mt-2 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDeletion ? (
              <>
                {activeDeletion.status === "blocked" ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Silme işlemi bekletiliyor.</AlertTitle>
                    <AlertDescription>
                      Hesabınızdaki açık bir finansal süreç (iade/ihtilaf)
                      nedeniyle silme işlemi bekletiliyor. Süreç
                      tamamlandığında silme otomatik devam edecektir.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CalendarClock className="h-4 w-4" />
                    <AlertTitle>Silme işleminiz planlandı.</AlertTitle>
                    <AlertDescription>
                      Hesabınız{" "}
                      {activeDeletion.scheduled_deletion_at
                        ? formatDeletionDate(activeDeletion.scheduled_deletion_at)
                        : "planlanan tarihte"}{" "}
                      tarihinde kalıcı olarak silinecek. Bu tarihe kadar giriş
                      yaparak istediğiniz zaman iptal edebilirsiniz.
                    </AlertDescription>
                  </Alert>
                )}
                {deleteError && <ErrorMessage message={deleteError} />}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelDeletion}
                  disabled={cancellingDeletion}
                >
                  Silme işlemini iptal et
                </Button>
              </>
            ) : deleteStep === "scheduled" ? (
              <>
                <Alert>
                  <CalendarClock className="h-4 w-4" />
                  <AlertTitle>Silme işleminiz planlandı.</AlertTitle>
                  <AlertDescription>
                    Hesabınız{" "}
                    {scheduledAt
                      ? formatDeletionDate(scheduledAt)
                      : "planlanan tarihte"}{" "}
                    tarihinde kalıcı olarak silinecek. Bu tarihe kadar giriş
                    yaparak istediğiniz zaman iptal edebilirsiniz.
                  </AlertDescription>
                </Alert>
                {deleteError && <ErrorMessage message={deleteError} />}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelDeletion}
                  disabled={cancellingDeletion}
                >
                  Silme işlemini iptal et
                </Button>
              </>
            ) : deleteStep === "otp" ? (
              <>
                <Alert>
                  <MailCheck className="h-4 w-4" />
                  <AlertTitle>Son adım: e-posta doğrulaması</AlertTitle>
                  <AlertDescription>
                    {accountEmail} adresine 6 haneli bir kod gönderdik.
                  </AlertDescription>
                </Alert>

                <div className="space-y-1.5">
                  <Label htmlFor="deletion-otp">Doğrulama kodu</Label>
                  <div className="mt-1 flex flex-col gap-2 min-[420px]:flex-row">
                    <Input
                      id="deletion-otp"
                      value={deletionOtp}
                      onChange={(e) => {
                        setDeletionOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        setDeleteError(null);
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
                      onClick={handleConfirmDeletion}
                      disabled={otpConfirming || deletionOtp.length !== 6}
                    >
                      {otpConfirming ? "Kontrol ediliyor" : "Silme işlemini onayla"}
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResendDeletionOtp}
                  disabled={otpSending || otpCooldown > 0}
                >
                  {otpCooldown > 0
                    ? `Kodu yeniden gönder (${otpCooldown})`
                    : "Kodu yeniden gönder"}
                </Button>

                {deleteError && <ErrorMessage message={deleteError} />}

                <p className="text-xs text-muted-foreground">
                  Bu işlemi siz başlatmadıysanız hesabınızın güvenliği için
                  şifrenizi değiştirin.
                </p>
              </>
            ) : (
              <>
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

                {deleteStep === "options" && precheck && (
                  <DeletionOptionsList
                    blockers={precheck.blockers}
                    warnings={precheck.warnings}
                    onContinue={handleContinueFromOptions}
                    continuing={deletingAccount}
                  />
                )}

                {deleteError && <ErrorMessage message={deleteError} />}

                {deleteStep === "confirm" && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="min-h-11 max-w-full rounded-[var(--radius-pill)] bg-[var(--error)] px-6 text-center text-white hover:bg-[var(--error)]/90"
                    onClick={handleStartDeletion}
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
                )}
              </>
            )}
          </CardContent>
        </Card>
        )}

        {precheck?.retention_offer?.eligible && (
          <RetentionOfferDialog
            open={offerOpen}
            discountPercent={precheck.retention_offer.campaign.discount_percent}
            validityHours={precheck.retention_offer.campaign.validity_hours}
            onOpenChange={handleOfferOpenChange}
            onDecline={handleOfferDecline}
          />
        )}
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
