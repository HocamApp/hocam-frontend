"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { addFavoriteTutor, fetchFavoriteTutors, removeFavoriteTutor } from "@/lib/favoritesApi";

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavoriteTutors,
    enabled: isAuthenticated,
  });

  const favoriteIds = new Set(favorites.map((f) => f.tutor.id));

  const addMutation = useMutation({
    mutationFn: addFavoriteTutor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Favorilere eklendi.");
    },
    onError: () => toast.error("Favori eklenemedi. Lütfen tekrar deneyin."),
  });

  const removeMutation = useMutation({
    mutationFn: removeFavoriteTutor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Favorilerden çıkarıldı.");
    },
    onError: () => toast.error("Favori kaldırılamadı. Lütfen tekrar deneyin."),
  });

  function toggle(tutorId: string) {
    if (favoriteIds.has(tutorId)) {
      removeMutation.mutate(tutorId);
    } else {
      addMutation.mutate(tutorId);
    }
  }

  return {
    favoriteIds,
    toggle,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}
