import Image from "next/image";
import { Sparkles } from "lucide-react";

interface TutorJourneyAsideProps {
  eyebrow: string;
  title: string;
  description: string;
  progress: number;
  progressLabel: string;
  fact: string;
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
    <aside className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/10 lg:sticky lg:top-24">
      <div className="relative isolate px-6 py-6 sm:px-8 lg:min-h-[560px] lg:py-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-100">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-brand-50">{description}</p>

          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{progressLabel}</span>
              <span className="font-bold">%{progress}</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/15">
              <div
                className="h-full rounded-full bg-[#ffd51f] transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <p className="text-sm leading-5">{fact}</p>
          </div>
        </div>

        <Image
          src="/images/onboarding/hocam-guide.png"
          alt="Hocam maskotu"
          width={360}
          height={360}
          priority
          className="relative z-0 mx-auto -mb-24 mt-1 hidden w-64 drop-shadow-2xl lg:block"
        />
      </div>
    </aside>
  );
}
