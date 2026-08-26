import { Suspense } from "react";

import { YsFooter } from "@/components/yemeksepeti/YsFooter";
import { YsNavbar } from "@/components/yemeksepeti/YsNavbar";
import { MainLayoutShell } from "@/components/layout/MainLayoutShell";
import { AccountDeletionBanner } from "@/components/shared/AccountDeletionBanner";
import { PresenceHeartbeat } from "@/components/shared/PresenceHeartbeat";
import { TutorActivationGate } from "@/components/shared/TutorActivationGate";

/**
 * The application shell.
 *
 * `YsNavbar` is rendered here and nowhere else, and that is the whole point of
 * this file. A layout is the only thing React keeps mounted across a
 * navigation, so one instance here survives every route change underneath it —
 * an uncommitted search draft included. Render it from a page as well and it
 * becomes two instances that swap places.
 *
 * It stays a sibling *above* `MainLayoutShell` rather than a child, exactly
 * where the old navbar sat. The shell returns `null` for its entire subtree
 * while an unverified tutor is being redirected into onboarding, and a header
 * inside it would blink out with the page.
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* The navbar reads `useSearchParams`, which opts every route under this
          layout into dynamic rendering unless it is suspended. The fallback
          reserves the header's exact height so nothing below it jumps. */}
      <Suspense
        fallback={<div style={{ height: "var(--app-header-h)" }} aria-hidden />}
      >
        <YsNavbar />
      </Suspense>
      <AccountDeletionBanner />
      <PresenceHeartbeat />
      <TutorActivationGate />
      <MainLayoutShell>
        <main
          id="ys-main-content"
          className="min-h-[calc(100vh-var(--app-header-h))] flex-1"
        >
          {children}
        </main>
        <YsFooter />
      </MainLayoutShell>
    </>
  );
}
