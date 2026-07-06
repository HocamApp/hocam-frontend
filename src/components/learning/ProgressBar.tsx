import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      aria-label={`İlerleme yüzde ${progress}`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      role="progressbar"
    >
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
