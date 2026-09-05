"use client";

import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorWorkspacePreparation } from "@/components/tutors/TutorWorkspacePreparation";

export default function Page() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <WorkspacePageShell title="Takvim" width="wide">
        <TutorWorkspacePreparation description="Derslerini ve müsaitlik saatlerini bir arada göreceğin takvim hazırlanıyor. Şimdilik programını Panom’dan yönetebilirsin." />
      </WorkspacePageShell>
    </RouteGuard>
  );
}
