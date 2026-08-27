"use client";

import { useEffect, useRef, useState } from "react";
import { LifeBuoy } from "lucide-react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AISupportChatWidget } from "@/components/ai/AISupportChatWidget";
import { SUPPORT_PAGE_ASSISTANT } from "@/components/ai/pageAssistantContent";
import { SupportFAQ } from "@/components/support/SupportFAQ";
import { SupportAccordionSection } from "@/components/support/SupportAccordionSection";
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
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Header */}
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-input)] bg-gold text-gold-ink">
            <LifeBuoy className="h-6 w-6" />
          </span>
          <div>
            <p className="text-label uppercase tracking-[0.14em] text-ink-mid">Destek merkezi</p>
            <h1 className="mt-1 text-h1-m text-ink sm:text-h1">
              Sorununu anlat, birlikte çözelim
            </h1>
            <p className="mt-3 max-w-2xl text-body text-ink-mid">
              Destek talebi oluştur, önceki taleplerini takip et veya platform
              kurallarında aradığın cevabı bul.
            </p>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
          {/* Ticket form + list */}
          <div className="min-w-0 space-y-6">
            <Card id="support-request-form" ref={formRef} className="scroll-mt-24 rounded-[var(--radius-card)] border-[var(--line)] bg-[var(--surface)]">
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

          <aside className="min-w-0 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <SupportAccordionSection
              layout="stacked"
              className="border-t-0 py-0"
              heading={
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Yardım ve kurallar
                </h2>
              }
              value={openHelpSection}
              onValueChange={setOpenHelpSection}
              items={[
                {
                  id: "help-website-feedback",
                  title: "Web sitesi geri bildirimi",
                  content: (
                    <div className="space-y-3">
                      <p className="text-base leading-7">
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
                    </div>
                  ),
                },
                ...HELP_SECTIONS.map((section, sectionIndex) => ({
                  id: section.anchorId ?? `help-item-${sectionIndex + 1}`,
                  title: section.title,
                  anchorId: section.anchorId,
                  content: (
                    <ul className="space-y-1.5 pl-1">
                      {section.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex gap-2 text-base leading-7 text-muted-foreground"
                        >
                          <span
                            className="mt-3 h-1 w-1 shrink-0 rounded-full bg-primary/50"
                            aria-hidden
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                })),
              ]}
            />
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
