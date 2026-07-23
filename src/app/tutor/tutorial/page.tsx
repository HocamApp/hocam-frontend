"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

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
      <div className="flex h-full items-center justify-center p-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-gray-900 p-6 text-center shadow-2xl">
          <CheckCircle2
            className="mx-auto mb-3 h-10 w-10 text-emerald-400"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold">
            Canlı ders eğitimini zaten tamamladın
          </h1>
          <p className="mt-2 text-sm text-gray-300">
            Hesabın canlı derslere açık. İstersen eğitimi tekrar izleyebilirsin
            — tekrar izlemek aktivasyonunu etkilemez.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/tutor/tutorial?replay=1"
              className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-400"
            >
              Tekrar izle
            </Link>
            <Link
              href="/dashboard/tutor"
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-white/10"
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
