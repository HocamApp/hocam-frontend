"use client";

import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorWorkspacePreparation } from "@/components/tutors/TutorWorkspacePreparation";

export default function Page() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <WorkspacePageShell title="İstatistiklerim" width="wide">
        <TutorWorkspacePreparation description="Ders etkinliğini zaman içinde inceleyebileceğin alan hazırlanıyor. Güncel göstergelerini Panom’da görebilirsin." />
      </WorkspacePageShell>
    </RouteGuard>
  );
}
