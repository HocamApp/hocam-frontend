"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, X } from "@phosphor-icons/react";

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
    /* Ink and hairline, not a sky-blue tint band. The palette runs on three
       hues plus neutrals and blue is not one of them, so an announcement that
       reaches for `sky-50` is adding a fourth colour to say something the page
       already says structurally. */
    <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <GraduationCap className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" weight="regular" />
      <div className="min-w-0 flex-1">
        <p className="text-small font-medium">Yeni: Canlı ders kullanım eğitimi yayında</p>
        <p className="mt-0.5 text-small text-ink-mid">
          Ders ekranındaki araçları 5 dakikada tazele: ekran paylaşımı, tahta ve ders
          bitirme akışları dahil. Hesabın etkilenmez.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/tutor/tutorial?replay=1"
          className="rounded-pill border border-ink px-[22px] py-1.5 text-small font-medium text-ink transition-colors duration-[var(--duration-state)] hover:bg-ink hover:text-paper"
        >
          Göz at
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Duyuruyu kapat"
          className="rounded-pill p-1.5 text-ink-mid transition-colors duration-[var(--duration-state)] hover:bg-paper hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" weight="regular" />
        </button>
      </div>
    </div>
  );
}
