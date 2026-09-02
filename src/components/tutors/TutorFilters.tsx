"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { FunnelSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PriceRangeSlider,
  priceTupleToFilters,
  filtersToPriceTuple,
} from "@/components/tutors/PriceRangeSlider";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import type { Subject } from "@/types";
import { getSubjectOptionsForExam, isSubjectValidForExam } from "@/lib/subjects";
import { fetchTeachingAttributes } from "@/lib/tutorsApi";
import { fetchLearningTopics } from "@/lib/learningApi";

interface TutorFiltersProps {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  onClear: () => void;
  isLoading: boolean;
  defaultOrdering?: string;
  savedSearchControls?: ReactNode;
}

const POPULAR_UNIVERSITIES = [
  "Yıldız Teknik Üniversitesi", "Orta Doğu Teknik Üniversitesi", "İstanbul Teknik Üniversitesi",
  "Boğaziçi Üniversitesi", "Koç Üniversitesi", "Sabancı Üniversitesi", "Hacettepe Üniversitesi",
  "Bilkent Üniversitesi", "İstanbul Üniversitesi", "Ankara Üniversitesi", "Ege Üniversitesi",
  "Gebze Teknik Üniversitesi",
];

// Number of non-default filters currently set. Ordering counts only when it
// differs from the "rating" default. Mirrors the page-level active-filter set.
function countActiveFilters(filters: TutorFiltersType): number {
  return [
    (filters.subject ?? "") !== "",
    (filters.exam_type ?? "") !== "",
    (filters.min_rating ?? "") !== "",
    (filters.min_price ?? "") !== "",
    (filters.max_price ?? "") !== "",
    (filters.university ?? "") !== "",
    (filters.yks_rank_max ?? "") !== "",
    (filters.availability_day ?? "") !== "",
    (filters.availability_time ?? "") !== "",
    (filters.online ?? "") !== "",
    (filters.teaching_attributes ?? "") !== "",
    (filters.topic ?? "") !== "",
    (filters.has_coaching ?? "") !== "" || (filters.free_coaching ?? "") !== "",
    (filters.ordering ?? "rating") !== "rating",
  ].filter(Boolean).length;
}

function FilterPanelContent({
  filters,
  subjects,
  onFiltersChange,
  onClear,
  priceValue,
  onPriceCommit,
  isLoading,
  showClearButton = true,
  defaultOrdering = "rating",
}: {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  onClear: () => void;
  priceValue: [number, number];
  onPriceCommit: (value: [number, number]) => void;
  isLoading: boolean;
  showClearButton?: boolean;
  defaultOrdering?: string;
}) {
  const subjectOptions = getSubjectOptionsForExam(subjects, filters.exam_type);
  const universityOptions = filters.university && !POPULAR_UNIVERSITIES.includes(filters.university)
    ? [filters.university, ...POPULAR_UNIVERSITIES]
    : POPULAR_UNIVERSITIES;
  const hasActiveFilters = countActiveFilters(filters) > 0;
  const { data: teachingAttributes = [] } = useQuery({
    queryKey: ["teaching-attributes"], queryFn: fetchTeachingAttributes, staleTime: Infinity,
  });
  const { data: learningTopics = [] } = useQuery({
    queryKey: ["learning-topics"], queryFn: fetchLearningTopics, staleTime: Infinity,
  });
  const selectedAttributes = (filters.teaching_attributes ?? "").split(",").filter(Boolean);

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label>Sınav</Label>
        <ResponsiveSelect
          label="Sınav"
          nativeUntil="lg"
          value={(filters.exam_type ?? "") || "__all__"}
          onValueChange={(v) => {
            const exam_type = v === "__all__" ? "" : v;
            const subject = isSubjectValidForExam(subjects, filters.subject, exam_type)
              ? filters.subject
              : "";
            onFiltersChange({ ...filters, exam_type, subject, topic: "" });
          }}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tüm sınavlar" },
            { value: "TYT", label: "TYT" },
            { value: "AYT", label: "AYT" },
            { value: "DGS", label: "DGS" },
            { value: "KPSS", label: "KPSS" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Ders</Label>
        <ResponsiveSelect
          label="Ders"
          nativeUntil="lg"
          value={(filters.subject ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, subject: v === "__all__" ? "" : v, topic: "" })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tüm dersler" },
            ...subjectOptions.map((subject) => ({
              value: subject.name,
              label: subject.name,
            })),
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Müfredat konusu</Label>
        <ResponsiveSelect
          label="Müfredat konusu"
          nativeUntil="lg"
          value={(filters.topic ?? "") || "__all__"}
          onValueChange={(value) => {
            const topic = learningTopics.find((item) => item.id === value);
            onFiltersChange({
              ...filters,
              topic: value === "__all__" ? "" : value,
              ...(topic ? { subject: topic.subject_name, exam_type: topic.exam_type } : {}),
            });
          }}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tüm konular" },
            ...learningTopics
              .filter((topic) => !filters.exam_type || topic.exam_type === filters.exam_type)
              .filter((topic) => !filters.subject || topic.subject_name === filters.subject)
              .map((topic) => ({
                value: topic.id,
                label: `${topic.exam_type} · ${topic.subject_name} · ${topic.title}`,
              })),
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Minimum puan</Label>
        <ResponsiveSelect
          label="Minimum puan"
          nativeUntil="lg"
          value={(filters.min_rating ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, min_rating: v === "__all__" ? "" : v })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tümü" },
            { value: "4", label: "4+" },
            { value: "4.5", label: "4.5+" },
          ]}
        />
      </div>

      <Accordion type="single" collapsible className="-my-2">
        <AccordionItem value="teaching-attributes" className="border-none">
          <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
            <span className="flex items-center gap-2">
              Ders anlatım özellikleri
              {selectedAttributes.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums">
                  {selectedAttributes.length}
                </Badge>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-1">
            <div className="flex flex-wrap gap-2">
              {teachingAttributes.map((attribute) => {
                const selected = selectedAttributes.includes(attribute.code);
                return (
                  <button key={attribute.code} type="button" aria-pressed={selected}
                    onClick={() => {
                      const next = selected
                        ? selectedAttributes.filter((code) => code !== attribute.code)
                        : [...selectedAttributes, attribute.code];
                      onFiltersChange({ ...filters, teaching_attributes: next.join(",") });
                    }}
                    className={`rounded-full border px-2.5 py-1 text-xs ${selected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {attribute.name}
                  </button>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <PriceRangeSlider
        value={priceValue}
        onValueCommit={onPriceCommit}
        disabled={isLoading}
      />

      <div className="space-y-2">
        <Label>YKS sıralaması</Label>
        <ResponsiveSelect
          label="YKS sıralaması"
          nativeUntil="lg"
          value={(filters.yks_rank_max ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, yks_rank_max: v === "__all__" ? "" : v })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tümü" },
            { value: "1000", label: "İlk 1.000" },
            { value: "5000", label: "İlk 5.000" },
            { value: "10000", label: "İlk 10.000" },
            { value: "15000", label: "İlk 15.000" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Üniversite</Label>
        <ResponsiveSelect
          label="Üniversite"
          nativeUntil="lg"
          value={(filters.university ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, university: v === "__all__" ? "" : v })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Popülerden seç" },
            ...universityOptions.map((university) => ({
              value: university,
              label: university,
            })),
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Uygunluk günü</Label>
        <ResponsiveSelect
          label="Uygunluk günü"
          nativeUntil="lg"
          value={(filters.availability_day ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, availability_day: v === "__all__" ? "" : v, availability_time: v === "__all__" ? "" : filters.availability_time })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Herhangi bir gün" },
            { value: "0", label: "Pazartesi" },
            { value: "1", label: "Salı" },
            { value: "2", label: "Çarşamba" },
            { value: "3", label: "Perşembe" },
            { value: "4", label: "Cuma" },
            { value: "5", label: "Cumartesi" },
            { value: "6", label: "Pazar" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Uygunluk saati</Label>
        <ResponsiveSelect
          label="Uygunluk saati"
          nativeUntil="lg"
          value={(filters.availability_time ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, availability_time: v === "__all__" ? "" : v })}
          disabled={isLoading || !filters.availability_day}
          placeholder="Önce gün seç"
          options={[
            { value: "__all__", label: "Herhangi bir saat" },
            ...["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((time) => ({ value: time, label: time })),
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Çalışma koçluğu</Label>
        <ResponsiveSelect
          label="Çalışma koçluğu"
          nativeUntil="lg"
          value={
            filters.free_coaching === "true"
              ? "free"
              : filters.has_coaching === "true"
                ? "any"
                : "__all__"
          }
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              has_coaching: v === "any" ? "true" : "",
              free_coaching: v === "free" ? "true" : "",
            })
          }
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tümü" },
            { value: "any", label: "Koçluk sunanlar" },
            { value: "free", label: "Ücretsiz koçluk sunanlar" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Platform durumu</Label>
        <ResponsiveSelect
          label="Platform durumu"
          nativeUntil="lg"
          value={(filters.online ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, online: v === "__all__" ? "" : v })}
          disabled={isLoading}
          options={[
            { value: "__all__", label: "Tümü" },
            { value: "true", label: "Sadece çevrim içi" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Sıralama</Label>
        <ResponsiveSelect
          label="Sıralama"
          nativeUntil="lg"
          value={filters.ordering ?? defaultOrdering}
          onValueChange={(v) => onFiltersChange({ ...filters, ordering: v || defaultOrdering })}
          disabled={isLoading}
          options={[
            { value: "relevance", label: "En alakalı" },
            { value: "rating", label: "En yüksek puan" },
            { value: "price", label: "En uygun fiyat" },
            { value: "-price", label: "En yüksek fiyat" },
            { value: "yks_rank", label: "En iyi YKS sıralaması" },
            { value: "-yks_rank", label: "YKS sıralaması: yüksekten" },
            { value: "newest", label: "En yeni" },
          ]}
        />
      </div>

      {showClearButton && hasActiveFilters && (
        <Button variant="ghost" className="w-full" onClick={handleClear}>
          Filtreleri Temizle
        </Button>
      )}
    </div>
  );
}

export function TutorFilters({
  filters,
  subjects,
  onFiltersChange,
  onClear,
  isLoading,
  defaultOrdering = "rating",
  savedSearchControls,
}: TutorFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const priceValue = filtersToPriceTuple(filters.min_price, filters.max_price);

  const handleFiltersChange = useCallback(
    (newFilters: TutorFiltersType) => {
      onFiltersChange(newFilters);
    },
    [onFiltersChange]
  );

  // Commit price changes without closing the mobile Sheet.
  const onPriceCommit = useCallback(
    (tuple: [number, number]) => {
      handleFiltersChange({ ...filters, ...priceTupleToFilters(tuple) });
    },
    [filters, handleFiltersChange]
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 lg:block">
        <FilterPanelContent
          filters={filters}
          subjects={subjects}
          onFiltersChange={handleFiltersChange}
          onClear={onClear}
          priceValue={priceValue}
          onPriceCommit={onPriceCommit}
          isLoading={isLoading}
          defaultOrdering={defaultOrdering}
        />
        {savedSearchControls && <div className="mt-4">{savedSearchControls}</div>}
      </div>

      {/* Mobile/tablet: bottom-sheet trigger */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FunnelSimple className="h-4 w-4" />
              Filtrele
              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums"
                >
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex max-h-[85vh] flex-col rounded-t-2xl p-0">
            <SheetHeader className="border-b p-6">
              <SheetTitle>Filtreler</SheetTitle>
              <SheetDescription className="sr-only">
                Hoca sonuçlarını sınav, ders, konu ve diğer ölçütlere göre filtrele.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FilterPanelContent
                filters={filters}
                subjects={subjects}
                onFiltersChange={handleFiltersChange}
                onClear={onClear}
                priceValue={priceValue}
                onPriceCommit={onPriceCommit}
                isLoading={isLoading}
                defaultOrdering={defaultOrdering}
                showClearButton={false}
              />
              {savedSearchControls && <div className="mt-5">{savedSearchControls}</div>}
            </div>
            <SheetFooter className="flex-row gap-3 border-t p-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={activeCount === 0}
                onClick={onClear}
              >
                Temizle
              </Button>
              <Button type="button" className="flex-1" onClick={() => setSheetOpen(false)}>
                Uygula
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
