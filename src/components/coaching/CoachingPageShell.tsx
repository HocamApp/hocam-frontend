import type { ReactNode } from "react";

import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { CoachingSubnav } from "./CoachingSubnav";

type CoachingPageShellProps = {
  title: string;
  actions?: ReactNode;
  width?: "narrow" | "default" | "wide";
  currentHref?: string;
  audience?: "tutor" | "student";
  children: ReactNode;
};

export function CoachingPageShell({
  title,
  actions,
  width = "default",
  currentHref,
  audience,
  children,
}: CoachingPageShellProps) {
  return (
    <WorkspacePageShell title={title} actions={actions} width={width}>
      {currentHref && audience ? (
        <CoachingSubnav currentHref={currentHref} audience={audience} />
      ) : null}
      {children}
    </WorkspacePageShell>
  );
}
