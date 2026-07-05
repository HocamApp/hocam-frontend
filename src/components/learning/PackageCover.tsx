import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPackageCoverTheme } from "@/lib/learning";

interface PackageCoverProps {
  examType?: string | null;
  subjectName?: string | null;
  isFeatured?: boolean;
  className?: string;
}

export function PackageCover({
  examType,
  subjectName,
  isFeatured = false,
  className,
}: PackageCoverProps) {
  const { gradient, Icon } = getPackageCoverTheme(examType, subjectName);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-15"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="package-cover-dots"
            x="0"
            y="0"
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.6" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#package-cover-dots)" />
      </svg>

      <div className="absolute -left-6 -bottom-10 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute right-10 -top-8 h-24 w-24 rounded-full bg-white/10" />

      <Icon
        className="absolute -bottom-5 -right-4 h-28 w-28 rotate-12 text-white/25"
        strokeWidth={1.5}
      />

      {examType && (
        <span className="absolute bottom-3 left-4 text-3xl font-black tracking-tight text-white/30">
          {examType.toUpperCase()}
        </span>
      )}

      {isFeatured && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Öne çıkan
        </span>
      )}
    </div>
  );
}
