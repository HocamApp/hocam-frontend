import { cn } from "@/lib/utils";

interface NotificationMarkProps {
  className?: string;
  unreadCount: number;
}

/**
 * The unread count that overlaps the notification bell. It stays circular for
 * one- and two-digit values, grows only for `99+`, and disappears at zero.
 */
export function NotificationMark({
  className,
  unreadCount,
}: NotificationMarkProps) {
  const count = Math.max(0, Math.floor(unreadCount));
  if (count === 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none inline-flex h-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold leading-none text-paper tabular-nums ring-2 ring-surface",
        label.length > 2 ? "min-w-6" : "w-5",
        className,
      )}
    >
      {label}
    </span>
  );
}
