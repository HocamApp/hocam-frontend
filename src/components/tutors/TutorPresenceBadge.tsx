"use client";

interface TutorPresenceBadgeProps {
  isOnline?: boolean;
  lastSeenAt?: string | null;
  className?: string;
}

// last_seen_at is a real server-generated UTC instant (set via
// django.utils.timezone.now() in PresenceView) — not the naive
// wall-clock-labeled-as-UTC convention Booking.start_time uses. Elapsed-time
// math is timezone-invariant either way, so a plain Date parse is correct here.
function formatLastSeenLabel(lastSeenAt?: string | null): string | null {
  if (!lastSeenAt) return null;
  const seenDate = new Date(lastSeenAt);
  if (Number.isNaN(seenDate.getTime())) return null;

  const diffMinutes = Math.floor((Date.now() - seenDate.getTime()) / 60000);
  if (diffMinutes < 1) return "az önce aktifti";
  if (diffMinutes < 60) return `${diffMinutes} dakika önce aktifti`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce aktifti`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} gün önce aktifti`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ay önce aktifti`;
}

export function TutorPresenceBadge({
  isOnline = false,
  lastSeenAt = null,
  className = "",
}: TutorPresenceBadgeProps) {
  const label = isOnline
    ? "Çevrim içi"
    : formatLastSeenLabel(lastSeenAt) ?? "Çevrim dışı";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 text-xs font-medium",
        isOnline ? "text-emerald-700" : "text-muted-foreground",
        className,
      ].join(" ")}
      aria-label={label}
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          isOnline ? "bg-emerald-500" : "bg-muted-foreground/50",
        ].join(" ")}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
