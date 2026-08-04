"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionCardTitle } from "@/components/profile/SectionCardTitle";
import { GoogleCalendarConnectionCard } from "@/components/tutors/GoogleCalendarConnectionCard";

/**
 * Anchor target for every entry point that sends the user here (navbar
 * profile menu, the compact CTA on the public tutor page, the OAuth
 * callback). `scroll-mt` keeps the heading clear of the sticky navbar when
 * the browser jumps to the fragment.
 */
export const CALENDAR_CONNECTIONS_SECTION_ID = "takvim-baglantilari";
export const CALENDAR_CONNECTIONS_HREF = `/profile#${CALENDAR_CONNECTIONS_SECTION_ID}`;

/**
 * The single, role-neutral home of Google Calendar connection management.
 * Rendered for students and tutors alike — no gating on onboarding state,
 * tutor profile existence/completeness, or the public tutor endpoint; the
 * card inside talks to the role-neutral /google-calendar/ API directly.
 */
export function CalendarConnectionsSection() {
  return (
    <Card id={CALENDAR_CONNECTIONS_SECTION_ID} className="scroll-mt-24">
      <CardHeader>
        <SectionCardTitle className="text-base">
          Takvim bağlantıları
        </SectionCardTitle>
        <p className="text-sm text-muted-foreground">
          Google Calendar&apos;ı bağlarsan ders rezervasyonların
          &quot;Hocam Dersleri&quot; takvimine otomatik eklenir.
        </p>
      </CardHeader>
      <CardContent>
        <GoogleCalendarConnectionCard />
      </CardContent>
    </Card>
  );
}
