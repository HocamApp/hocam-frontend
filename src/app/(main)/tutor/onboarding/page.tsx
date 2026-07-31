"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, Circle, Clock, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile, uploadTutorProfilePicture } from "@/lib/tutorsApi";
import { fetchAvailability, fetchVerification } from "@/lib/dashboardApi";
import { VerificationForm } from "@/components/tutors/VerificationForm";
import { AvailabilityCalendar } from "@/components/tutors/AvailabilityCalendar";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { ScribbleLayers } from "@/components/decor/ScribbleLayer";
import { NARROW_FLOW_SCRIBBLES } from "@/lib/scribblePlacements";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { validateProfilePhotoFile, PROFILE_PHOTO_ACCEPT } from "@/lib/profilePhoto";

type OnboardingStep = {
  title: string;
  description: string;
  complete: boolean;
  active: boolean;
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
  const { data: availability = [] } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: isAuthenticated && !!profile,
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
  const lessonsReady = verificationApproved && photoComplete && (profile?.subjects.length ?? 0) > 0 && availability.length > 0;
  const setupComplete = lessonsReady && tutorialComplete;

  const photoMutation = useMutation({
    mutationFn: uploadTutorProfilePicture,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["tutor-me"], updatedProfile);
      setPhotoError(null);
    },
    onError: () => setPhotoError("Fotoğraf yüklenemedi. Lütfen tekrar deneyin."),
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
      // Nothing left to do once submitted (pending review) — active hands
      // off to the tutorial stage rather than staying lit while approval
      // is out of the tutor's hands.
      active: profileComplete && photoComplete && !verificationSubmitted,
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
    {
      title: "Dersler ve müsaitlik",
      description: "Verdiğin dersleri ve uygun saatlerini ayarla.",
      complete: lessonsReady,
      active: verificationApproved && photoComplete && !lessonsReady,
    },
  ];
  const completeCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completeCount / steps.length) * 100);

  return (
    <div className="relative isolate">
      <ScribbleLayers layers={NARROW_FLOW_SCRIBBLES} />
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Hoca hesabını tamamla</CardTitle>
          <CardDescription>
            Öğrenciler yalnızca doğrulanmış ve tamamlanmış hoca profillerini görebilir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profil ilerlemesi</span>
              <span className="font-medium">%{progress}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={step.title}>
                {/* Verification and the tutorial read as two distinct stages
                    rather than adjacent checklist items — a small stage
                    label plus a divider ahead of each, instead of a
                    structural rewrite of the steps array. */}
                {step.title === "Belge doğrulaması" && (
                  <p className="mb-2 border-t pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Aşama 1 · Hesap doğrulama
                  </p>
                )}
                {step.title === "Canlı ders eğitimi" && (
                  <p className="mb-2 border-t pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Aşama 2 · Derse hazırlık
                  </p>
                )}
                <div className="flex gap-3">
                  {step.complete ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : step.active ? (
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{index + 1}. {step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {!profileComplete && (
            <Button asChild className="w-full"><Link href="/tutor/setup">Profil bilgilerini ekle</Link></Button>
          )}
          {profileComplete && !photoComplete && (
            <div className="space-y-4 rounded-lg border p-5">
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
          {/* Stage 1: document verification. VerificationForm handles its
              own not-submitted/pending/approved/rejected states internally,
              so it stays mounted for the whole stage (through pending
              review) — only the tutorial CTA below is gated on submission. */}
          {profileComplete && photoComplete && !verificationApproved && <VerificationForm />}
          {/* Stage 2: only presented once verification has been submitted —
              sequencing, not a completion dependency. verificationApproved
              is never checked here, so an approval still pending doesn't
              block the tutorial. */}
          {profileComplete && photoComplete && verificationSubmitted && !tutorialComplete && (
            <div className="flex flex-col gap-3 rounded-lg border p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Canlı ders eğitimini tamamla</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ders ekranındaki araçları (kamera, tahta, canlı soru, ders bitirme)
                  kısa ve interaktif bir rehberle öğren. Bitirmeden hesabın öğrencilere açılmaz.
                </p>
              </div>
              <Button asChild className="shrink-0">
                <Link href="/tutor/tutorial">Eğitime başla</Link>
              </Button>
            </div>
          )}
          {verificationApproved && !lessonsReady && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Son adım: dersler ve müsaitlik</p>
              <p className="text-sm text-muted-foreground">
                Aşağıdaki takvimden bir gün seçip Düzenle ile uygun saatlerini ekle.
                Bu işlem tamamlandığında hoca ana sayfana otomatik yönlendirileceksin.
              </p>
              <AvailabilityCalendar availability={availability} bookings={[]} />
            </div>
          )}
          {setupComplete && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-5 text-center dark:border-green-900/60 dark:bg-green-950/30">
              <PartyPopper className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <p className="font-semibold">Hoca hesabın tamamlandı</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Artık öğrenciler seni görebilir ve ders ayırtabilir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

export default function TutorOnboardingPage() {
  return <RouteGuard requireAuth requireRole="tutor"><TutorOnboardingContent /></RouteGuard>;
}
