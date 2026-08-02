"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, Scale, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import {
  createTutorSavedSearch,
  deleteTutorSavedSearch,
  fetchTutorComparison,
  fetchTutorSavedSearches,
  type TutorFilters,
} from "@/lib/tutorsApi";
import { formatPrice, formatRating } from "@/lib/utils";
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

export function TutorComparisonPanel({
  ids,
  onRemove,
  onClear,
}: {
  ids: string[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const { data: tutors = [], isLoading, isError } = useQuery({
    queryKey: ["tutor-comparison", ids],
    queryFn: () => fetchTutorComparison(ids),
    enabled: ids.length > 0,
  });

  if (ids.length === 0) return null;

  return (
    <section className="rounded-xl border bg-card p-4 shadow-sm" aria-labelledby="comparison-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 id="comparison-title" className="flex items-center gap-2 font-semibold">
            <Scale className="h-4 w-4 text-primary" /> Hoca karşılaştırması
          </h2>
          <p className="text-xs text-muted-foreground">En fazla üç hoca; bu sayfanın bağlantısı paylaşılabilir.</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>Temizle</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Karşılaştırma yükleniyor…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Karşılaştırma yüklenemedi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-muted-foreground">Özellik</th>
                {tutors.map((tutor) => (
                  <th key={tutor.id} className="p-2 align-top">
                    <div className="flex items-start justify-between gap-2">
                      <span>{tutor.name} {tutor.surname}</span>
                      <button type="button" onClick={() => onRemove(tutor.id)} aria-label={`${tutor.name} hocayı karşılaştırmadan çıkar`}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><th className="p-2 font-medium">Fiyat</th>{tutors.map((t) => <td key={t.id} className="p-2">{formatPrice(t.hourly_price)} / 40 dk</td>)}</tr>
              <tr><th className="p-2 font-medium">Rezervasyon</th>{tutors.map((t) => <td key={t.id} className="p-2">{t.is_bookable ? "Uygun" : "Şu an uygun değil"}</td>)}</tr>
              <tr><th className="p-2 font-medium">Dersler</th>{tutors.map((t) => <td key={t.id} className="p-2">{Array.from(new Set(t.subjects.map((s) => s.name))).join(", ")}</td>)}</tr>
              <tr><th className="p-2 font-medium">Doğrulama</th>{tutors.map((t) => <td key={t.id} className="p-2">{t.is_verified ? "Doğrulanmış" : "Doğrulanmamış"}</td>)}</tr>
              <tr><th className="p-2 font-medium">Puan</th>{tutors.map((t) => <td key={t.id} className="p-2">{t.total_reviews ? `${formatRating(t.rating)} (${t.total_reviews})` : "Henüz değerlendirme yok"}</td>)}</tr>
              <tr><th className="p-2 font-medium">Anlatım özellikleri</th>{tutors.map((t) => <td key={t.id} className="p-2">{t.teaching_attributes?.map((a) => a.name).join(", ") || "Belirtilmemiş"}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
