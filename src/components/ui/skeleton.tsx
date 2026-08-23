import { cn } from "@/lib/utils";

/**
 * Placeholder block for content that has not arrived yet.
 *
 * A highlight band sweeps left-to-right on a 1.5s cycle rather than the
 * previous opacity pulse: the sweep reads as "working", where a pulse reads
 * as "idle". Only `transform` animates, so long lists of these cost nothing
 * in layout.
 *
 * Two things callers get for free:
 *
 * - `aria-hidden`, because the shapes carry no information. Announce loading
 *   on the surrounding container (`aria-busy`) instead of narrating every bar.
 *   It is spread-overridable if a call site really needs otherwise.
 * - `motion-reduce`, which stops the sweep for anyone who has asked the OS to
 *   limit motion. The placeholder stays, only the movement goes.
 *
 * Pair with `useDelayedVisible` so a fast response never flashes a skeleton.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-gradient-to-r after:from-transparent after:via-foreground/[0.07] after:to-transparent",
        "after:animate-skeleton-shimmer motion-reduce:after:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
