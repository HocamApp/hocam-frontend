import { Info } from "@phosphor-icons/react/ssr";

/**
 * Platform-wide information the tutor cannot change (for example, new coaching
 * sales being paused for everyone). Information, never a failure to fix: it has
 * no action and no error colour.
 */
export function CoachingPlatformNotice({ message }: { message: string }) {
  return (
    <section
      role="region"
      aria-label="Platform durumu"
      className="flex gap-3 rounded-card border border-line bg-surface p-4 text-small text-ink"
    >
      <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" weight="regular" />
      <div>
        <p className="font-medium">Platform bilgisi</p>
        <p className="mt-0.5 text-ink-mid">{message}</p>
      </div>
    </section>
  );
}
