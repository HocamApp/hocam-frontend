"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, GraduationCap, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getLocalStorage } from "@/lib/safeStorage";
import { markEntryPromoSeen, shouldShowEntryPromo } from "@/lib/homeEntryPromo";

import { MAX_PACKAGE_DISCOUNT_PERCENT, MONTHLY_TRIAL_LIMIT, TRIAL_MINUTES } from "./ysHomeFacts";

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
        <div className="relative overflow-hidden bg-brand-700 px-6 pb-6 pt-5 text-white">
          <GraduationCap
            className="pointer-events-none absolute -bottom-3 right-3 size-24 text-white/10"
            aria-hidden
          />
          <p className="text-xs font-bold tracking-[0.16em] text-white/75">HOCAM</p>
          <DialogTitle className="mt-3 text-[1.625rem] font-bold leading-tight text-white">
            İlk dersin ücretsiz
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-white/90">
            Seçtiğin hocayla {TRIAL_MINUTES} dakikalık deneme dersini ücret ödemeden yap. Ödeme
            ya da paket hakkı gerekmez.
          </DialogDescription>

          <DialogClose
            aria-label="Kapat"
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-white/80 outline-none transition-colors hover:bg-white/15 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <div className="bg-white px-6 py-5">
          <ul className="space-y-2.5">
            {[
              `Her hocayla bir kez, ayda en fazla ${MONTHLY_TRIAL_LIMIT} deneme dersi.`,
              `Devam edersen uzun paketlerde ders başına fiyat %${MAX_PACKAGE_DISCOUNT_PERCENT}'a kadar düşer.`,
              "Hocalar öğrenci kimliği, YKS belgesi ve .edu.tr e-postasıyla doğrulanır.",
            ].map((line) => (
              <li key={line} className="flex gap-2.5 text-sm leading-6 text-neutral-700">
                <Check className="mt-1 size-4 shrink-0 text-brand-700" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            onClick={dismiss}
            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-brand-700 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Ücretsiz kaydol
          </Link>

          <DialogClose className="mt-2 w-full rounded-lg py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
            Önce hocaları inceleyeyim
          </DialogClose>

          <p className="mt-4 text-center text-xs text-neutral-500">
            Hesabın var mı?{" "}
            <Link
              href="/login"
              onClick={dismiss}
              className="font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              Giriş yap
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
