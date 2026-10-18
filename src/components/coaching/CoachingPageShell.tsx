import type { ReactNode, Ref } from "react";

import { WorkspacePageShell } from "@/components/layout/WorkspacePageShell";
import { CoachingSubnav } from "./CoachingSubnav";

type CoachingPageShellProps = {
  title: string;
  actions?: ReactNode;
  width?: "narrow" | "default" | "wide";
  currentHref?: string;
  audience?: "tutor" | "student";
  titleRef?: Ref<HTMLSpanElement>;
  children: ReactNode;
};

export function CoachingPageShell({
  title,
  actions,
  width = "default",
  currentHref,
  audience,
  titleRef,
  children,
}: CoachingPageShellProps) {
  return (
    <WorkspacePageShell title={title} actions={actions} width={width} titleRef={titleRef}>
      {currentHref && audience ? (
        <CoachingSubnav currentHref={currentHref} audience={audience} />
      ) : null}
      {children}
    </WorkspacePageShell>
  );
}
