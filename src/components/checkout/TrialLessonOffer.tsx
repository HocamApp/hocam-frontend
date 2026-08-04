import { Button } from "@/components/ui/button";

export function TrialLessonOffer({
  remaining,
  onSelect,
}: {
  remaining: number;
  onSelect: () => void;
}) {
  return (
    <section className="flex min-h-14 flex-col gap-2 rounded-lg border border-dashed border-[var(--checkout-control)] px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Önce ücretsiz tanışma dersi planla</p>
        <p className="text-xs opacity-65">Bu ay {remaining} ücretsiz hakkın kaldı.</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-8 border-[var(--checkout-control)] bg-transparent px-3 text-xs text-[var(--checkout-nighttime)]"
        onClick={onSelect}
      >
        Dersi planla
      </Button>
    </section>
  );
}
