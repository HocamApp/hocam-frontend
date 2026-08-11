import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function CoachingEmptyState({
  icon: Icon,
  title,
  description,
  context,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  context?: string;
  actions?: ReactNode;
}) {
  return (
    <Card className="border-dashed bg-muted/20 shadow-none">
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-background">
          <Icon aria-hidden className="h-5 w-5 text-muted-foreground" />
        </span>
        <div className="max-w-xl space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          {context ? <p className="pt-1 text-xs leading-5 text-muted-foreground">{context}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </CardContent>
    </Card>
  );
}
