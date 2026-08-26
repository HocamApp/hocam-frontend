"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap, X } from "@phosphor-icons/react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getLocalStorage } from "@/lib/safeStorage";
import { markEntryPromoSeen, shouldShowEntryPromo } from "@/lib/homeEntryPromo";

import { MAX_PACKAGE_DISCOUNT_PERCENT, TRIAL_MINUTES } from "./ysHomeFacts";

/**
 * The first-visit promo.
 *
 * Three things about it are load-bearing:
 *
 * **It reads no themed token.** Radix portals to `<body>`, outside `.ys-root`,
 * so the content inherits the `.dark` class the theme script may have set and
 * `--ys-*` does not resolve at all. Everything here is painted with literal
 * neutrals and the `--brand-*` ramp, which lives in `:root` and is not
 * overridden by `.dark`. A shadcn `Button` inside would silently drag
 * `--primary` back in, so the CTA is styled by hand.
 *
 * **The consent card out-ranks it.** `DiscoveryConsentBanner` sits at
 * `z-[120]`, above this dialog's 110, and shows for anonymous visitors. It is
 * a corner card rather than a modal, so the two do not fight for the middle —
 * but a legal choice stays clickable over a marketing one.
 *
 * **It reports when it is done.** The navbar coachmark fires at 900ms and would
 * otherwise live and die underneath this overlay; `onResolved` starts its
 * timer only once this dialog is out of the way — including the case where it
 * decides not to open at all.
 */

/** Long enough for the page to paint first, short enough to still read as a greeting. */
const OPEN_DELAY_MS = 700;

/**
 * Fired once this dialog has decided whether to open, so the navbar's coachmark
 * knows when the overlay is out of its way.
 *
 * A window event rather than a callback because the two now live in different
 * trees: the dialog is rendered by the page, the navbar by the layout above it,
 * and there is no prop path between them. `src/lib/api.ts` decouples the
 * session-expiry dialog the same way.
 */
export const YS_ENTRY_PROMO_RESOLVED_EVENT = "hocam:ys-entry-promo-resolved";

export function YsEntryDialog() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const resolvedRef = useRef(false);

  const resolve = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    window.dispatchEvent(new CustomEvent(YS_ENTRY_PROMO_RESOLVED_EVENT));
  }, []);

  useEffect(() => {
    // Signed-in visitors are not the audience — "Ücretsiz kaydol" is nonsense
    // for them. There is no cookie to wait on, so this settles immediately.
    if (isAuthenticated || !shouldShowEntryPromo(getLocalStorage())) {
      resolve();
      return;
    }

    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAuthenticated, resolve]);

  const dismiss = useCallback(() => {
    markEntryPromoSeen(getLocalStorage());
    resolve();
  }, [resolve]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      // Escape, the scrim, the X and the secondary button all land here.
      if (!next) dismiss();
    },
    [dismiss],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ys-entry-promo
        showClose={false}
        overlayClassName="z-[110]"
        className="z-[110] w-[calc(100dvw-1rem)] max-w-[calc(100dvw-1rem)] gap-0 overflow-hidden rounded-modal border-line bg-surface p-0 text-ink sm:max-w-[420px]"
      >
        {/* One idea, one number, one button. The earlier draft explained the
            whole trial policy here; nobody reads a paragraph in a promo, and
            the detail already lives in the FAQ further down the page. */}
        <div className="relative overflow-hidden bg-pink px-7 pb-8 pt-7 text-center text-white">
          <GraduationCap
            className="pointer-events-none absolute -left-4 -top-4 size-28 rotate-[-12deg] text-white/10"
            aria-hidden
          />
          <p className="relative text-xs font-bold tracking-[0.22em] text-white/70">
            HOCAM
          </p>

          <DialogTitle className="relative mt-4 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-white">
            İlk ders
            <br />
            ücretsiz
          </DialogTitle>

          <p className="relative mt-5 inline-flex items-baseline gap-2 rounded-pill bg-white px-5 py-2 text-pink">
            <span className="text-3xl font-extrabold leading-none">
              {TRIAL_MINUTES}
            </span>
            <span className="text-sm font-bold">dakika</span>
          </p>

          <DialogClose
            aria-label="Kapat"
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-white/80 outline-none transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <div className="bg-surface px-7 pb-6 pt-5 text-center">
          <DialogDescription className="text-sm leading-6 text-ink-mid">
            Seçtiğin hocayla tanış, ücret ödeme. Devam edersen paketlerde %
            {MAX_PACKAGE_DISCOUNT_PERCENT}&apos;a varan avantaj.
          </DialogDescription>

          <Link
            href="/register"
            onClick={dismiss}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-pill bg-pink text-base font-bold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep"
          >
            Hemen başla
          </Link>

          <DialogClose className="mt-3 text-sm text-ink-mid transition-colors duration-[--duration-state] hover:text-ink">
            Şimdi değil
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
