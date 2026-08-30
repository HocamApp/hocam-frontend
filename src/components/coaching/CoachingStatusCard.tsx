import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle,
  Circle,
  Info,
  type Icon as PhosphorIcon,
  Radio,
  UsersThree,
} from "@phosphor-icons/react";

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
      <CoachingStudioPanel
        tone={ready ? "dark" : "accent"}
        role="region"
        aria-label="Koçluk hizmet durumu"
        className="relative isolate overflow-hidden p-6 sm:p-8"
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute -right-14 -top-16 -z-10 h-52 w-52 rounded-full border-[32px] opacity-40",
            ready ? "border-background/10" : "border-primary/10"
          )}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)] lg:items-end">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-[0.18em]", ready ? "text-background/60" : "text-primary")}>
              Teklif durumu
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full border", ready ? "border-background/15 bg-background/10" : "border-primary/15 bg-background")}>
                {ready ? <CheckCircle aria-hidden="true" className="h-5 w-5" weight="fill" /> : <Circle aria-hidden="true" className="h-5 w-5" />}
              </span>
              <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {ready ? "Koçluk düzenin hazır" : "Sıradaki adımı tamamla"}
              </h2>
            </div>
            <p className={cn("mt-3 max-w-xl text-sm leading-6", ready ? "text-background/65" : "text-muted-foreground")}>
              {published
                ? "Teklifin öğrenci görünümünde yerini aldı. Öğrenci kabulü ve kapasiteyi buradan takip edebilirsin."
                : "Koçluk teklifinin öğrenciye açılması için yalnız sana bağlı olan sıradaki kurulumu tamamla."}
            </p>
            {status.nextAction ? (
              <Button asChild variant={ready ? "secondary" : "default"} className="mt-6">
                <Link href={status.nextAction.href}>
                  {status.nextAction.label}
                  <ArrowUpRight aria-hidden="true" className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          <dl className={cn("grid gap-px overflow-hidden rounded-2xl border sm:grid-cols-3 lg:grid-cols-1", ready ? "border-background/15 bg-background/10" : "border-border/70 bg-border/60")}>
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
          className="flex gap-3 rounded-card border border-line bg-surface p-4 text-sm leading-6 text-ink"
        >
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Platform bilgisi</p>
            <p className="mt-0.5">{status.platformMessage}</p>
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
      <dt className={cn("flex items-center gap-2 text-xs font-medium", ready ? "text-white/60" : "text-ink-mid")}>
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold">{value}</dd>
    </div>
  );
}
