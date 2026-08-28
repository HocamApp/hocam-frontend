export function CoachingLoadingState({ rows = 2 }: { rows?: number }) {
  return (
    <div
      aria-label="İçerik yükleniyor"
      className="rounded-card border border-line bg-surface p-6 sm:p-8"
    >
      <div className="h-8 w-48 animate-pulse rounded-input bg-[var(--skeleton)]" />
      <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded-input bg-[var(--skeleton)]" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-input bg-[var(--skeleton)]"
          />
        ))}
      </div>
    </div>
  );
}
