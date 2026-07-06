import { useId } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPackageCoverDecoration,
  getPackageCoverTheme,
  type CoverPattern,
} from "@/lib/learning";

interface PackageCoverProps {
  examType?: string | null;
  subjectName?: string | null;
  slug?: string | null;
  isFeatured?: boolean;
  className?: string;
}

function CoverPatternLayer({
  pattern,
  patternId,
}: {
  pattern: CoverPattern;
  patternId: string;
}) {
  if (pattern === "curve") {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-15"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 88 C 50 88, 70 18, 110 30 S 180 78, 200 22"
          fill="none"
          stroke="white"
          strokeWidth="3"
        />
        <path d="M14 6 V 94 M6 86 H 194" stroke="white" strokeWidth="1.5" />
      </svg>
    );
  }

  if (pattern === "rings") {
    return (
      <svg
        className="absolute inset-0 h-full w-full opacity-15"
        viewBox="0 0 200 100"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[46, 32, 18].map((radius) => (
          <circle
            key={radius}
            cx="60"
            cy="52"
            r={radius}
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          />
        ))}
        <circle cx="60" cy="52" r="6" fill="white" />
      </svg>
    );
  }

  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {pattern === "dots" && (
          <pattern
            id={patternId}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="3" cy="3" r="1.6" fill="white" />
          </pattern>
        )}
        {pattern === "grid" && (
          <pattern
            id={patternId}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <path d="M26 0H0V26" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        )}
        {pattern === "waves" && (
          <pattern
            id={patternId}
            width="26"
            height="26"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 13 Q 6.5 3, 13 13 T 26 13"
              fill="none"
              stroke="white"
              strokeWidth="1.4"
            />
          </pattern>
        )}
        {pattern === "diagonal" && (
          <pattern
            id={patternId}
            width="18"
            height="18"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <line x1="0" y1="0" x2="0" y2="18" stroke="white" strokeWidth="1.4" />
          </pattern>
        )}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

export function PackageCover({
  examType,
  subjectName,
  slug,
  isFeatured = false,
  className,
}: PackageCoverProps) {
  const { gradient } = getPackageCoverTheme(examType, subjectName);
  const { Icon, pattern } = getPackageCoverDecoration(slug, subjectName);
  const patternId = useId();

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br",
        gradient,
        className
      )}
      aria-hidden="true"
    >
      <CoverPatternLayer pattern={pattern} patternId={patternId} />

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
