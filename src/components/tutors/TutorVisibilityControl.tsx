"use client";

import Link from "next/link";
import { ArrowSquareOut, Eye, EyeSlash } from "@phosphor-icons/react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTutorVisibility } from "@/hooks/useTutorVisibility";

/**
 * Whether a tutor's profile is on the marketplace, stated in the header and
 * changeable from it.
 *
 * It reads as a status first and a control second, which is the right order:
 * a tutor needs to know the answer far more often than they need to change
 * it, and until now the answer was only visible three clicks deep in the
 * profile editor while nothing anywhere could change it at all.
 *
 * Outline and filled carry the state, per the icon convention: an open eye
 * outlined when published, a struck eye filled when hidden. Colour is not the
 * only signal — the label says it too.
 */
export function TutorVisibilityControl() {
  const {
    isPublic,
    isVerified,
    previewHref,
    isPending,
    error,
    setVisible,
    clearError,
  } = useTutorVisibility();

  // Nothing to report before the profile lands, and nothing to say to a tutor
  // who is not verified yet: their profile cannot be on the marketplace
  // either way, and the onboarding gate is already telling them so.
  if (isPublic === null || !isVerified) return null;

  const Icon = isPublic ? Eye : EyeSlash;

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) clearError();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-pill px-3 text-small font-medium text-ink transition-colors duration-[var(--duration-state)] hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2"
        >
          <Icon
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            weight={isPublic ? "regular" : "fill"}
          />
          {/* The label is the state. Below `lg` the tab strip and the icon
              cluster need the room, so it drops and the icon carries it. */}
          <span className="hidden lg:inline">
            {isPublic ? "Profilin yayında" : "Profilin gizli"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[min(20rem,calc(100vw-1.5rem))] rounded-card border-line p-4"
      >
        <p className="text-label text-ink-mid">Profil görünürlüğü</p>
        <p className="mt-2 text-small">
          {isPublic
            ? "Öğrenciler seni arama sonuçlarında bulabiliyor ve ders talebi gönderebiliyor."
            : "Profilin arama sonuçlarında görünmüyor. Mevcut derslerin ve mesajların etkilenmez."}
        </p>

        {error ? (
          /* Inline, next to the control that failed. A toast would take this
             sentence away from the button the tutor is about to press again. */
          <p className="mt-3 text-small text-error">{error}</p>
        ) : null}

        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            variant={isPublic ? "outline" : "default"}
            size="sm"
            disabled={isPending}
            onClick={() => setVisible(!isPublic)}
          >
            {isPending
              ? "Kaydediliyor..."
              : isPublic
                ? "Profili gizle"
                : "Profili yayına al"}
          </Button>

          {previewHref ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={previewHref}>
                <ArrowSquareOut
                  aria-hidden="true"
                  className="mr-2 h-5 w-5"
                  weight="regular"
                />
                Öğrenci görünümünü aç
              </Link>
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
