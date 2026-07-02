"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { addFavoriteTutor, fetchFavoriteTutors, removeFavoriteTutor } from "@/lib/favoritesApi";
import type { FavoriteTutor } from "@/types/api";

export function useFavorites() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [pendingTutorId, setPendingTutorId] = useState<string | null>(null);
  const queryKey = ["favorites", user?.id] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchFavoriteTutors,
    enabled: isAuthenticated && !!user?.id,
  });

  const favorites = isAuthenticated ? data ?? [] : [];
  const favoriteIds = new Set(favorites.map((f) => f.tutor.id));

  const addMutation = useMutation({
    mutationFn: addFavoriteTutor,
    onMutate: (tutorId) => {
      setPendingTutorId(tutorId);
    },
    onSuccess: (favorite) => {
      queryClient.setQueryData<FavoriteTutor[]>(queryKey, (current = []) => {
        if (current.some((item) => item.tutor.id === favorite.tutor.id)) {
          return current;
        }
        return [favorite, ...current];
      });
      queryClient.invalidateQueries({ queryKey });
      toast.success("Favorilere eklendi.");
    },
    onError: () => toast.error("Favori eklenemedi. Lütfen tekrar deneyin."),
    onSettled: () => {
      setPendingTutorId(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFavoriteTutor,
    onMutate: (tutorId) => {
      setPendingTutorId(tutorId);
    },
    onSuccess: (_data, tutorId) => {
      queryClient.setQueryData<FavoriteTutor[]>(queryKey, (current = []) =>
        current.filter((item) => item.tutor.id !== tutorId)
      );
      queryClient.invalidateQueries({ queryKey });
      toast.success("Favorilerden çıkarıldı.");
    },
    onError: () => toast.error("Favori kaldırılamadı. Lütfen tekrar deneyin."),
    onSettled: () => {
      setPendingTutorId(null);
    },
  });

  function toggle(tutorId: string) {
    if (!isAuthenticated || pendingTutorId === tutorId) return;

    if (favoriteIds.has(tutorId)) {
      removeMutation.mutate(tutorId);
    } else {
      addMutation.mutate(tutorId);
    }
  }

  return {
    favorites,
    favoriteIds,
    isLoading,
    toggle,
    isFavoritePending: (tutorId: string) => pendingTutorId === tutorId,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
