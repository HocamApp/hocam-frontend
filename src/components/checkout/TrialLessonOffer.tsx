import { Button } from "@/components/ui/button";

export function TrialLessonOffer({
  remaining,
  onSelect,
}: {
  remaining: number;
  onSelect: () => void;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--checkout-evergreen)] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Önce ücretsiz tanışma dersi planla</p>
        <p className="mt-0.5 text-xs opacity-65">Bu ay {remaining} ücretsiz tanışma hakkın kaldı.</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-[var(--checkout-evergreen)] bg-transparent text-[var(--checkout-nighttime)]"
        onClick={onSelect}
      >
        Ücretsiz dersi ayarla
      </Button>
    </section>
  );
}
