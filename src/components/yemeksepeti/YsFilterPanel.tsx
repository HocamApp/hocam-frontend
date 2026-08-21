"use client";

import { Search, Zap } from "lucide-react";
import {
  BUDGET_FILTERS,
  CUISINE_FILTERS,
  MIN_BASKET_MAX,
  PAYMENT_FILTERS,
  QUICK_FILTERS,
  SORT_OPTIONS,
} from "@/lib/yemeksepetiMock";
import { YsChoice, YsPill } from "./YsControls";

export type FilterState = {
  sort: string;
  quick: string[];
  cuisines: string[];
  payment: string;
  minBasket: number;
  budgets: string[];
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  cuisineQuery: string;
  onCuisineQueryChange: (value: string) => void;
};

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function SectionHeading({ children }: { children: string }) {
  return <h3 className="mb-2 mt-6 text-sm font-semibold">{children}</h3>;
}

export function YsFilterPanel({ value, onChange, cuisineQuery, onCuisineQueryChange }: Props) {
  const visibleCuisines = CUISINE_FILTERS.filter((cuisine) =>
    cuisine.label.toLocaleLowerCase("tr").includes(cuisineQuery.toLocaleLowerCase("tr")),
  );

  return (
    <aside className="w-[260px] shrink-0 pb-8 pt-6">
      <h2 className="text-lg font-bold leading-[1.555]">Filtrele</h2>

      <SectionHeading>Sıralama</SectionHeading>
      <ul>
        {SORT_OPTIONS.map((option) => (
          <li key={option.id}>
            <YsChoice
              type="radio"
              checked={value.sort === option.id}
              onChange={() => onChange({ ...value, sort: option.id })}
            >
              {option.label}
            </YsChoice>
          </li>
        ))}
      </ul>

      <SectionHeading>Hızlı filtreler</SectionHeading>
      <ul className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => (
          <li key={filter.id}>
            <YsPill
              selected={value.quick.includes(filter.id)}
              onClick={() => onChange({ ...value, quick: toggle(value.quick, filter.id) })}
            >
              <Zap className="h-3.5 w-3.5" />
              {filter.label}
            </YsPill>
          </li>
        ))}
      </ul>

      <SectionHeading>Mutfak</SectionHeading>
      <div className="ys-search ys-search--small mb-2">
        <Search className="h-4 w-4 shrink-0" />
        <input
          type="search"
          value={cuisineQuery}
          onChange={(event) => onCuisineQueryChange(event.target.value)}
          placeholder="Mutfak arayın"
          aria-label="Ara"
        />
      </div>
      <ul>
        {visibleCuisines.map((cuisine) => (
          <li key={cuisine.id}>
            <YsChoice
              type="checkbox"
              checked={value.cuisines.includes(cuisine.label)}
              onChange={() =>
                onChange({ ...value, cuisines: toggle(value.cuisines, cuisine.label) })
              }
            >
              {cuisine.label}
            </YsChoice>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 text-sm font-semibold underline"
        style={{ color: "var(--ys-neutral-primary)" }}
      >
        Daha fazla göster
      </button>

      <SectionHeading>ÖDEME SEÇENEKLERİ</SectionHeading>
      <ul>
        {PAYMENT_FILTERS.map((option) => (
          <li key={option.id || "all"}>
            <YsChoice
              type="radio"
              checked={value.payment === option.id}
              onChange={() => onChange({ ...value, payment: option.id })}
            >
              {option.label}
            </YsChoice>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-2 text-sm font-semibold underline"
        style={{ color: "var(--ys-neutral-primary)" }}
      >
        Daha fazla göster
      </button>

      <SectionHeading>Minimum Sepet Tutarı</SectionHeading>
      <input
        type="range"
        min={0}
        max={MIN_BASKET_MAX}
        step={50}
        value={value.minBasket}
        onChange={(event) => onChange({ ...value, minBasket: Number(event.target.value) })}
        aria-label="Minimum sepet tutarı"
        className="w-full accent-[var(--ys-interaction-primary)]"
      />
      <div className="flex justify-between text-xs" style={{ color: "var(--ys-neutral-secondary)" }}>
        <span>{value.minBasket} TL</span>
        <span>{value.minBasket === 0 ? "Tümü" : `${MIN_BASKET_MAX} TL`}</span>
      </div>

      <SectionHeading>Fiyat Aralığı</SectionHeading>
      <ul className="flex gap-2">
        {BUDGET_FILTERS.map((budget) => (
          <li key={budget.id}>
            <YsPill
              selected={value.budgets.includes(budget.label)}
              onClick={() => onChange({ ...value, budgets: toggle(value.budgets, budget.label) })}
            >
              {budget.label}
            </YsPill>
          </li>
        ))}
      </ul>
    </aside>
  );
}
