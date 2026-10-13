import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PLACE_ENTRY } from "@/lib/placeLessonsCopy";
import { placeLessonsHref } from "@/lib/placeLessonsRoutes";
import { hasUnplacedCredits } from "@/lib/unplacedCredits";
import type { PackagePurchase } from "@/types";

/**
 * The way into placing a paid package's credits that are not on the calendar:
 * a late payment whose hours were taken in the meantime, or a credit given back
 * by a cancellation. Shown only on a paid weekly package with credits left;
 * nowhere else, so nobody meets it before they have a package.
 */
export function UnplacedCreditsEntry({ purchase }: { purchase: PackagePurchase }) {
  if (!hasUnplacedCredits(purchase)) return null;

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-ink-mid">{PLACE_ENTRY.lead(purchase.remaining_credits)}</p>
      <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
        <Link href={placeLessonsHref(purchase.id)}>{PLACE_ENTRY.action}</Link>
      </Button>
    </div>
  );
}
