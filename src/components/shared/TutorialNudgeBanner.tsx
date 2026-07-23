"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, X } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

const DISMISS_KEY = "jitsi_tutorial_nudge_dismissed_v1";

/**
 * Dismissible announcement for grandfathered tutors (auto-completed by the
 * rollout migration): invites — never forces — them to watch the new
 * live-lesson tutorial. New tutors never see this; they go through the
 * mandatory flow instead.
 */
export function TutorialNudgeBanner() {
  const { user, isTutor } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!isTutor || !user?.jitsi_tutorial_grandfathered || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage unavailable: the banner simply reappears next visit.
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-900/60 dark:bg-sky-950/30 sm:flex-row sm:items-center">
      <GraduationCap className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Yeni: Canlı ders kullanım eğitimi yayında</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Ders ekranındaki araçları 5 dakikada tazele — canlı soru, tahta ve ders
          bitirme akışları dahil. Hesabın etkilenmez.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/tutor/tutorial?replay=1"
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
        >
          Göz at
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Duyuruyu kapat"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sky-100 dark:hover:bg-sky-900/40"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
