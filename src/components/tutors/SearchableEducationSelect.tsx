"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const normalizeSearch = (value: string) =>
  value.toLocaleLowerCase("tr-TR").trim();

export function filterEducationOptions(options: string[], query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return options;
  return options.filter((option) =>
    normalizeSearch(option).includes(normalizedQuery)
  );
}

interface SearchableEducationSelectProps {
  value: string;
  options: string[];
  placeholder: string;
  searchPlaceholder: string;
  customLabel: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function SearchableEducationSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  customLabel,
  disabled,
  onChange,
}: SearchableEducationSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(
    () => filterEducationOptions(options, query).slice(0, 80),
    [options, query]
  );
  const trimmedQuery = query.trim();
  const exactMatch = options.some(
    (option) => normalizeSearch(option) === normalizeSearch(trimmedQuery)
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
        <div role="listbox" className="max-h-64 space-y-1 overflow-y-auto">
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
