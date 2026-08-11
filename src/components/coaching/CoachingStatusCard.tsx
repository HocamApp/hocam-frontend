import Link from "next/link";
import { CircleCheck, CircleDashed, Info, Radio, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CoachingDerivedStatus } from "@/lib/coachingPresentation";

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
    available: "Yer var",
    full: "Kapasite dolu",
  },
  platformCheckout: {
    enabled: "Platform satışa açık",
    platform_paused: "Platform satışı kapalı",
  },
} as const;

export function CoachingStatusCard({ status }: { status: CoachingDerivedStatus }) {
  const ready = status.readiness === "complete";
  return (
    <Card className="overflow-hidden border-foreground/15 shadow-sm">
      <CardHeader className="border-b bg-muted/25 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Teklif durumu
            </p>
            <CardTitle className="text-xl">
              {ready ? "Koçluk düzenin hazır" : "Sıradaki adımı tamamla"}
            </CardTitle>
          </div>
          <Badge variant={ready ? "secondary" : "outline"} className="w-fit gap-1.5">
            {ready ? <CircleCheck className="h-3.5 w-3.5" /> : <CircleDashed className="h-3.5 w-3.5" />}
            {ready ? "Hazır" : "Kurulum sürüyor"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusItem icon={Radio} label="Yayın" value={STATUS_LABELS.publication[status.publication]} />
          <StatusItem icon={UsersRound} label="Öğrenci kabulü" value={STATUS_LABELS.intake[status.intake]} />
          <StatusItem icon={CircleCheck} label="Kapasite" value={STATUS_LABELS.capacity[status.capacity]} />
          <StatusItem icon={Info} label="Platform" value={STATUS_LABELS.platformCheckout[status.platformCheckout]} />
        </dl>
        {status.platformMessage ? (
          <div className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
            <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{status.platformMessage}</p>
          </div>
        ) : null}
        {status.nextAction ? (
          <Button asChild>
            <Link href={status.nextAction.href}>{status.nextAction.label}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Info;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}
