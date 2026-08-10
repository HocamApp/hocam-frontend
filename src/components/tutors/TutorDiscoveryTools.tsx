"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  createTutorSavedSearch,
  deleteTutorSavedSearch,
  fetchTutorSavedSearches,
  type TutorFilters,
} from "@/lib/tutorsApi";
import { savedSearchToTutorFilters } from "@/lib/tutorDirectory";

export function SavedSearchControls({
  filters,
  onApply,
}: {
  filters: TutorFilters;
  onApply: (filters: TutorFilters) => void;
}) {
  const { isStudent } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const { data: savedSearches = [] } = useQuery({
    queryKey: ["tutor-saved-searches"],
    queryFn: fetchTutorSavedSearches,
    enabled: isStudent,
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      createTutorSavedSearch({
        name: name.trim(),
        filters: { ...filters, ordering: undefined },
        ordering: filters.ordering || "rating",
      }),
    onSuccess: () => {
      setName("");
      setMessage("Arama kaydedildi.");
      void queryClient.invalidateQueries({ queryKey: ["tutor-saved-searches"] });
    },
    onError: () => setMessage("Arama kaydedilemedi."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTutorSavedSearch,
    onSuccess: () => {
      setMessage("Kayıtlı arama silindi.");
      void queryClient.invalidateQueries({ queryKey: ["tutor-saved-searches"] });
    },
  });

  if (!isStudent) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          placeholder="Arama adı (isteğe bağlı)"
          aria-label="Kayıtlı arama adı"
        />
        <Button
          type="button"
          variant="outline"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Aramayı kaydet
        </Button>
      </div>
      {message && <p className="mt-2 text-xs text-muted-foreground" role="status">{message}</p>}
      {savedSearches.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {savedSearches.map((saved) => (
            <div key={saved.id} className="inline-flex items-center rounded-full border bg-background">
              <button
                type="button"
                className="px-3 py-1.5 text-xs font-medium hover:text-primary"
                onClick={() => onApply(savedSearchToTutorFilters(saved))}
              >
                {saved.name || "Kayıtlı arama"}
              </button>
              <button
                type="button"
                className="border-l px-2 py-1.5 text-muted-foreground hover:text-destructive"
                aria-label={`${saved.name || "Kayıtlı arama"} kaydını sil`}
                onClick={() => deleteMutation.mutate(saved.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
