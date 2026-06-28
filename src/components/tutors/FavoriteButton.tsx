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
    <Button
      variant="ghost"
      size="icon"
      aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      disabled={isPending}
      onClick={handleClick}
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
