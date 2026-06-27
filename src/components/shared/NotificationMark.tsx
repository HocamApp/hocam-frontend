import { cn } from "@/lib/utils";

interface NotificationMarkProps {
  className?: string;
  /**
   * Whether to show the mark. Static `true` for now; wire to a real
   * `has_unread_notifications` flag once the backend exists.
   */
  hasUnread?: boolean;
}

/**
 * A small, cartoon-style red exclamation badge meant to sit on top of an icon
 * (e.g. the notifications bell). Single tilted "!", reusable via `className`.
 */
export function NotificationMark({
  className,
  hasUnread = true,
}: NotificationMarkProps) {
  if (!hasUnread) return null;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-4 w-4 -rotate-[8deg] items-center justify-center rounded-full bg-destructive text-[10px] font-black leading-none text-destructive-foreground shadow-sm ring-2 ring-background",
        className
      )}
    >
      !
    </span>
  );
}
