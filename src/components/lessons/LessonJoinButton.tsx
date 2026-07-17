"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn, parseBookingDate } from "@/lib/utils";

export const EARLY_JOIN_MINUTES = 15;

interface LessonJoinButtonProps {
  bookingId: string;
  startTime: string;
  roomUrl?: string | null;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

export function canJoinLesson(startTime: string, now = Date.now()): boolean {
  return now >= parseBookingDate(startTime).getTime() - EARLY_JOIN_MINUTES * 60_000;
}

export function LessonJoinButton({
  bookingId,
  startTime,
  roomUrl,
  label = "Derse katıl",
  size,
  variant = "default",
  className,
}: LessonJoinButtonProps) {
  const [now, setNow] = useState(() => Date.now());
  const joinAt = parseBookingDate(startTime).getTime() - EARLY_JOIN_MINUTES * 60_000;
  const canJoin = Boolean(roomUrl) && now >= joinAt;

  useEffect(() => {
    if (now >= joinAt) return;
    const delay = Math.min(Math.max(joinAt - Date.now() + 100, 100), 60_000);
    const timeout = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timeout);
  }, [joinAt, now]);

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
