import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HomeSectionHeaderProps {
  headingId?: string;
  title: string;
  description: string;
  href?: string;
  action?: string;
  onAction?: () => void;
  /**
   * Set when a decorative stroke is drawn under the title, so the description
   * clears it instead of sitting on top of the pen mark.
   */
  underlinedTitle?: boolean;
}

/** Section title + subtitle + optional "show all" link, shared by every home rail. */
export function HomeSectionHeader({
  headingId,
  title,
  description,
  href,
  action,
  onAction,
  underlinedTitle = false,
}: HomeSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 id={headingId} className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p
          className={cn(
            "max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base",
            underlinedTitle ? "mt-4 sm:mt-5" : "mt-2"
          )}
        >
          {description}
        </p>
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
