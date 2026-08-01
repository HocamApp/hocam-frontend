import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrialLessonOffer({
  remaining,
  onSelect,
}: {
  remaining: number;
  onSelect: () => void;
}) {
  return (
    <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-dashed border-primary/35 bg-primary/[0.045] p-5 sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Gift className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Önce ücretsiz tanışma dersi planla</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Bu ay {remaining} ücretsiz tanışma hakkın kaldı.</p>
      </div>
      <Button variant="outline" className="rounded-xl bg-background" onClick={onSelect}>Ücretsiz dersi ayarla</Button>
    </section>
  );
}
