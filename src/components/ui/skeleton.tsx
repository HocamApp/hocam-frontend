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
        /* An opacity pulse, not a shimmer sweep. A moving gradient is banned
           twice over: once as motion that decorates rather than communicates
           system state, once as a gradient. The pulse still says the system is
           working, which is the only thing a skeleton owes anyone.

           The fill is #EDE6E6, one step darker than --line. Not grey — grey
           reads cold against warm paper and gives the loading state a
           different temperature from the page it is loading into. */
        "animate-skeleton-pulse rounded-input bg-[#EDE6E6] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
