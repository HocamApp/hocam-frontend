"use client";

import { useRef, useState } from "react";
import { LifeBuoy, MessageSquareText } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { SupportFAQ } from "@/components/support/SupportFAQ";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { HELP_SECTIONS } from "@/components/support/supportContent";

function SupportContent() {
  const formRef = useRef<HTMLDivElement>(null);
  const [feedbackPreset, setFeedbackPreset] = useState(0);

  const startWebsiteFeedback = () => {
    setFeedbackPreset((value) => value + 1);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LifeBuoy className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Destek
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Hocam destek merkezine hoş geldiniz. Aşağıdan bir destek talebi
            oluşturabilir, taleplerinizin durumunu takip edebilir ve platform
            kurallarını inceleyebilirsiniz. Talepleriniz destek ekibi tarafından
            incelenir ve en kısa sürede yanıtlanır.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Ticket form + list */}
        <div className="space-y-6 lg:col-span-3">
          <Card id="support-request-form" ref={formRef} className="scroll-mt-24">
            <CardHeader>
              <CardTitle className="text-lg">Destek talebi oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <SupportTicketForm
                preset={
                  feedbackPreset
                    ? {
                        category: "technical",
                        subject: "Web sitesi geri bildirimi",
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              Destek taleplerim
            </h2>
            <SupportTicketList />
          </section>
        </div>

        {/* Help / rulebook */}
        <aside className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">
            Yardım & kurallar
          </h2>
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquareText className="h-4 w-4" />
                </span>
                <h3 className="font-medium text-foreground">
                  Web sitesi geri bildirimi
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Tasarım, metin, akış veya teknik sorunlarla ilgili geri bildirimleri
                destek talebi olarak iletebilirsiniz.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startWebsiteFeedback}
              >
                Geri bildirim yaz
              </Button>
            </CardContent>
          </Card>
          {HELP_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-medium text-foreground">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {section.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-muted-foreground"
                      >
                        <span
                          className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/50"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </aside>
      </div>

      <SupportFAQ />
      </div>
      <AISupportChatWidget />
    </>
  );
}

export default function SupportPage() {
  return (
    <RouteGuard requireAuth>
      <SupportContent />
    </RouteGuard>
  );
}
