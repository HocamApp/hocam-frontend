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

  return (
    <div className="space-y-3">
      {/* The oversized decorative ring that used to sit behind this panel is
          gone: a soft radial shape carrying no meaning is exactly the kind of
          ornament DESIGN.md rules out. The panel separates by value and a
          hairline, which is all it needs to. */}
      <CoachingStudioPanel
        tone={ready ? "dark" : "accent"}
        role="region"
        aria-label="Koçluk hizmet durumu"
        className="overflow-hidden p-6 sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-end">
          <div>
            <p
              /* The Label step spelled out rather than `text-label`:
                 tailwind-merge cannot tell a custom `text-*` size from a custom
                 `text-*` colour, so inside a cn() that also sets a colour the
                 size class is dropped. An arbitrary length is unambiguous. */
              className={cn(
                "text-[0.8125rem] font-medium uppercase leading-[1.4] tracking-[0.18em]",
                ready ? "text-paper-mid" : "text-pink"
              )}
            >
              Teklif durumu
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border",
                  ready ? "border-paper-mid bg-transparent" : "border-line bg-paper"
                )}
              >
                {/* Outline for a step still open, filled once it is done. The
                    weight change is the state; no colour chip is needed. */}
                {ready ? (
                  <CheckCircle aria-hidden="true" className="h-6 w-6" weight="fill" />
                ) : (
                  <Circle aria-hidden="true" className="h-6 w-6" weight="regular" />
                )}
              </span>
              <h2 className="text-h2-m sm:text-h2">
                {ready ? "Koçluk düzenin hazır" : "Sıradaki adımı tamamla"}
              </h2>
            </div>
            <p
              className={cn(
                "mt-3 max-w-xl text-[1rem] leading-[1.6]",
                ready ? "text-paper-mid" : "text-ink-mid"
              )}
            >
              {published
                ? "Teklifin öğrenci görünümünde yerini aldı. Öğrenci kabulü ve kapasiteyi buradan takip edebilirsin."
                : "Koçluk teklifinin öğrenciye açılması için yalnız sana bağlı olan sıradaki kurulumu tamamla."}
            </p>
            {status.nextAction ? (
              <Button asChild variant={ready ? "secondary" : "default"} className="mt-6">
                <Link href={status.nextAction.href}>
                  {status.nextAction.label}
                  <ArrowUpRight aria-hidden="true" className="ml-2 h-5 w-5" weight="regular" />
                </Link>
              </Button>
            ) : null}
          </div>

          {/* 10px inside the panel's 20px corner: inner radius is the outer
              radius minus the inset, so nested corners stay concentric. */}
          <dl
            className={cn(
              "grid gap-px overflow-hidden rounded-input border sm:grid-cols-3 lg:grid-cols-1",
              ready ? "border-paper-mid bg-paper-mid" : "border-line bg-line"
            )}
          >
            <StatusRow icon={Radio} label="Yayın" value={STATUS_LABELS.publication[status.publication]} ready={ready} />
            <StatusRow icon={UsersThree} label="Öğrenci kabulü" value={STATUS_LABELS.intake[status.intake]} ready={ready} />
            <StatusRow icon={CheckCircle} label="Kapasite" value={STATUS_LABELS.capacity[status.capacity]} ready={ready} />
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
  ready,
}: {
  icon: PhosphorIcon;
  label: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 p-4", ready ? "bg-ink" : "bg-surface")}>
      <dt
        className={cn(
          "flex items-center gap-2 text-[0.8125rem] font-medium leading-[1.4] tracking-[0.01em]",
          ready ? "text-paper-mid" : "text-ink-mid"
        )}
      >
        <Icon aria-hidden="true" className="h-4 w-4" weight="regular" />
        {label}
      </dt>
      <dd className="text-right text-small font-medium">{value}</dd>
    </div>
  );
}
