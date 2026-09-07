import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle,
  Circle,
  Info,
} from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";
import { cn } from "@/lib/utils";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

export function CoachingStatusCard({ status }: { status: CoachingDerivedStatus }) {
  const ready = status.readiness === "complete";
  const published = status.publication === "published";
  const action = status.nextAction ?? {
    label: "Öğrenci görünümünü aç",
    href: "/dashboard/tutor/coaching/preview",
  };

  return (
    <div className="space-y-3">
      {/*
        A white surface, not a second dark slab. The page already spends its
        ink on the header band, and DESIGN.md gives ink a job there: sections
        separate by colour, so repeating the darkest value one section later
        spends the contrast twice and leaves the page reading black-and-white.
        Here the state is carried by the gold lockup and the pink action, which
        is what those two colours are for.
      */}
      <CoachingStudioPanel
        role="region"
        aria-label="Koçluk hizmet durumu"
        className="overflow-hidden p-6 sm:p-8"
      >
        <div className="max-w-3xl">
          <div>
            {/* No eyebrow above this. The tab strip already says which part
                of coaching you are in, and a small capitalised label repeating
                the section name is the third thing on the page saying it. The
                lockup below is the state, and the heading is the sentence.

                Gold is a surface with --gold-ink on it, never a text colour,
                and its subject is achievement: a published, running coaching
                offer is exactly that. Until it is running there is nothing to
                celebrate, so the same slot goes to an outline with no fill. */}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-pill px-4 py-1.5 text-[0.8125rem] font-medium leading-[1.4] tracking-[0.01em]",
                ready
                  ? "bg-gold text-white"
                  : "border border-line text-ink-mid",
              )}
            >
              {/* Outline for a step still open, filled once it is done. The
                  weight change carries the state on its own. */}
              {ready ? (
                <CheckCircle aria-hidden="true" className="h-4 w-4" weight="fill" />
              ) : (
                <Circle aria-hidden="true" className="h-4 w-4" weight="regular" />
              )}
              {ready ? "Koçluğun yayında" : "Kurulum sürüyor"}
            </span>

            <h2 className="mt-3 text-h2-m sm:text-h2">
              {ready ? "Koçluk düzenin hazır" : "Sıradaki adımı tamamla"}
            </h2>
            <p className="mt-3 max-w-xl text-[1rem] leading-[1.6] text-ink-mid">
              {published
                ? "Teklifin öğrenci görünümünde yerini aldı. Koçluk düzenini buradan sürdürebilirsin."
                : "Koçluk teklifinin öğrenciye açılması için yalnız sana bağlı olan sıradaki kurulumu tamamla."}
            </p>
            {/* The page's one primary action, and the one place pink is
                load-bearing rather than decorative.

                deriveCoachingStatus returns no nextAction once the setup is
                complete, which left this region with no way forward at all on
                the one state a working tutor sees every day. The healthy state
                keeps the slot and points at the student view, which is the
                thing a tutor with a running offer actually wants to check. */}
            <Button asChild className="mt-6">
              <Link href={action.href}>
                {action.label}
                <ArrowUpRight aria-hidden="true" className="ml-2 h-5 w-5" weight="regular" />
              </Link>
            </Button>
          </div>

        </div>
      </CoachingStudioPanel>

      {status.platformMessage ? (
        <section
          role="region"
          aria-label="Platform durumu"
          className="flex gap-3 rounded-card border border-line bg-surface p-4 text-small text-ink"
        >
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" weight="regular" />
          <div>
            <p className="font-medium">Platform bilgisi</p>
            <p className="mt-0.5 text-ink-mid">{status.platformMessage}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
