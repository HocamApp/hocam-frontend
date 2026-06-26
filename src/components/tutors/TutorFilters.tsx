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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { TutorFilters as TutorFiltersType } from "@/lib/tutorsApi";
import type { Subject } from "@/types";

interface TutorFiltersProps {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  isLoading: boolean;
}

function FilterPanelContent({
  filters,
  subjects,
  onFiltersChange,
  priceValue,
  onPriceCommit,
  isMobile,
  isLoading,
}: {
  filters: TutorFiltersType;
  subjects: Subject[];
  onFiltersChange: (filters: TutorFiltersType) => void;
  priceValue: [number, number];
  onPriceCommit: (value: [number, number]) => void;
  isMobile: boolean;
  isLoading: boolean;
}) {
  const hasActiveFilters =
    (filters.subject ?? "") !== "" ||
    (filters.exam_type ?? "") !== "" ||
    (filters.min_rating ?? "") !== "" ||
    (filters.min_price ?? "") !== "" ||
    (filters.max_price ?? "") !== "" ||
    (filters.is_verified ?? "") !== "" ||
    (filters.ordering ?? "rating") !== "rating";

  const handleClear = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-col gap-4">
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
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sınav</Label>
        <Select
          value={(filters.exam_type ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, exam_type: v === "__all__" ? "" : v })}
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
        <Label>Sadece onaylı hocalar</Label>
        <Select
          value={(filters.is_verified ?? "") || "__all__"}
          onValueChange={(v) => onFiltersChange({ ...filters, is_verified: v === "__all__" ? "" : v })}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tümü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tümü</SelectItem>
            <SelectItem value="true">Sadece onaylı</SelectItem>
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

      {hasActiveFilters && (
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
  isLoading,
}: TutorFiltersProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

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
      <div className="hidden w-64 shrink-0 md:block">
        <FilterPanelContent
          filters={filters}
          subjects={subjects}
          onFiltersChange={handleFiltersChange}
          priceValue={priceValue}
          onPriceCommit={onPriceCommit}
          isMobile={false}
          isLoading={isLoading}
        />
      </div>

      {/* Mobile: Sheet trigger */}
      <div className="md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtrele
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtreler</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanelContent
                filters={filters}
                subjects={subjects}
                onFiltersChange={(f) => {
                  handleFiltersChange(f);
                  setSheetOpen(false);
                }}
                priceValue={priceValue}
                onPriceCommit={onPriceCommit}
                isMobile={true}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
