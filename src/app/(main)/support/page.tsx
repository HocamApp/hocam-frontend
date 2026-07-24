"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy, MessageSquareText } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { SUPPORT_PAGE_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { SupportFAQ } from "@/components/support/SupportFAQ";
import { SupportTicketForm } from "@/components/support/SupportTicketForm";
import { SupportTicketList } from "@/components/support/SupportTicketList";
import { HELP_SECTIONS } from "@/components/support/supportContent";

function SupportContent() {
  const formRef = useRef<HTMLDivElement>(null);
  const [feedbackPreset, setFeedbackPreset] = useState(0);
  const [openHelpSection, setOpenHelpSection] = useState("");

  // The page renders behind RouteGuard's auth check, so the browser's
  // native #hash scroll fires before the target exists — redo it on mount
  // (checkout deep-links to #odeme-ve-iade for the refund policy).
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    if (HELP_SECTIONS.some((section) => section.anchorId === hash)) {
      setOpenHelpSection(hash);
    }
    requestAnimationFrame(() => {
      document
        .getElementById(hash)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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

          <SupportTicketList />
        </div>

        {/* Help / rulebook */}
        <aside className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">
            Yardım & kurallar
          </h2>
          <Accordion
            type="single"
            collapsible
            value={openHelpSection}
            onValueChange={setOpenHelpSection}
            className="space-y-3"
          >
            <AccordionItem
              value="website-feedback"
              className="overflow-hidden rounded-lg border bg-card"
            >
              <AccordionTrigger className="cursor-pointer p-4 hover:no-underline">
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageSquareText className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-foreground">
                    Web sitesi geri bildirimi
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 px-4">
                <p className="text-sm text-muted-foreground">
                  Tasarım, metin, akış veya teknik sorunlarla ilgili geri
                  bildirimleri destek talebi olarak iletebilirsiniz.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startWebsiteFeedback}
                >
                  Geri bildirim yaz
                </Button>
              </AccordionContent>
            </AccordionItem>

            {HELP_SECTIONS.map((section, sectionIndex) => {
              const Icon = section.icon;
              const sectionValue = section.anchorId ?? `help-section-${sectionIndex}`;
              return (
                <AccordionItem
                  key={section.title}
                  value={sectionValue}
                  id={section.anchorId}
                  className={`overflow-hidden rounded-lg border bg-card ${
                    section.anchorId ? "scroll-mt-24" : ""
                  }`}
                >
                  <AccordionTrigger className="cursor-pointer p-4 hover:no-underline">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-foreground">
                        {section.title}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
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
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </aside>
      </div>

      <SupportFAQ />
      </div>
      <AISupportChatWidget
        title={SUPPORT_PAGE_ASSISTANT.title}
        welcomeMessage={SUPPORT_PAGE_ASSISTANT.welcomeMessage}
        attentionMessages={SUPPORT_PAGE_ASSISTANT.attentionMessages}
        starterPrompts={SUPPORT_PAGE_ASSISTANT.starterPrompts}
      />
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
