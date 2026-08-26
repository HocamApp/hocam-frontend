import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MainLayoutShell } from "@/components/layout/MainLayoutShell";
import { AccountDeletionBanner } from "@/components/shared/AccountDeletionBanner";
import { PresenceHeartbeat } from "@/components/shared/PresenceHeartbeat";
import { TutorActivationGate } from "@/components/shared/TutorActivationGate";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <AccountDeletionBanner />
      <PresenceHeartbeat />
      <TutorActivationGate />
      <MainLayoutShell>
        <main id="ys-main-content" className="min-h-[calc(100vh-var(--app-header-h))] flex-1">{children}</main>
        <Footer />
      </MainLayoutShell>
    </>
  );
}
