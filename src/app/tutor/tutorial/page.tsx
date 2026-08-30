"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "@phosphor-icons/react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LiveLessonTutorial } from "@/components/tutorial/LiveLessonTutorial";
import { useAuth } from "@/hooks/useAuth";

function TutorialPageInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const replay = searchParams.get("replay") === "1";

  // Completed tutors landing here without ?replay=1 (old link, manual URL)
  // should not silently re-enter persistence mode.
  if (user?.jitsi_tutorial_completed && !replay) {
    return (
      <div className="flex h-full items-center justify-center bg-paper p-4 text-ink">
        <div className="w-full max-w-md rounded-modal border border-line bg-surface p-7 text-center shadow-float">
          <CheckCircle
            className="mx-auto mb-3 h-10 w-10 text-success"
            weight="fill"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold">
            Canlı ders eğitimini zaten tamamladın
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-mid">
            Hesabın canlı derslere açık. İstersen eğitimi tekrar izleyebilirsin
            — tekrar izlemek aktivasyonunu etkilemez.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/tutor/tutorial?replay=1"
              className="rounded-pill bg-pink px-4 py-2 text-sm font-bold text-white transition-colors duration-state hover:bg-pink-deep"
            >
              Tekrar izle
            </Link>
            <Link
              href="/dashboard/tutor"
              className="rounded-pill border border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors duration-state hover:bg-paper"
            >
              Panele dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <LiveLessonTutorial replay={replay} />;
}

export default function TutorTutorialPage() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        }
      >
        <TutorialPageInner />
      </Suspense>
    </RouteGuard>
  );
}
