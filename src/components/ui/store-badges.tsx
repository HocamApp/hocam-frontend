import * as React from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * App Store and Google Play badges.
 *
 * **These are stand-ins, and they have to be replaced before launch.** Both
 * vendors require their own artwork: Apple ships the badge as a fixed asset
 * (the grey hairline around the black version is part of that artwork, not a
 * border we chose), and Google's brand guidelines say not to alter the colour,
 * proportions or spacing of theirs. Redrawing them is a licensing problem the
 * day the app is real.
 *
 * They are drawn here anyway because the app is *not* real yet, so shipping
 * the genuine "Download on the App Store" badge would be the worse of the two
 * — it promises a store listing that does not exist. Proportions (3.375:1),
 * the two-line lockup and Google's four brand colours follow the official
 * specs so the swap is visually a no-op.
 *
 * Without `href` a badge renders as an inert button: not a link, announced as
 * disabled, and labelled "Yakında". Give it an href and it becomes a real
 * anchor — which is the only change needed once the apps ship.
 */

type BadgeProps = {
  href?: string;
  className?: string;
};

/** Shared shell: black plate, hairline, and the store-badge aspect ratio. */
function BadgeShell({
  href,
  className,
  label,
  children,
}: BadgeProps & { label: string; children: React.ReactNode }) {
  const shell = cn(
    "inline-flex h-11 items-center gap-2.5 rounded-lg border border-[#a6a6a6] bg-black px-3 text-white",
    "transition-opacity",
    href ? "hover:opacity-85" : "cursor-not-allowed",
    className,
  );

  if (href) {
    return (
      <a href={href} className={shell} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }

  return (
    <button type="button" aria-disabled="true" aria-label={`${label} — Yakında`} className={shell}>
      {children}
    </button>
  );
}

/**
 * Two lines, tightly stacked: a small lead-in over the store name at roughly
 * twice its size. That ratio is what makes a badge read as a badge.
 */
function BadgeLockup({
  lead,
  name,
  leadClassName,
}: {
  lead: string;
  name: string;
  leadClassName?: string;
}) {
  return (
    <span className="flex flex-col items-start justify-center leading-none">
      <span className={cn("text-[9px] font-normal", leadClassName)}>{lead}</span>
      <span className="mt-[3px] text-[17px] font-semibold leading-none tracking-tight">{name}</span>
    </span>
  );
}

export function AppStoreBadge({ href, className }: BadgeProps) {
  return (
    <BadgeShell href={href} className={className} label="App Store">
      <AppleMark className="size-6 shrink-0" />
      <BadgeLockup lead="Download on the" name="App Store" leadClassName="tracking-tight" />
    </BadgeShell>
  );
}

export function GooglePlayBadge({ href, className }: BadgeProps) {
  return (
    <BadgeShell href={href} className={className} label="Google Play">
      <GooglePlayMark className="size-[22px] shrink-0" />
      {/* Google letterspaces its lead-in and Apple does not — one of the few
          details that separates a real badge from a lookalike. */}
      <BadgeLockup lead="GET IT ON" name="Google Play" leadClassName="tracking-[0.09em]" />
    </BadgeShell>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M18.546 12.763c.024-1.87 1.004-3.597 2.597-4.576-1.009-1.442-2.64-2.323-4.399-2.378-1.851-.194-3.645 1.107-4.588 1.107-.961 0-2.413-1.088-3.977-1.056-2.057.033-3.929 1.174-4.93 2.973-2.131 3.69-.542 9.114 1.5 12.097 1.022 1.461 2.215 3.092 3.778 3.035 1.529-.063 2.1-.975 3.945-.975 1.828 0 2.364.975 3.958.938 1.64-.027 2.674-1.467 3.66-2.942.734-1.041 1.299-2.191 1.673-3.408-1.948-.824-3.215-2.733-3.217-4.849z" />
      <path d="M15.535 3.847C16.429 2.773 16.87 1.393 16.763 0c-1.366.144-2.629.797-3.535 1.829-.895 1.019-1.349 2.351-1.261 3.705 1.385.014 2.7-.608 3.568-1.687z" />
    </svg>
  );
}

/**
 * The Play mark is one folded shape split into four faces: the spine on the
 * left, the two wings, and the tip. Each face carries its own gradient, which
 * is why gradient ids have to be unique per instance — two badges on a page
 * would otherwise share the first one's defs.
 */
function GooglePlayMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <defs>
        <linearGradient id={`${id}-spine`} x1="15.7" y1="2.4" x2="1.6" y2="16.5">
          <stop offset="0" stopColor="#00A0FF" />
          <stop offset=".26" stopColor="#00A1FF" />
          <stop offset=".66" stopColor="#00BEFF" />
          <stop offset=".86" stopColor="#00C9FF" />
          <stop offset="1" stopColor="#00CFFF" />
        </linearGradient>
        <linearGradient id={`${id}-tip`} x1="22.4" y1="12" x2="2.6" y2="12">
          <stop offset="0" stopColor="#FFE000" />
          <stop offset=".41" stopColor="#FFBD00" />
          <stop offset=".78" stopColor="#FFA500" />
          <stop offset="1" stopColor="#FF9C00" />
        </linearGradient>
        <linearGradient id={`${id}-lower`} x1="18.3" y1="13.9" x2="-0.9" y2="33.1">
          <stop offset="0" stopColor="#FF3A44" />
          <stop offset="1" stopColor="#C31162" />
        </linearGradient>
        <linearGradient id={`${id}-upper`} x1="0.9" y1="-4.8" x2="9.5" y2="3.8">
          <stop offset="0" stopColor="#32A071" />
          <stop offset=".07" stopColor="#2DA771" />
          <stop offset=".48" stopColor="#15CF74" />
          <stop offset=".8" stopColor="#06E775" />
          <stop offset="1" stopColor="#00F076" />
        </linearGradient>
      </defs>
      <path
        d="M3.9 1.9c-.3.3-.5.8-.5 1.4v17.4c0 .6.2 1.1.5 1.4l.1.1 9.7-9.7v-.2L3.9 1.9z"
        fill={`url(#${id}-spine)`}
      />
      <path
        d="M17.1 15.5l-3.2-3.2v-.2l3.2-3.2.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.9 2.1z"
        fill={`url(#${id}-tip)`}
      />
      <path
        d="M17.2 15.4L13.9 12.1 3.9 22.1c.4.4 1 .4 1.7.1l11.6-6.8"
        fill={`url(#${id}-lower)`}
      />
      <path
        d="M17.2 8.6L5.6 2c-.7-.4-1.3-.3-1.7.1l10 10 3.3-3.5z"
        fill={`url(#${id}-upper)`}
      />
    </svg>
  );
}
