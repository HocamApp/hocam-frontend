import Image from "next/image";
import { BookOpenText } from "@phosphor-icons/react/ssr";

interface TutorJourneyAsideProps {
  eyebrow?: string;
  title: string;
  description: string;
  progress: number;
  progressLabel: string;
  fact?: string;
}

export function TutorJourneyAside({
  eyebrow,
  title,
  description,
  progress,
  progressLabel,
  fact,
}: TutorJourneyAsideProps) {
  return (
    <aside className="self-start overflow-hidden rounded-modal border border-line bg-surface lg:sticky lg:top-[calc(var(--app-header-h)+24px)]">
      <div className="bg-pink px-6 py-7 text-white sm:px-8">
        {eyebrow && (
          <p className="text-label font-medium text-white/80">{eyebrow}</p>
        )}
        <h2 className={`${eyebrow ? "mt-3" : ""} text-[1.75rem] font-bold leading-[1.12] tracking-[-0.02em] text-balance sm:text-[2rem]`}>
          {title}
        </h2>
        <p className="mt-4 max-w-[36rem] text-body leading-[1.6] text-white/85 text-pretty">
          {description}
        </p>
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <div className="flex items-center justify-between gap-3 text-small">
            <span className="font-medium text-ink">{progressLabel}</span>
            <span className="font-bold tabular-nums text-ink">%{progress}</span>
          </div>
          <div
            role="progressbar"
            aria-label="Profil ilerlemesi"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="mt-3 h-2 overflow-hidden rounded-pill bg-line"
          >
            <div
              className="h-full rounded-pill bg-pink transition-[width] duration-[var(--duration-state)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {fact && (
          <div className="flex gap-3 border-t border-line pt-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-paper text-ink">
              <BookOpenText aria-hidden="true" className="h-5 w-5" weight="regular" />
            </span>
            <p className="text-small leading-[1.6] text-ink-mid text-pretty">{fact}</p>
          </div>
        )}
      </div>

      <div className="relative min-h-64 overflow-hidden bg-gold px-6 pt-5 sm:min-h-72 sm:px-8">
        <p className="relative z-10 max-w-[20rem] text-xl font-bold leading-[1.25] tracking-[-0.01em] text-gold-ink sm:text-2xl">
          Her adım, öğrencinin seni daha doğru tanımasına yardım eder.
        </p>
        <Image
          src="/images/onboarding/tutor-journey-guide.png"
          alt="Öğretmen yolculuğunu anlatan çizim"
          width={1200}
          height={1200}
          priority
          className="absolute -bottom-20 -right-12 w-72 opacity-90 mix-blend-multiply sm:w-80"
        />
      </div>
    </aside>
  );
}
