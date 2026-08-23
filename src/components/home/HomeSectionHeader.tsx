"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface HomeSectionHeaderProps {
  /** Must match the `aria-labelledby` on the owning <section>. */
  headingId?: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
  onAction?: () => void;
}

/**
 * One heading grammar for every home section: title, optional supporting line
 * and an optional "see all" link. Promoted out of AuthenticatedHome so the
 * student home cannot drift into per-section heading styles.
 */
export function HomeSectionHeader({
  headingId,
  title,
  description,
  href,
  action,
  onAction,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2
          id={headingId}
          className="text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {href && action && (
        <Button
          asChild
          variant="ghost"
          className="w-fit shrink-0 px-0 text-primary hover:bg-transparent hover:underline"
        >
          <Link href={href} onClick={onAction}>
            {action}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
