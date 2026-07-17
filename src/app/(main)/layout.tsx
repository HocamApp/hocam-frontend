import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MainLayoutShell } from "@/components/layout/MainLayoutShell";
import { PresenceHeartbeat } from "@/components/shared/PresenceHeartbeat";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <PresenceHeartbeat />
      <MainLayoutShell>
        <main className="min-h-[calc(100vh-64px)] flex-1">{children}</main>
        <Footer />
      </MainLayoutShell>
    </>
  );
}
