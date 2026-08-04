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
  const { gradient } = getPackageCoverTheme(examType, subjectName);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
      aria-hidden="true"
    >
      {isFeatured && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-sm">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Öne çıkan
        </span>
      )}
    </div>
  );
}
