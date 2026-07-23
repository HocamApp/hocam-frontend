"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export const EARLY_JOIN_MINUTES = 15;

interface LessonJoinButtonProps {
  bookingId: string;
  startTime: string;
  durationMinutes: number;
  status: string;
  roomUrl?: string | null;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

export function canJoinLesson(
  startTime: string,
  durationMinutes: number,
  status: string,
  now = Date.now()
): boolean {
  const startAt = new Date(startTime).getTime();
  const endAt = startAt + durationMinutes * 60_000;
  return (
    (status === "confirmed" || status === "in_progress") &&
    now >= startAt - EARLY_JOIN_MINUTES * 60_000 &&
    now < endAt
  );
}

export function LessonJoinButton({
  bookingId,
  startTime,
  durationMinutes,
  status,
  roomUrl,
  label = "Derse katıl",
  size,
  variant = "default",
  className,
}: LessonJoinButtonProps) {
  const { user, isTutor } = useAuth();
  // Defense-in-depth only: the backend refuses the session token anyway.
  const tutorialBlocked = isTutor && user ? !user.jitsi_tutorial_completed : false;
  const [now, setNow] = useState(() => Date.now());
  const joinAt = new Date(startTime).getTime() - EARLY_JOIN_MINUTES * 60_000;
  const endAt = new Date(startTime).getTime() + durationMinutes * 60_000;
  const isActive = status === "confirmed" || status === "in_progress";
  const canJoin =
    Boolean(roomUrl) &&
    canJoinLesson(startTime, durationMinutes, status, now);
  const hasEnded = now >= endAt;

  useEffect(() => {
    if (now >= endAt) return;
    const nextBoundary = now < joinAt ? joinAt : endAt;
    const delay = Math.min(Math.max(nextBoundary - Date.now() + 100, 100), 60_000);
    const timeout = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [endAt, joinAt, now]);

  if (hasEnded) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn("text-foreground", className)}
        disabled
      >
        Ders sona erdi
      </Button>
    );
  }

  if (!isActive) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn("text-foreground", className)}
        disabled
      >
        Ders aktif değil
      </Button>
    );
  }

  if (tutorialBlocked) {
    return (
      <Button
        type="button"
        size={size}
        variant="outline"
        aria-disabled="true"
        className={cn(
          "cursor-not-allowed text-foreground opacity-60 hover:text-foreground",
          className
        )}
        onClick={() =>
          toast.info("Önce canlı ders eğitimini tamamla", {
            description:
              "Derslere katılabilmek için kısa canlı ders eğitimini bitirmen gerekiyor.",
          })
        }
      >
        <Video className="mr-2 h-4 w-4" />
        {label}
      </Button>
    );
  }

  if (!roomUrl) {
    return (
      <Button
        size={size}
        variant="outline"
        className={cn("text-foreground", className)}
        disabled
      >
        Oda hazırlanıyor
      </Button>
    );
  }

  if (canJoin) {
    return (
      <Button asChild size={size} variant={variant} className={className}>
        <Link href={`/session/${bookingId}`}>
          <Video className="mr-2 h-4 w-4" />
          {label}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      aria-disabled="true"
      className={cn(
        "cursor-not-allowed text-foreground opacity-60 hover:text-foreground",
        className
      )}
      onClick={() =>
        toast.info("Henüz derse katılamazsın", {
          description: `Derse katılma butonu ders başlangıcından ${EARLY_JOIN_MINUTES} dakika önce aktifleşir.`,
        })
      }
    >
      <Video className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
