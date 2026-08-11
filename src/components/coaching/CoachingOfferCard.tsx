import type { ReactNode } from "react";
import { Check, Clock3, Sparkles } from "lucide-react";

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
    <Card className="overflow-hidden border-foreground/15 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b bg-muted/25 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background">
                  <Sparkles aria-hidden className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold tracking-tight">
                  {offer.isFree ? "Ücretsiz çalışma koçluğu" : "Çalışma koçluğu"}
                </h2>
                {!offer.capacityAvailable ? <Badge variant="secondary">Kontenjan dolu</Badge> : null}
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 aria-hidden className="h-4 w-4" />
                {offer.frequencyLabel} · {offer.sessionDurationMinutes} dakika
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-xl font-semibold tabular-nums">
                {offer.isFree ? "Ders paketinle ücretsiz" : offer.priceDisplay}
              </p>
              {!offer.isFree ? <p className="text-xs text-muted-foreground">görüşme başına</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {offer.description ? <p className="text-sm leading-6 text-muted-foreground">{offer.description}</p> : null}

          {offer.examTypes.length ? (
            <div className="flex flex-wrap gap-2">
              {offer.examTypes.map((exam) => <Badge key={exam} variant="outline">{exam}</Badge>)}
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Koçluğa dahil</p>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {statusMessage ? <p className="rounded-lg border bg-muted/25 p-3 text-sm text-muted-foreground">{statusMessage}</p> : null}
          {action ? <div>{action}</div> : null}

          <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
            Koçluk yalnız ders paketiyle birlikte alınır. Talebin öğretmene ders paketi ve koçluk hizmeti birlikte iletilir; kabul edilmeden başlamaz.
          </p>

          {showHowItWorks ? (
            <Accordion type="single" collapsible>
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
      </CardContent>
    </Card>
  );
}
