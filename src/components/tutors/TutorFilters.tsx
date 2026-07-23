"use client";

import { useState, useCallback } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  PriceRangeSlider,
  priceTupleToFilters,
  filtersToPriceTuple,
} from "@/components/tutors/PriceRangeSlider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import type { Subject } from "@/types";
import { getSubjectOptionsForExam, isSubjectValidForExam } from "@/lib/subjects";

interface TutorFiltersProps {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  onClear: () => void;
  isLoading: boolean;
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
}: {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  onClear: () => void;
  priceValue: [number, number];
  onPriceCommit: (value: [number, number]) => void;
  isLoading: boolean;
  showClearButton?: boolean;
}) {
  const subjectOptions = getSubjectOptionsForExam(subjects, filters.exam_type);
  const universityOptions = filters.university && !POPULAR_UNIVERSITIES.includes(filters.university)
    ? [filters.university, ...POPULAR_UNIVERSITIES]
    : POPULAR_UNIVERSITIES;
  const hasActiveFilters = countActiveFilters(filters) > 0;

  const handleClear = () => {
    onClear();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label>Sınav</Label>
        <Select
          value={(filters.exam_type ?? "") || "__all__"}
          onValueChange={(v) => {
            const exam_type = v === "__all__" ? "" : v;
            const subject = isSubjectValidForExam(subjects, filters.subject, exam_type)
              ? filters.subject
              : "";
            onFiltersChange({ ...filters, exam_type, subject });
          }}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tüm sınavlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm sınavlar</SelectItem>
            <SelectItem value="TYT">TYT</SelectItem>
            <SelectItem value="AYT">AYT</SelectItem>
            <SelectItem value="DGS">DGS</SelectItem>
            <SelectItem value="KPSS">KPSS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Ders</Label>
        <Select
          value={(filters.subject ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, subject: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tüm dersler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tüm dersler</SelectItem>
            {subjectOptions.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Minimum puan</Label>
        <Select
          value={(filters.min_rating ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, min_rating: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tümü</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="4.5">4.5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PriceRangeSlider
        value={priceValue}
        onValueCommit={onPriceCommit}
        disabled={isLoading}
      />

      <div className="space-y-2">
        <Label>YKS sıralaması</Label>
        <Select
          value={(filters.yks_rank_max ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, yks_rank_max: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger><SelectValue placeholder="Tümü" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tümü</SelectItem>
            <SelectItem value="1000">İlk 1.000</SelectItem>
            <SelectItem value="5000">İlk 5.000</SelectItem>
            <SelectItem value="10000">İlk 10.000</SelectItem>
            <SelectItem value="15000">İlk 15.000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Üniversite</Label>
        <Select
          value={(filters.university ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, university: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger><SelectValue placeholder="Popülerden seç" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Popülerden seç</SelectItem>
            {universityOptions.map((university) => <SelectItem key={university} value={university}>{university}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Uygunluk günü</Label>
        <Select
          value={(filters.availability_day ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, availability_day: v === "__all__" ? "" : v, availability_time: v === "__all__" ? "" : filters.availability_time })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Herhangi bir gün</SelectItem>
            <SelectItem value="0">Pazartesi</SelectItem><SelectItem value="1">Salı</SelectItem>
            <SelectItem value="2">Çarşamba</SelectItem><SelectItem value="3">Perşembe</SelectItem>
            <SelectItem value="4">Cuma</SelectItem><SelectItem value="5">Cumartesi</SelectItem>
            <SelectItem value="6">Pazar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Uygunluk saati</Label>
        <Select
          value={(filters.availability_time ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, availability_time: v === "__all__" ? "" : v })}
          disabled={isLoading || !filters.availability_day}
        >
          <SelectTrigger><SelectValue placeholder="Önce gün seç" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Herhangi bir saat</SelectItem>
            {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Platform durumu</Label>
        <Select
          value={(filters.online ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, online: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tümü</SelectItem>
            <SelectItem value="true">Sadece çevrim içi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sıralama</Label>
        <Select
          value={filters.ordering ?? "rating"}
          onValueChange={(v) => onFiltersChange({ ...filters, ordering: v || "rating" })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">En yüksek puan</SelectItem>
            <SelectItem value="price">En uygun fiyat</SelectItem>
            <SelectItem value="yks_rank">En iyi YKS sıralaması</SelectItem>
            <SelectItem value="newest">En yeni</SelectItem>
          </SelectContent>
        </Select>
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
}: TutorFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = countActiveFilters(filters);
  const priceValue = filtersToPriceTuple(filters.min_price, filters.max_price);

  const handleFiltersChange = useCallback(
    (newFilters: TutorFiltersType) => {
      onFiltersChange({ ...newFilters, ordering: newFilters.ordering || "rating" });
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
        />
      </div>

      {/* Mobile/tablet: bottom-sheet trigger */}
      <div className="lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
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
                showClearButton={false}
              />
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
