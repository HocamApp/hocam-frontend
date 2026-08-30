"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle, Circle, Clock, Confetti } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile, uploadTutorProfilePicture } from "@/lib/tutorsApi";
import { fetchVerification } from "@/lib/dashboardApi";
import { VerificationForm } from "@/components/tutors/VerificationForm";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { validateProfilePhotoFile, PROFILE_PHOTO_ACCEPT } from "@/lib/profilePhoto";
import { bypassAdminTutorOnboardingVerification } from "@/lib/adminControlApi";
import { TutorJourneyAside } from "@/components/tutors/TutorJourneyAside";
import { cn } from "@/lib/utils";

type OnboardingStep = {
  title: string;
  description: string;
  complete: boolean;
  active: boolean;
  waiting?: boolean;
};

function TutorOnboardingContent() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: 15_000,
  });
  const { data: verification } = useQuery({
    queryKey: ["verification"],
    queryFn: async () => {
      try {
        return await fetchVerification();
      } catch (error: unknown) {
        const response = error as { response?: { status?: number } };
        if (response.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: isAuthenticated && !!profile,
    retry: false,
    refetchInterval: 15_000,
  });

  const profileComplete = Boolean(profile);
  const photoComplete = Boolean(profile?.profile_picture);
  const verificationApproved = profile?.is_verified === true || verification?.status === "approved";
  // Verification and the tutorial are two distinct stages of the flow, not
  // adjacent checklist items: the tutorial isn't presented until documents
  // have been submitted. "Submitted" (pending or approved) is deliberately
  // NOT the same gate as verificationApproved — a rejected/never-submitted
  // tutor stays on the verification stage, but once submitted the tutorial
  // stage opens regardless of admin review outcome. tutorialComplete itself
  // never reads verification state, so the two axes stay independent —
  // completing the tutorial never requires verification to be approved.
  const verificationSubmitted = verificationApproved || verification?.status === "pending";
  // Independent axis: the tutorial can be completed while documents are still
  // under review. Backend truth arrives via /auth/me/.
  const tutorialComplete = Boolean(user?.jitsi_tutorial_completed);
  const setupComplete = verificationApproved && photoComplete && tutorialComplete;

  const photoMutation = useMutation({
    mutationFn: uploadTutorProfilePicture,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["tutor-me"], updatedProfile);
      setPhotoError(null);
    },
    onError: () => setPhotoError("Fotoğraf yüklenemedi. Lütfen tekrar deneyin."),
  });
  const qaVerificationMutation = useMutation({
    mutationFn: bypassAdminTutorOnboardingVerification,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["verification"] }),
        queryClient.invalidateQueries({ queryKey: ["tutor-me"] }),
      ]);
    },
  });

  useEffect(() => {
    if (!setupComplete) return;
    const timeout = window.setTimeout(() => router.replace("/home"), 1200);
    return () => window.clearTimeout(timeout);
  }, [router, setupComplete]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    photoMutation.mutate(file);
  };

  if (profileLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96 w-full" /></div>;
  }

  const steps: OnboardingStep[] = [
    {
      title: "E-posta ile kayıt",
      description: "Hesabın e-posta ve şifrenle oluşturuldu.",
      complete: true,
      active: false,
    },
    {
      title: "Profil bilgileri",
      description: "Adın, okulun, sıralaman ve profil bilgilerin.",
      complete: profileComplete,
      active: !profileComplete,
    },
    {
      title: "Profil fotoğrafı",
      description: "Öğrencilerin seni tanıyabilmesi için gerçek bir fotoğraf ekle.",
      complete: photoComplete,
      active: profileComplete && !photoComplete,
    },
    {
      title: "Belge doğrulaması",
      description: "Öğrenci kimliği ve YKS sonuç belgesi incelenir.",
      complete: verificationApproved,
      active: profileComplete && photoComplete && !verificationSubmitted,
      waiting: verification?.status === "pending",
    },
    {
      title: "Canlı ders eğitimi",
      description: "Ders ekranını 5 dakikada öğren — belge incelemesini beklemeden tamamlayabilirsin.",
      complete: tutorialComplete,
      // Gated on verificationSubmitted (not verificationApproved) — this is
      // sequencing, not a dependency. tutorialComplete above is computed
      // without any reference to verification state.
      active: profileComplete && photoComplete && verificationSubmitted && !tutorialComplete,
    },
  ];
  const completeCount = steps.filter((step) => step.complete || step.waiting).length;
  const progress = Math.round((completeCount / steps.length) * 100);
  const journeyCopy = !profileComplete
    ? {
        title: "Öğrencilerin seni tanıyacağı profili oluşturalım.",
        description: "Temel bilgilerini, verdiğin dersleri ve anlatım tarzını tek seferde ekle.",
        fact: undefined,
      }
    : !photoComplete
      ? {
          title: "Şimdi profiline bir yüz kazandıralım.",
          description: "Net ve doğal bir fotoğraf, öğrencilerin seni daha kolay tanımasına yardımcı olur.",
          fact: "Fotoğrafını ve profil bilgilerini daha sonra hoca panelinden güncelleyebilirsin.",
        }
      : !verificationSubmitted
        ? {
            title: "Güven adımındasın.",
            description: "Belgelerin yalnızca hoca doğrulaması için incelenir ve profilinde yayınlanmaz.",
            fact: "Belgelerini gönderdikten sonra inceleme sonucunu beklemeden canlı ders eğitimine geçebilirsin.",
          }
        : !tutorialComplete
          ? {
              title: "Son kontrol: ders ekranını tanı.",
              description: "Kısa rehber kamera, ekran paylaşımı, tahta ve ders bitirme araçlarını uygulamalı gösterir.",
              fact: "Canlı ders eğitimi yaklaşık 5 dakika sürer ve kaldığın yerden devam edebilirsin.",
            }
          : !verificationApproved
            ? {
                title: "Senin tarafındaki her şey tamam.",
                description: "Belgelerin inceleniyor. Onaylandığında profilin otomatik olarak hazır olacak.",
                fact: "Müsait saatlerini ve verdiğin dersleri hoca panelinden istediğin zaman düzenleyebilirsin.",
              }
            : {
                title: "Hocam’da ders vermeye hazırsın!",
                description: "Profilin tamamlandı. Öğrenciler artık seni keşfedebilir.",
                fact: "Ders ücretin ve takvimin senin kontrolünde; ikisini de hoca panelinden değiştirebilirsin.",
              };

  return (
    <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,7fr)_minmax(300px,5fr)] lg:items-start lg:py-12">
      <Card className="overflow-hidden rounded-card border-line bg-surface shadow-none">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  "rounded-input border border-line bg-surface px-4 py-4 transition-colors duration-[var(--duration-state)]",
                  step.active && "border-pink",
                  step.waiting && "border-gold bg-gold text-gold-ink",
                  step.complete && "border-success bg-success-soft"
                )}
              >
                <div className="flex gap-3">
                  {step.complete ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-success" weight="fill" />
                  ) : step.waiting ? (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-gold-ink" />
                  ) : step.active ? (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-pink" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{index + 1}. {step.title}</p>
                      {step.waiting && <span className="text-xs font-medium text-gold-ink">İncelemede</span>}
                      {step.complete && <span className="text-xs font-medium text-success">Tamamlandı</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {!profileComplete && (
            <Button asChild className="h-12 w-full bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"><Link href="/tutor/setup">Profilini oluşturmaya başla</Link></Button>
          )}
          {profileComplete && !photoComplete && (
            <div className="space-y-4 rounded-card border border-line bg-paper p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                    {`${profile?.name?.[0] ?? ""}${profile?.surname?.[0] ?? ""}`.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Profil fotoğrafını ekle</p>
                  <p className="mt-1 text-sm text-muted-foreground">Yüzünün net göründüğü, yalnızca sana ait bir JPG, PNG veya WebP fotoğraf yükle. En fazla 5 MB.</p>
                </div>
              </div>
              <Input className="hidden" ref={photoInputRef} type="file" accept={PROFILE_PHOTO_ACCEPT} onChange={handlePhotoChange} disabled={photoMutation.isPending} />
              {photoError && <p className="text-sm text-destructive">{photoError}</p>}
              <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={photoMutation.isPending}>
                <Camera className="mr-2 h-4 w-4" />
                {photoMutation.isPending ? "Fotoğraf yükleniyor..." : "Fotoğraf seç"}
              </Button>
            </div>
          )}
          {profileComplete && photoComplete && !verificationApproved && (
            <div className="space-y-4">
              {user?.impersonation && user.is_test_account && (
                <div className="rounded-lg border border-violet-300 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                  <p className="font-medium">Admin QA doğrulama kısayolu</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Bu TEST hesap için belge ve üniversite e-postası yüklemeden akışın sonraki adımlarını inceleyebilirsin.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3"
                    disabled={qaVerificationMutation.isPending}
                    onClick={() => qaVerificationMutation.mutate()}
                  >
                    {qaVerificationMutation.isPending ? "QA doğrulaması uygulanıyor…" : "Belge doğrulamasını QA için geç"}
                  </Button>
                </div>
              )}
              <VerificationForm />
            </div>
          )}
          {profileComplete && photoComplete && verificationSubmitted && !tutorialComplete && (
            <div className="flex flex-col gap-3 rounded-card border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Canlı ders eğitimini tamamla</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ders ekranındaki araçları (kamera, ekran paylaşımı, tahta, ders bitirme)
                  kısa ve interaktif bir rehberle öğren. Bitirmeden hesabın öğrencilere açılmaz.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/tutor/tutorial">Eğitime başla</Link>
              </Button>
            </div>
          )}
          {setupComplete && (
            <div className="rounded-card border border-success bg-success-soft p-5 text-center">
              <Confetti className="mx-auto mb-2 h-8 w-8 text-success" />
              <p className="font-semibold">Hoca hesabın tamamlandı</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Artık öğrenciler seni görebilir ve ders ayırtabilir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <TutorJourneyAside
        title={journeyCopy.title}
        description={journeyCopy.description}
        progress={progress}
        progressLabel={`${completeCount}/${steps.length} adım tamamlandı`}
        fact={journeyCopy.fact}
      />
    </div>
  );
}

export default function TutorOnboardingPage() {
  return <RouteGuard requireAuth requireRole="tutor"><TutorOnboardingContent /></RouteGuard>;
}
