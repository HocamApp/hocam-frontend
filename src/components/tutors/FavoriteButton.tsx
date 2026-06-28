"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  tutorId: string;
  isFavorite: boolean;
  isPending: boolean;
  onToggle: (tutorId: string) => void;
  className?: string;
}

export function FavoriteButton({
  tutorId,
  isFavorite,
  isPending,
  onToggle,
  className,
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const tooltipLabel = isFavorite ? "Listemden çıkar" : "Listeme kaydet";

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    onToggle(tutorId);
  }

  return (
    <div className={cn("group relative inline-flex shrink-0", className)}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={tooltipLabel}
        disabled={isPending}
        onClick={handleClick}
        className="h-8 w-8 shrink-0"
      >
        <Heart
          className={cn(
            "h-5 w-5 transition duration-200 ease-out group-hover:scale-105",
            isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
          )}
        />
      </Button>
      <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 whitespace-nowrap rounded-full border border-slate-700/20 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-50 opacity-0 shadow-lg shadow-slate-950/10 transition duration-200 ease-out translate-y-1 scale-95 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-slate-950/30">
        {tooltipLabel}
      </span>
    </div>
  );
}
