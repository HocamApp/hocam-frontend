"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Turkish letters people routinely type without their marks, plus both i's.
 * Folding the option and the query through this is what makes "bogazici" find
 * "Boğaziçi" and "istanbul" find "İstanbul". Mirrors `fold()` in
 * Hocam_backend/apps/tutors/education_catalog.py. */
const FOLD: Record<string, string> = {
  ı: "i", İ: "i", I: "i", ğ: "g", Ğ: "g", ü: "u", Ü: "u",
  ş: "s", Ş: "s", ö: "o", Ö: "o", ç: "c", Ç: "c",
  â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

export const foldSearch = (value: string) =>
  Array.from(value ?? "")
    .map((character) => FOLD[character] ?? character)
    .join("")
    .toLowerCase()
    .trim();

/** Ranked matches: name start first, then word start, then anywhere. Without
 * ranking, typing "ege" listed every university with those letters somewhere
 * in alphabetical order and Ege Üniversitesi sat in the middle of them. */
export function filterEducationOptions(options: string[], query: string) {
  const needle = foldSearch(query);
  if (!needle) return options;
  const ranked: Array<{ option: string; rank: number }> = [];
  for (const option of options) {
    const folded = foldSearch(option);
    const index = folded.indexOf(needle);
    if (index < 0) continue;
    const rank = index === 0 ? 0 : folded[index - 1] === " " ? 1 : 2;
    ranked.push({ option, rank });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || a.option.localeCompare(b.option, "tr"))
    .map((entry) => entry.option);
}

interface SearchableEducationSelectProps {
  value: string;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  customLabel: string;
  /** Shown before anyone types; everything else is one keystroke away. */
  featuredOptions?: string[];
  /** Heading above the featured list, e.g. "Öne çıkan üniversiteler". */
  featuredLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function SearchableEducationSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  customLabel,
  featuredOptions,
  featuredLabel,
  disabled,
  onChange,
}: SearchableEducationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // With nothing typed the list opens on the featured options (the picker's
  // caller passes the 15 leading universities): an alphabetical wall of 210
  // entries, capped at 80, meant everything from "İnönü" onwards was
  // unreachable by scrolling. Typing searches the full list, uncapped.
  const trimmed = query.trim();
  const filteredOptions = useMemo(() => {
    if (!trimmed) {
      const featured = featuredOptions?.filter((option) => options.includes(option)) ?? [];
      return featured.length > 0 ? featured : options;
    }
    return filterEducationOptions(options, query);
  }, [options, featuredOptions, query, trimmed]);
  const showingFeatured = !trimmed && (featuredOptions?.length ?? 0) > 0;
  const trimmedQuery = trimmed;
  const exactMatch = options.some(
    (option) => foldSearch(option) === foldSearch(trimmedQuery)
  );

  const choose = (nextValue: string) => {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setQuery("");
    }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between px-3 font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-2">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {showingFeatured && featuredLabel && (
          <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {featuredLabel}
          </p>
        )}
        {/* scrollbar-visible: globals.css hides every scrollbar app-wide, so a
            list of 200+ entries gave no hint that it scrolls at all. */}
        <div role="listbox" className="scrollbar-visible max-h-64 space-y-1 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className="flex w-full items-center rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
              onClick={() => choose(option)}
            >
              <Check className={cn("mr-2 h-4 w-4 shrink-0", option === value ? "opacity-100" : "opacity-0")} />
              <span>{option}</span>
            </button>
          ))}
          {trimmedQuery && !exactMatch && (
            <button
              type="button"
              className="w-full rounded-md border border-dashed border-brand-300 bg-brand-50 px-3 py-2 text-left text-sm font-medium text-brand-800 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-100"
              onClick={() => choose(trimmedQuery)}
            >
              {customLabel.replace("{value}", trimmedQuery)}
            </button>
          )}
          {showingFeatured && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Listede yoksa aramak için yazmaya başla.
            </p>
          )}
          {trimmedQuery && filteredOptions.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Eşleşen sonuç yok.</p>
          )}
          {!trimmedQuery && options.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Aramak için yazmaya başla. Listede yoksa kendi bilgini ekleyebilirsin.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
