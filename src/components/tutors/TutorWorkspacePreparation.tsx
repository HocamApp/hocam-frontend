import Link from "next/link";
import { Button } from "@/components/ui/button";

/** A development-stage destination, not an empty result from a data request. */
export function TutorWorkspacePreparation({ description }: { description: string }) {
  return (
    <div className="max-w-2xl rounded-card border border-line bg-white p-6 sm:p-8">
      <p className="text-body leading-[1.6] text-ink-mid">{description}</p>
      <Button className="mt-6" variant="outline" asChild>
        <Link href="/dashboard/tutor">Panoma dön</Link>
      </Button>
    </div>
  );
}
