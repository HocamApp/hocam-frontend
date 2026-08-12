import type { ReactNode } from "react";
import { Check, Clock3, Sparkles, Target } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { COACHING_HOW_IT_WORKS } from "@/lib/coachingApi";

const INCLUDED = [
  "Çalışma programı",
  "Deneme değerlendirmesi",
  "İlerleme raporu",
  "Kaynak önerileri",
  "Mesajlara 24 saat içinde yanıt",
];

export type CoachingOfferView = {
  frequencyLabel: string;
  sessionDurationMinutes: number;
  priceDisplay: string;
  isFree: boolean;
  examTypes: string[];
  description: string;
  capacityAvailable: boolean;
};

export function CoachingOfferCard({
  offer,
  action,
  statusMessage,
  showHowItWorks = false,
}: {
  offer: CoachingOfferView;
  action?: ReactNode;
  statusMessage?: string | null;
  showHowItWorks?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.6rem] border-foreground/15 shadow-[0_22px_58px_-42px_hsl(var(--foreground)/0.5)]">
      <CardContent className="p-0">
        <div className="grid border-b bg-primary/[0.045] lg:grid-cols-[minmax(0,1.28fr)_minmax(18rem,0.72fr)]">
          <div className="p-5 sm:p-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-background text-primary">
                  <Sparkles aria-hidden className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{offer.isFree ? "Ücretsiz çalışma koçluğu" : "Çalışma koçluğu"}</p>
                {!offer.capacityAvailable ? <Badge variant="secondary">Kontenjan dolu</Badge> : null}
              </div>
              <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Planlı çalış, ilerlemeni görünür kıl</h2>
              {offer.description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{offer.description}</p> : null}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 aria-hidden className="h-4 w-4" />
                {offer.frequencyLabel} · {offer.sessionDurationMinutes} dakika
              </p>
            </div>
          </div>
          <div role="region" aria-label="Koçluk ücret özeti" className="flex flex-col justify-between border-t border-primary/10 bg-background/75 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ders paketine ek hizmet</p>
              <p className="mt-3 text-2xl font-semibold tabular-nums sm:text-3xl">
                {offer.isFree ? "Ders paketinle ücretsiz" : offer.priceDisplay}
              </p>
              {!offer.isFree ? <p className="text-xs text-muted-foreground">görüşme başına</p> : null}
            </div>
            {action ? <div className="mt-5 [&>*]:w-full">{action}</div> : null}
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="space-y-5">
            {offer.examTypes.length ? (
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground"><Target className="h-4 w-4" aria-hidden="true" />Sınav odağı</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {offer.examTypes.map((exam) => <Badge key={exam} variant="outline" className="rounded-lg px-3 py-1">{exam}</Badge>)}
                </div>
              </div>
            ) : null}
            {statusMessage ? <p className="rounded-xl border bg-muted/25 p-3 text-sm text-muted-foreground">{statusMessage}</p> : null}
            <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
              Koçluk yalnız ders paketiyle birlikte alınır. Talebin öğretmene ders paketi ve koçluk hizmeti birlikte iletilir; kabul edilmeden başlamaz.
            </p>
          </div>

          <div className="rounded-[1.25rem] bg-muted/35 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Koçluğa dahil</p>
            <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-background text-emerald-700">
                    <Check aria-hidden className="h-3 w-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {showHowItWorks ? (
              <Accordion type="single" collapsible className="mt-4 border-t">
                <AccordionItem value="how" className="border-b-0">
                  <AccordionTrigger className="text-sm">Koçluk nasıl çalışır?</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {COACHING_HOW_IT_WORKS.map((item) => (
                        <li key={item} className="flex items-start gap-2"><span aria-hidden>·</span><span>{item}</span></li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
