import Link from "next/link";
import { type Icon as PhosphorIcon } from "@phosphor-icons/react";
import {
  ArrowUpRight,
  CheckCircle,
  Circle,
  Info,
  Radio,
  UsersThree,
} from "@phosphor-icons/react/ssr";

import { Button } from "@/components/ui/button";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";
import { cn } from "@/lib/utils";
import { CoachingStudioPanel } from "./CoachingStudioPanel";

const STATUS_LABELS = {
  publication: {
    missing: "Teklif oluşturulmadı",
    draft: "Taslak",
    published: "Yayında",
  },
  intake: {
    not_applicable: "Henüz geçerli değil",
    open: "Yeni öğrenciye açık",
    closed: "Yeni öğrenciye kapalı",
  },
  capacity: {
    unknown: "Kapasite bilinmiyor",
    missing_availability: "Koçluk saati gerekli",
    available: "Yeni öğrenci için yer var",
    full: "Kapasite dolu",
  },
} as const;

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
        {/* 7/5, the default split for a content section. */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
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
                  ? "bg-gold text-gold-ink"
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
                ? "Teklifin öğrenci görünümünde yerini aldı. Öğrenci kabulü ve kapasiteyi buradan takip edebilirsin."
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

          {/* 10px inside the panel's 20px corner: inner radius is the outer
              radius minus the inset, so nested corners stay concentric. */}
          <dl className="grid gap-px overflow-hidden rounded-input border border-line bg-line sm:grid-cols-3 lg:grid-cols-1">
            <StatusRow icon={Radio} label="Yayın" value={STATUS_LABELS.publication[status.publication]} />
            <StatusRow icon={UsersThree} label="Öğrenci kabulü" value={STATUS_LABELS.intake[status.intake]} />
            <StatusRow icon={CheckCircle} label="Kapasite" value={STATUS_LABELS.capacity[status.capacity]} />
          </dl>
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

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: PhosphorIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface p-4">
      <dt className="flex items-center gap-2 text-[0.8125rem] font-medium leading-[1.4] tracking-[0.01em] text-ink-mid">
        <Icon aria-hidden="true" className="h-4 w-4" weight="regular" />
        {label}
      </dt>
      <dd className="text-right text-small font-medium">{value}</dd>
    </div>
  );
}
