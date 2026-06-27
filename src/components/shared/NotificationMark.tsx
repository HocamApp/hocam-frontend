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
 * A small, cartoon-style red exclamation mark meant to sit on top of an icon
 * (e.g. the notifications bell). No background — just a single, slightly
 * right-tilted hand-drawn "!" rendered as inline SVG so it stays crisp at any
 * size. Reusable via `className` (color comes from `text-*`).
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
        "pointer-events-none inline-flex h-[18px] w-[18px] text-red-600",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-full w-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
      >
        {/* slight right tilt + hand-drawn taper, no circular background */}
        <g transform="rotate(9 12 12)">
          {/* tapered body: wider, slightly curved top → narrow toward the dot */}
          <path d="M8.7 3.1c.2-.9 5-.9 5.5-.1.3.5-.1 2.6-.5 5.6-.3 2.4-.6 4.7-1 6.7-.2.9-1.9.9-2.2 0-.5-2-.9-4.4-1.2-6.9-.3-2.9-.6-4.7-.6-5.3Z" />
          {/* dot */}
          <ellipse cx="10.6" cy="19.4" rx="2" ry="2.2" />
        </g>
      </svg>
    </span>
  );
}
