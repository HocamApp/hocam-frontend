"use client";

interface TutorPresenceBadgeProps {
  isOnline?: boolean;
  className?: string;
}

export function TutorPresenceBadge({
  isOnline = false,
  className = "",
}: TutorPresenceBadgeProps) {
  const label = isOnline ? "Çevrim içi" : "Çevrim dışı";

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
