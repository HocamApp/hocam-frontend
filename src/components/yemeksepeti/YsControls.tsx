"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function YsChoice({
  type,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="ys-choice" data-checked={checked}>
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={cn(
          "ys-choice__box",
          type === "radio" ? "ys-choice__box--radio" : "ys-choice__box--checkbox",
        )}
        aria-hidden
      >
        {type === "checkbox" && checked ? (
          <Check className="absolute inset-0 m-auto h-3 w-3 text-white" strokeWidth={3} />
        ) : null}
      </span>
      <span>{children}</span>
    </label>
  );
}

export function YsPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="ys-pill" data-selected={selected} onClick={onClick}>
      {children}
    </button>
  );
}

export function YsTag({
  variant,
  icon,
  children,
}: {
  variant: "sponsored" | "deal" | "new";
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={`ys-tag ys-tag--${variant}`}>
      {icon}
      {children}
    </span>
  );
}

export function YsSectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-4 text-2xl font-bold leading-[1.333]">
      {children}
    </h2>
  );
}
