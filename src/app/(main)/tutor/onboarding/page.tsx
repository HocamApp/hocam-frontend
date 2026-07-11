"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyTutorProfile } from "@/lib/tutorsApi";
import { fetchAvailability, fetchVerification } from "@/lib/dashboardApi";
import { VerificationForm } from "@/components/tutors/VerificationForm";
import { AvailabilityCalendar } from "@/components/tutors/AvailabilityCalendar";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OnboardingStep = {
  title: string;
  description: string;
  complete: boolean;
  active: boolean;
};

function TutorOnboardingContent() {
  const { isAuthenticated } = useAuth();
  const [showWelcome, setShowWelcome] = useState(false);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["tutor-me"],
    queryFn: fetchMyTutorProfile,
    enabled: isAuthenticated,
    retry: false,
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
  });

  const profileComplete = Boolean(profile);
  const verificationApproved = profile?.is_verified === true || verification?.status === "approved";
  const setupComplete = verificationApproved && (profile?.subjects.length ?? 0) > 0 && availability.length > 0;
  const welcomeStorageKey = profile ? `hocam:tutor-onboarding-welcome:${profile.id}` : null;

  useEffect(() => {
    if (setupComplete && welcomeStorageKey && !window.localStorage.getItem(welcomeStorageKey)) {
      setShowWelcome(true);
    }
  }, [setupComplete, welcomeStorageKey]);

  const handleWelcomeChange = (open: boolean) => {
    setShowWelcome(open);
    if (!open && welcomeStorageKey) {
      window.localStorage.setItem(welcomeStorageKey, "true");
    }
  };

  if (profileLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-96 w-full" /></div>;
  }

  const steps: OnboardingStep[] = [
    {
      title: "E-posta ile kayıt",
      description: "Hesabın e-posta kodu ile doğrulandı.",
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
      title: "Belge doğrulaması",
      description: "Öğrenci kimliği ve YKS sonuç belgesi incelenir.",
      complete: verificationApproved,
      active: profileComplete && !verificationApproved,
    },
    {
      title: "Dersler ve müsaitlik",
      description: "Verdiğin dersleri ve uygun saatlerini ayarla.",
      complete: setupComplete,
      active: verificationApproved && !setupComplete,
    },
  ];
  const completeCount = steps.filter((step) => step.complete).length;
  const progress = completeCount * 25;

  return (
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
              <li key={step.title} className="flex gap-3">
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
              </li>
            ))}
          </ol>

          {!profileComplete && (
            <Button asChild className="w-full"><Link href="/tutor/setup">Profil bilgilerini ekle</Link></Button>
          )}
          {profileComplete && !verificationApproved && <VerificationForm />}
          {verificationApproved && !setupComplete && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium">Son adım: dersler ve müsaitlik</p>
              <p className="text-sm text-muted-foreground">
                Aşağıdaki takvimden bir gün seçip Düzenle ile uygun saatlerini ekle.
                Bu işlem tamamlandığında hesabın burada, aynı sayfada aktifleşecek.
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

      <Dialog open={showWelcome} onOpenChange={handleWelcomeChange}>
        <DialogContent className="overflow-hidden text-center sm:max-w-lg">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
          <DialogHeader className="items-center pt-5">
            <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary motion-safe:animate-message-pop">
              <PartyPopper className="h-10 w-10" />
            </div>
            <DialogTitle className="text-3xl">Ailemize hoş geldin!</DialogTitle>
            <DialogDescription className="max-w-sm text-center text-base leading-7">
              Hoca profilin tamamlandı. Öğrenciler artık seni keşfedebilir, sana
              ulaşabilir ve ders ayırtabilir.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => handleWelcomeChange(false)} className="mt-3 w-full">
            Harika, devam et
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TutorOnboardingPage() {
  return <RouteGuard requireAuth requireRole="tutor"><TutorOnboardingContent /></RouteGuard>;
}
