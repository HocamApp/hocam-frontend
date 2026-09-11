"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { useAuth } from "@/hooks/useAuth";
import {
  confirmRegistration,
  googleAuth,
  registerUser,
  resendRegistrationCode,
} from "@/lib/authApi";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ApiError, AuthResponse, RegisterStartResponse } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { passwordSchema, passwordsMatchMessage } from "@/lib/passwordPolicy";
import { normalizeReferralCode } from "@/lib/referralCode";
import { formatCountdown, secondsUntil } from "@/lib/verificationChallenge";
import { OtpInput, type OtpInputHandle, type OtpStatus } from "@/components/ui/otp-input";
import { PasswordStrength } from "@/components/ui/password-strength";
import { GlassInputWrapper } from "@/components/auth/AuthSplitScreen";
import { AydinlatmaMetniPreview } from "@/components/privacy/AydinlatmaMetniPreview";
import {
  fetchRegistrationNotice,
  type RegistrationNoticeConfig,
} from "@/lib/privacyApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const registerSchema = z
  .object({
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: passwordSchema,
    password_confirm: z.string().max(128, "Şifre en fazla 128 karakter olabilir"),
    role: z.enum(["student", "tutor"]).optional(),
    referral_code: z
      .string()
      .trim()
      .max(12, "Davet kodu en fazla 12 karakter olabilir")
      .optional(),
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

interface RegisterFormProps {
  /** Initial selected account type. */
  initialRole?: "student" | "tutor";
  /** When provided, the "Giriş yap" footer switches mode in place instead of navigating. */
  onSignIn?: () => void;
  /** Reports the currently selected role so the parent can drive the heading description. */
  onRoleChange?: (role: "student" | "tutor") => void;
  /** Hides role selection and forces registrations from a role-specific flow. */
  lockedRole?: "student" | "tutor";
  /** Same-origin route used after a successful registration. */
  returnUrl?: string | null;
  /** Invite code carried by a shared link (?ref=). Pre-fills, stays editable. */
  initialReferralCode?: string;
  /** Optional hook for embedded flows; runs after auth is stored and before navigation. */
  onAuthenticated?: (auth: AuthResponse) => void | Promise<void>;
}

export function RegisterForm({
  initialRole = "student",
  onSignIn,
  onRoleChange,
  lockedRole,
  returnUrl,
  initialReferralCode,
  onAuthenticated,
}: RegisterFormProps) {
  const router = useRouter();
  const { setAuth, isAuthenticated, isLoading, user } = useAuth();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<RegisterStartResponse | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<OtpStatus>("idle");
  const [verificationError, setVerificationError] = useState("");
  const [verificationRetryAvailable, setVerificationRetryAvailable] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [clock, setClock] = useState(() => Date.now());
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [noticeConfig, setNoticeConfig] = useState<RegistrationNoticeConfig | null>(null);
  const [noticeConfigFailed, setNoticeConfigFailed] = useState(false);
  const [noticeLoaded, setNoticeLoaded] = useState(false);
  const [noticeViewed, setNoticeViewed] = useState(false);
  const [noticeAcknowledged, setNoticeAcknowledged] = useState(false);
  const authHandledByFormRef = useRef(false);
  const confirmingRef = useRef(false);
  const otpRef = useRef<OtpInputHandle>(null);
  const handleNoticeReady = useCallback(() => setNoticeLoaded(true), []);

  useEffect(() => {
    let cancelled = false;
    fetchRegistrationNotice()
      .then((config) => {
        if (!cancelled) setNoticeConfig(config);
      })
      .catch(() => {
        if (!cancelled) setNoticeConfigFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const form = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      password_confirm: "",
      role: lockedRole ?? initialRole,
      referral_code: initialReferralCode ?? "",
    },
    mode: "onSubmit",
  });

  const role = form.watch("role");
  const passwordValue = form.watch("password");
  const passwordConfirmValue = form.watch("password_confirm");
  const passwordMatchMessage = passwordsMatchMessage(passwordValue, passwordConfirmValue);
  const expiresIn = secondsUntil(pendingChallenge?.expires_at, clock);
  const resendIn = secondsUntil(pendingChallenge?.resend_available_at, clock);

  useEffect(() => {
    if (!pendingChallenge) return;
    setClock(Date.now());
    const updateClock = () => setClock(Date.now());
    const timer = window.setInterval(updateClock, 1000);
    document.addEventListener("visibilitychange", updateClock);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateClock);
    };
  }, [pendingChallenge]);

  useEffect(() => {
    if (role === "student" || role === "tutor") {
      onRoleChange?.(role);
    }
  }, [role, onRoleChange]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !authHandledByFormRef.current) {
      if (user.role === "tutor") {
        router.replace(user.tutor_profile_id ? returnUrl ?? "/home" : "/tutor/setup");
      } else {
        router.replace(returnUrl ?? "/home");
      }
    }
  }, [isLoading, isAuthenticated, user, router, returnUrl]);

  const onSubmit = async (data: RegisterFormValues) => {
    setGeneralError(null);
    if (!noticeAcknowledged || !noticeConfig) {
      setGeneralError(
        "Kayıt olmak için KVKK Aydınlatma Metni’ni görüntüleyip bilgilendirildiğini onaylamalısın."
      );
      return;
    }
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
      const res = await registerUser({
        ...parsed.data,
        role: parsed.data.role as "student" | "tutor",
        referral_code: normalizeReferralCode(parsed.data.referral_code),
        notice_code: noticeConfig.code,
        notice_version: noticeConfig.version,
        notice_acknowledged: true,
      });
      if ("requires_verification" in res) {
        setPendingEmail(res.email);
        setPendingChallenge(res);
        setVerificationCode("");
        setVerificationStatus("idle");
        setVerificationError("");
      } else {
        completeAuth(res);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data) {
        const body = err.response.data as ApiError;
        if (body.email) form.setError("email", { message: body.email[0] });
        if (body.password) form.setError("password", { message: body.password[0] });
        if (body.password_confirm) form.setError("password_confirm", { message: body.password_confirm[0] });
        if (body.role) form.setError("role", { message: body.role[0] });
        if (body.referral_code)
          form.setError("referral_code", { message: body.referral_code[0] });
        const otherKeys = Object.keys(body).filter((k) => !["email", "password", "password_confirm", "role"].includes(k));
        if (otherKeys.length > 0) {
          setGeneralError(otherKeys.map((k) => (body as Record<string, string[]>)[k].join(" ")).join(" "));
        }
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        const challenge = err.response.data as Partial<RegisterStartResponse>;
        if (
          challenge.challenge_id &&
          challenge.expires_at &&
          challenge.resend_available_at
        ) {
          setPendingEmail(parsed.data.email);
          setPendingChallenge({
            requires_verification: true,
            email: parsed.data.email,
            challenge_id: challenge.challenge_id,
            expires_at: challenge.expires_at,
            expires_in_seconds: challenge.expires_in_seconds ?? 120,
            resend_available_at: challenge.resend_available_at,
          });
          setGeneralError("Önceki kod hâlâ geçerli. E-postanızdaki son kodu girin.");
        } else {
          setGeneralError("Çok fazla kayıt denemesi yapıldı. Lütfen biraz sonra tekrar deneyin.");
        }
      } else if (axios.isAxiosError(err) && err.response?.status === 503) {
        setGeneralError("Kayıt şu anda tamamlanamadı. Lütfen biraz sonra tekrar deneyin.");
      } else if (axios.isAxiosError(err) && err.response) {
        setGeneralError(`Sunucu hatası (${err.response.status}). Lütfen tekrar deneyin.`);
      } else {
        setGeneralError("Bağlantı kurulamadı. API sunucusunun (http://localhost:8000) çalıştığından emin olun.");
      }
    }
  };

  const completeAuth = useCallback(async (res: AuthResponse) => {
    authHandledByFormRef.current = true;
    setAuth(res.user, res.token);
    await onAuthenticated?.(res);
    if (res.user.role === "tutor") {
      router.push(res.user.tutor_profile_id ? returnUrl ?? "/home" : "/tutor/setup");
    } else {
      router.push(returnUrl ?? "/home");
    }
  }, [onAuthenticated, returnUrl, router, setAuth]);

  const handleConfirmRegistration = async (submittedCode = verificationCode) => {
    if (!pendingEmail || confirmingRef.current) return;
    if (!/^\d{6}$/.test(submittedCode)) {
      setVerificationStatus("error");
      setVerificationError("6 haneli doğrulama kodunu girin.");
      return;
    }
    if (pendingChallenge && secondsUntil(pendingChallenge.expires_at) === 0) {
      setVerificationStatus("error");
      setVerificationError("Kodun süresi doldu. Yeni kod isteyin.");
      return;
    }
    confirmingRef.current = true;
    setGeneralError(null);
    setVerificationRetryAvailable(false);
    setIsConfirming(true);
    setVerificationStatus("idle");
    setVerificationError("");
    try {
      const res = await confirmRegistration({
        email: pendingEmail,
        challenge_id: pendingChallenge?.challenge_id,
        code: submittedCode,
      });
      setVerificationStatus("success");
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      await completeAuth(res);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data) {
        const body = err.response.data as ApiError & { reason?: string };
        if (body.code) {
          setVerificationStatus("error");
          setVerificationError(body.code[0]);
        } else if (body.email) {
          setGeneralError(body.email[0]);
        } else {
          setVerificationStatus("error");
          setVerificationError("Kod doğrulanamadı. Lütfen tekrar deneyin.");
        }
      } else {
        setVerificationRetryAvailable(true);
        setGeneralError("Bağlantı kurulamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      confirmingRef.current = false;
      setIsConfirming(false);
    }
  };

  const handleResendRegistration = async () => {
    if (!pendingEmail || !pendingChallenge || resendIn > 0 || isResending) return;
    setIsResending(true);
    setGeneralError(null);
    try {
      const response = await resendRegistrationCode({
        email: pendingEmail,
        challenge_id: pendingChallenge.challenge_id,
      });
      setPendingChallenge(response);
      setVerificationCode("");
      otpRef.current?.clear();
      setVerificationStatus("idle");
      setVerificationError("");
      setVerificationRetryAvailable(false);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        setGeneralError("Yeni kod istemeden önce kısa bir süre bekleyin.");
      } else {
        setGeneralError("Kod gönderilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setGeneralError(null);
      if (!noticeAcknowledged || !noticeConfig) {
        setGeneralError(
          "Google ile kayıt olmak için önce KVKK Aydınlatma Metni’ni görüntüleyip bilgilendirildiğini onaylamalısın."
        );
        return;
      }
      const selectedRole = lockedRole ?? (
        form.getValues("role") === "tutor" ? "tutor" : "student"
      );
      try {
        const resp = await googleAuth({
          credential,
          role: selectedRole,
          notice_code: noticeConfig.code,
          notice_version: noticeConfig.version,
          notice_acknowledged: true,
        });
        if ("needs_role" in resp) {
          setGeneralError("Kayıt tamamlanamadı. Lütfen tekrar deneyin.");
          return;
        }
        await completeAuth(resp);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 400 &&
          error.response?.data?.notice_version
        ) {
          setGeneralError(
            "KVKK Aydınlatma Metni güncellendi. Lütfen sayfayı yenileyip güncel metni inceleyin."
          );
        } else {
          setGeneralError("Google ile kayıt başarısız oldu. Lütfen tekrar deneyin.");
        }
      }
    },
    [completeAuth, form, lockedRole, noticeAcknowledged, noticeConfig]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  if (pendingEmail) {
    return (
      <div className="flex flex-col gap-6">
        {generalError && <ErrorMessage message={generalError} />}

        <div className="animate-element animate-delay-300 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                E-postanı doğrula
              </h2>
              <p className="mt-1 text-sm text-neutral-400">
                {pendingEmail} adresine 6 haneli kod gönderdik.
              </p>
            </div>
          </div>

          <p className="text-sm font-medium text-neutral-400">Doğrulama kodu</p>
          <OtpInput
            ref={otpRef}
            autoFocus
            className="mt-2"
            disabled={isConfirming || expiresIn === 0}
            status={
              expiresIn === 0 && verificationStatus !== "success"
                ? "error"
                : verificationStatus
            }
            errorMessage={
              expiresIn === 0
                ? "Kodun süresi doldu. Yeni kod isteyin."
                : verificationError
            }
            successMessage="Kod doğrulandı."
            hint={`Kodun kalan süresi: ${formatCountdown(expiresIn)}`}
            onChange={(value) => {
              setVerificationCode(value);
              if (verificationStatus === "error") {
                setVerificationStatus("idle");
                setVerificationError("");
              }
            }}
            onComplete={(value) => void handleConfirmRegistration(value)}
          />

          <button
            type="button"
            onClick={() => void handleConfirmRegistration()}
            disabled={isConfirming || verificationCode.length !== 6 || expiresIn === 0}
            className="mt-4 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
          >
            {isConfirming
              ? "Doğrulanıyor..."
              : verificationRetryAvailable
                ? "Aynı kodla tekrar dene"
                : "Kodu doğrula ve hesabı aç"}
          </button>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleResendRegistration()}
              disabled={!pendingChallenge || resendIn > 0 || isResending}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-70"
            >
              {isResending
                ? "Gönderiliyor..."
                : resendIn > 0
                  ? `Tekrar gönder (${resendIn})`
                  : "Kodu tekrar gönder"}
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingEmail(null);
                setPendingChallenge(null);
                setVerificationCode("");
                setVerificationStatus("idle");
                setVerificationError("");
                setVerificationRetryAvailable(false);
                setGeneralError(null);
              }}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Bilgileri düzenle
            </button>
          </div>
        </div>

        <p className="animate-element animate-delay-800 text-center text-sm text-neutral-400">
          Zaten hesabın var mı?{" "}
          {onSignIn ? (
            <button
              type="button"
              onClick={onSignIn}
              className="text-white transition-colors hover:underline"
            >
              Giriş yap
            </button>
          ) : (
            <Link href="/login" className="text-white transition-colors hover:underline">
              Giriş yap
            </Link>
          )}
        </p>
      </div>
    );
  }

  const roleButtonClass = (value: "student" | "tutor") =>
    cn(
      "flex-1 rounded-2xl border py-3 text-sm font-medium transition-colors",
      role === value
        ? "border-white bg-white text-neutral-950"
        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
    );

  return (
    <div className="flex flex-col gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {generalError && <ErrorMessage message={generalError} />}

          {!lockedRole && <div className="animate-element animate-delay-300 flex gap-3">
            <button
              type="button"
              onClick={() => form.setValue("role", "student")}
              className={roleButtonClass("student")}
            >
              Öğrenci
            </button>
            <button
              type="button"
              onClick={() => form.setValue("role", "tutor")}
              className={roleButtonClass("tutor")}
            >
              Hoca
            </button>
          </div>}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-400 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  E-posta
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="E-posta adresini gir"
                      className="w-full rounded-2xl bg-transparent p-4 text-base text-white placeholder:text-neutral-500 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-500 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  Şifre
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        maxLength={128}
                        placeholder="Şifreni gir"
                        className="w-full rounded-2xl bg-transparent p-4 pr-12 text-base text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white"
                        aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                        aria-pressed={showPassword}
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
                <PasswordStrength value={passwordValue} className="pt-1" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password_confirm"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-600 space-y-2">
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
                        maxLength={128}
                        placeholder="Şifreni tekrar gir"
                        className="w-full rounded-2xl bg-transparent p-4 pr-12 text-base text-white placeholder:text-neutral-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-400 transition-colors hover:text-white"
                        aria-label={showPasswordConfirm ? "Şifre tekrarını gizle" : "Şifre tekrarını göster"}
                        aria-pressed={showPasswordConfirm}
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
                {passwordMatchMessage && (
                  <p
                    role="status"
                    className={cn(
                      "text-xs",
                      passwordValue === passwordConfirmValue
                        ? "text-emerald-400"
                        : "text-red-400"
                    )}
                  >
                    {passwordMatchMessage}
                  </p>
                )}
              </FormItem>
            )}
          />

          {/* A shared invite link fills this in; anyone who was handed a code
              on paper or in a message can still type it. Optional, and never
              a reason a registration fails to start. */}
          <FormField
            control={form.control}
            name="referral_code"
            render={({ field }) => (
              <FormItem className="animate-element animate-delay-700 space-y-2">
                <FormLabel className="text-sm font-medium text-neutral-400">
                  Davet kodu{" "}
                  <span className="text-neutral-500">(opsiyonel)</span>
                </FormLabel>
                <FormControl>
                  <GlassInputWrapper>
                    <input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          normalizeReferralCode(event.target.value),
                        )
                      }
                      type="text"
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={12}
                      placeholder="Örn. 7SWAMTPS"
                      className="w-full rounded-2xl bg-transparent p-4 text-base uppercase tracking-[0.18em] text-white placeholder:tracking-normal placeholder:text-neutral-500 focus:outline-none"
                    />
                  </GlassInputWrapper>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* role refine error surfaces here if no role selected */}
          <FormField
            control={form.control}
            name="role"
            render={() => (
              <FormItem className="space-y-0">
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <button
              type="button"
              disabled={!noticeConfig}
              onClick={() => setNoticeOpen(true)}
              className="inline-flex min-h-6 items-center text-left text-sm font-medium text-white underline underline-offset-4 disabled:cursor-not-allowed disabled:text-neutral-500"
            >
              KVKK Aydınlatma Metni’ni görüntüle
            </button>
            <label
              className={cn(
                "flex items-start gap-3 text-xs leading-5",
                noticeViewed ? "text-neutral-300" : "text-neutral-500"
              )}
            >
              <input
                type="checkbox"
                checked={noticeAcknowledged}
                disabled={!noticeViewed}
                onChange={(event) => setNoticeAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-white disabled:cursor-not-allowed"
                aria-describedby="kvkk-acknowledgement-help"
              />
              <span>
                KVKK Aydınlatma Metni’ni görüntüledim ve kişisel verilerimin
                işlenmesi hakkında bilgilendirildim.
              </span>
            </label>
            <p id="kvkk-acknowledgement-help" className="text-xs leading-5 text-neutral-500">
              {noticeConfigFailed
                ? "Aydınlatma Metni bilgisi alınamadı. Kayıt için sayfayı yenileyin."
                : "Bu kutu açık rıza değildir. Metni görüntüledikten sonra etkinleşir."}
            </p>
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting || !noticeAcknowledged}
            className="animate-element animate-delay-700 w-full rounded-2xl bg-white py-4 font-medium text-neutral-950 transition-colors hover:bg-white/90 disabled:opacity-70"
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent"
                  aria-hidden
                />
                Kayıt Ol
              </span>
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>
      </Form>

      <div className="relative flex items-center justify-center">
        <span className="w-full border-t border-white/10" />
        <span className="absolute bg-neutral-950 px-4 text-sm text-neutral-400">
          veya devam et
        </span>
      </div>

      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        text="signup_with"
        disabled={!noticeAcknowledged}
      />

      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent className="flex h-[min(90dvh,760px)] w-[calc(100dvw-1rem)] max-w-4xl flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12 text-left">
            <DialogTitle>KVKK Aydınlatma Metni</DialogTitle>
            <DialogDescription>
              Metin bilgilendirme amaçlıdır; açık rıza talebi değildir.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto bg-background">
            {noticeConfig && (
              <AydinlatmaMetniPreview
                noticeUrl={noticeConfig.url}
                onReady={handleNoticeReady}
              />
            )}
          </div>
          <DialogFooter className="shrink-0 border-t p-4 sm:space-x-0">
            <button
              type="button"
              disabled={!noticeLoaded}
              onClick={() => {
                setNoticeViewed(true);
                setNoticeOpen(false);
              }}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Metni görüntüledim
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="animate-element animate-delay-800 text-center text-sm text-neutral-400">
        Zaten hesabın var mı?{" "}
        {onSignIn ? (
          <button
            type="button"
            onClick={onSignIn}
            className="text-white transition-colors hover:underline"
          >
            Giriş yap
          </button>
        ) : (
          <Link href="/login" className="text-white transition-colors hover:underline">
            Giriş yap
          </Link>
        )}
      </p>
    </div>
  );
}
