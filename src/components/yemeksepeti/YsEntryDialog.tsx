"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "@phosphor-icons/react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getLocalStorage } from "@/lib/safeStorage";
import {
  HOME_ENTRY_PROMO_CONSENT_GRACE_MS,
  HOME_ENTRY_PROMO_DWELL_MS,
  HOME_ENTRY_PROMO_SCROLL_RATIO,
  markEntryPromoSeen,
  shouldShowEntryPromo,
} from "@/lib/homeEntryPromo";

import { MAX_PACKAGE_DISCOUNT_PERCENT, TRIAL_MINUTES } from "./ysHomeFacts";

/**
 * The first-visit promo.
 *
 * Four things about it are load-bearing:
 *
 * **It opens on engagement, not on arrival.** See the constants in
 * `homeEntryPromo.ts`: dwell, scroll depth or exit intent, whichever comes
 * first. The old 700ms timer put it in front of a page the visitor had not
 * seen yet, which leaves closing it as the only sensible response.
 *
 * **It defers to the consent card, but not forever.** `DiscoveryConsentBanner`
 * is a legal choice and this is a marketing one, so the promo waits for it.
 * The wait is capped: that card has no scrim, so a visitor can read the page
 * without ever answering it, and an unbounded wait would mean the promo never
 * appeared for them at all.
 *
 * **It reads no themed token.** Radix portals to `<body>`, outside `.ys-root`,
 * so the content inherits the `.dark` class the theme script may have set and
 * `--ys-*` does not resolve at all. Everything here is painted with the design
 * system's own tokens, which live in `:root`. A shadcn `Button` inside would
 * silently drag `--primary` back in, so the CTA is styled by hand.
 *
 * **It reports when it is done.** The navbar coachmark fires at 900ms and would
 * otherwise live and die underneath this overlay; `onResolved` starts its
 * timer only once this dialog is out of the way — including the case where it
 * decides not to open at all.
 */

/** The consent card, which out-ranks this one. */
const CONSENT_CARD_SELECTOR = '[aria-label="Gizlilik tercihi"]';

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

    let fired = false;
    let consentWatcher: MutationObserver | null = null;
    let consentGraceTimer: number | undefined;

    const cleanUp = () => {
      window.clearTimeout(dwellTimer);
      window.clearTimeout(consentGraceTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      consentWatcher?.disconnect();
      consentWatcher = null;
    };

    const show = () => {
      setOpen(true);
      cleanUp();
    };

    /* Held back while the privacy card is on screen, and released the moment
       it leaves. Watching the DOM rather than asking the consent API keeps
       this dialog free of a second network call it would only use to decide
       when to appear. */
    const fire = () => {
      if (fired) return;
      fired = true;
      window.clearTimeout(dwellTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);

      if (!document.querySelector(CONSENT_CARD_SELECTOR)) {
        show();
        return;
      }

      consentWatcher = new MutationObserver(() => {
        if (!document.querySelector(CONSENT_CARD_SELECTOR)) show();
      });
      consentWatcher.observe(document.body, { childList: true, subtree: true });
      consentGraceTimer = window.setTimeout(show, HOME_ENTRY_PROMO_CONSENT_GRACE_MS);
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= HOME_ENTRY_PROMO_SCROLL_RATIO) fire();
    };

    /* Exit intent. `relatedTarget` is null when the pointer leaves the window
       rather than moving to another element, and a negative clientY means it
       left through the top, where the tab bar and the address bar are. */
    const onMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget === null && event.clientY <= 0) fire();
    };

    const dwellTimer = window.setTimeout(fire, HOME_ENTRY_PROMO_DWELL_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    // Coarse pointers have no exit gesture; the mobile imitations fire on a
    // fast scroll up, which is just scrolling.
    if (window.matchMedia("(pointer: fine)").matches) {
      document.addEventListener("mouseout", onMouseOut);
    }

    return cleanUp;
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
        className="z-[110] w-[calc(100dvw-1.5rem)] max-w-[calc(100dvw-1.5rem)] gap-0 overflow-hidden rounded-modal border-line bg-surface p-0 text-ink sm:max-w-[400px]"
      >
        {/* The illustration is transparent line art. Its black strokes stay
            untouched in light mode and invert in dark mode so they retain
            enough contrast against the themed paper surface. */}
        <div className="relative bg-paper">
          <Image
            src="/images/home/entry-promo-illustration.png"
            alt=""
            width={1200}
            height={900}
            priority={false}
            className="h-auto w-full select-none dark:invert"
          />

          <DialogClose
            aria-label="Kapat"
            className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-pill bg-surface text-ink-mid outline-none transition-colors duration-[--duration-state] hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </DialogClose>
        </div>

        <div className="border-t border-line px-7 pb-7 pt-6">
          {/* Gold is the offer colour, and this is the offer. Solid fill with
              --gold-ink on top, which is the only way gold carries text. */}
          <p className="inline-flex items-center rounded-pill bg-gold px-3 py-1 text-label font-medium text-gold-ink">
            {TRIAL_MINUTES} dakika ücretsiz
          </p>

          <DialogTitle className="mt-4 text-h2-m font-bold tracking-[-0.015em] text-ink">
            İlk dersin bizden
          </DialogTitle>

          <DialogDescription className="mt-3 text-body leading-6 text-ink-mid">
            Seçtiğin hocayla tanış, dersi beğenmezsen ücret ödeme. Devam edersen
            paketlerde %{MAX_PACKAGE_DISCOUNT_PERCENT}&apos;a varan avantaj seni
            bekliyor.
          </DialogDescription>

          {/* One action. Declining is the X in the corner, plus Escape and the
              scrim, which Radix already wires — a second "no" button underneath
              the CTA only gave the offer a competitor. */}
          <Link
            href="/register"
            onClick={dismiss}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-pill bg-pink text-body font-semibold text-white transition-colors duration-[--duration-state] hover:bg-pink-deep"
          >
            Ücretsiz dersini ayarla
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
