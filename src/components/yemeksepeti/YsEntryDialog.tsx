"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
 * **It out-ranks the consent banner.** `DiscoveryConsentBanner` sits at
 * `z-[100]` and does show for anonymous visitors, so without a raised overlay
 * it would glow over the scrim.
 *
 * **It reports when it is done.** The navbar coachmark fires at 900ms and would
 * otherwise live and die underneath this overlay; `onResolved` starts its
 * timer only once this dialog is out of the way — including the case where it
 * decides not to open at all.
 */

/** Long enough for the page to paint first, short enough to still read as a greeting. */
const OPEN_DELAY_MS = 700;

export function YsEntryDialog({ onResolved }: { onResolved: () => void }) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const resolvedRef = useRef(false);

  const resolve = useCallback(() => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onResolved();
  }, [onResolved]);

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
        className="z-[110] w-[calc(100dvw-1rem)] max-w-[calc(100dvw-1rem)] gap-0 overflow-hidden rounded-2xl border-neutral-200 bg-white p-0 text-neutral-900 sm:max-w-[420px]"
      >
        {/* One idea, one number, one button. The earlier draft explained the
            whole trial policy here; nobody reads a paragraph in a promo, and
            the detail already lives in the FAQ further down the page. */}
        <div className="relative overflow-hidden bg-brand-700 px-7 pb-8 pt-7 text-center text-white">
          <GraduationCap
            className="pointer-events-none absolute -left-4 -top-4 size-28 rotate-[-12deg] text-white/10"
            aria-hidden
          />
          <p className="relative text-xs font-bold tracking-[0.22em] text-white/70">HOCAM</p>

          <DialogTitle className="relative mt-4 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-white">
            İlk ders
            <br />
            ücretsiz
          </DialogTitle>

          <p className="relative mt-5 inline-flex items-baseline gap-2 rounded-full bg-white px-5 py-2 text-brand-700">
            <span className="text-3xl font-extrabold leading-none">{TRIAL_MINUTES}</span>
            <span className="text-sm font-bold">dakika</span>
          </p>

          <DialogClose
            aria-label="Kapat"
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-white/80 outline-none transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <div className="bg-white px-7 pb-6 pt-5 text-center">
          <DialogDescription className="text-sm leading-6 text-neutral-600">
            Seçtiğin hocayla tanış, ücret ödeme. Devam edersen paketlerde %
            {MAX_PACKAGE_DISCOUNT_PERCENT}&apos;a varan avantaj.
          </DialogDescription>

          <Link
            href="/register"
            onClick={dismiss}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-brand-700 text-base font-bold text-white transition-colors hover:bg-brand-800"
          >
            Hemen başla
          </Link>

          <DialogClose className="mt-3 text-sm text-neutral-500 transition-colors hover:text-neutral-800">
            Şimdi değil
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
