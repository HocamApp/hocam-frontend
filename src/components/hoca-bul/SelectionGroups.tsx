"use client";

import {
  forwardRef,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useId,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SelectionOption<Value extends string = string> {
  value: Value;
  label: string;
  detail?: string;
  disabled?: boolean;
}

export interface OptionRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  detail?: string;
  selected: boolean;
  invalid?: boolean;
}

export const OptionRow = forwardRef<HTMLButtonElement, OptionRowProps>(
  function OptionRow(
    { label, detail, selected, disabled, invalid, className, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={detail ? `${label} ${detail}` : label}
        data-selected={selected || undefined}
        data-invalid={invalid || undefined}
        className={cn(
          "group flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[border-color,background-color,color,box-shadow,transform] [transition-duration:120ms]",
          "motion-safe:active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selected
            ? "border-primary bg-primary/10 text-foreground shadow-sm"
            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent/50",
          invalid && "border-destructive",
          className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 bg-background"
          )}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-current" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold sm:text-base">{label}</span>
          {detail ? (
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </span>
      </button>
    );
  }
);

export interface OptionChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  label: string;
  detail?: string;
  selected: boolean;
  invalid?: boolean;
}

export const OptionChip = forwardRef<HTMLButtonElement, OptionChipProps>(
  function OptionChip(
    { label, detail, selected, disabled, invalid, className, ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={detail ? `${label} ${detail}` : label}
        aria-pressed={selected}
        data-invalid={invalid || undefined}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2.5 text-left text-sm font-semibold transition-[border-color,background-color,color,box-shadow,transform] [transition-duration:120ms]",
          "motion-safe:active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent/50",
          invalid && "border-destructive",
          className
        )}
        {...props}
      >
        {selected ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
        <span>
          <span className="block">{label}</span>
          {detail ? (
            <span
              className={cn(
                "mt-0.5 block text-xs font-normal",
                selected ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {detail}
            </span>
          ) : null}
        </span>
      </button>
    );
  }
);

export interface SingleSelectGroupProps<Value extends string> {
  label: string;
  options: readonly SelectionOption<Value>[];
  value?: Value;
  onValueChange: (value: Value) => void;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
}

export function SingleSelectGroup<Value extends string>({
  label,
  options,
  value,
  onValueChange,
  disabled = false,
  describedBy,
  invalid = false,
}: SingleSelectGroupProps<Value>) {
  const optionRefs = useRef(new Map<Value, HTMLButtonElement>());
  const pendingFocus = useRef<Value | undefined>(undefined);
  const enabledOptions = options.filter((option) => !disabled && !option.disabled);
  const selectedIsEnabled = enabledOptions.some((option) => option.value === value);
  const tabStop = selectedIsEnabled ? value : enabledOptions[0]?.value;

  useLayoutEffect(() => {
    const focusValue = pendingFocus.current;
    if (!focusValue) return;
    pendingFocus.current = undefined;
    optionRefs.current.get(focusValue)?.focus({ preventScroll: true });
  }, [value]);

  const selectAndFocus = (nextValue: Value) => {
    pendingFocus.current = nextValue;
    onValueChange(nextValue);
    // Re-selecting the current value does not cause a rerender, so focus now.
    optionRefs.current.get(nextValue)?.focus({ preventScroll: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, current: Value) => {
    if (disabled) return;
    const currentIndex = enabledOptions.findIndex((option) => option.value === current);
    let next: SelectionOption<Value> | undefined;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = enabledOptions[(currentIndex + 1) % enabledOptions.length];
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = enabledOptions[(currentIndex - 1 + enabledOptions.length) % enabledOptions.length];
        break;
      case "Home":
        next = enabledOptions[0];
        break;
      case "End":
        next = enabledOptions[enabledOptions.length - 1];
        break;
      case " ":
        next = enabledOptions.find((option) => option.value === current);
        break;
      default:
        return;
    }

    if (!next) return;
    event.preventDefault();
    selectAndFocus(next.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="space-y-3"
    >
      {options.map((option) => {
        const optionDisabled = disabled || Boolean(option.disabled);
        const selected = value === option.value;
        return (
          <OptionRow
            key={option.value}
            ref={(node) => {
              if (node) optionRefs.current.set(option.value, node);
              else optionRefs.current.delete(option.value);
            }}
            role="radio"
            aria-checked={selected}
            selected={selected}
            disabled={optionDisabled}
            invalid={invalid}
            tabIndex={!optionDisabled && tabStop === option.value ? 0 : -1}
            data-value={option.value}
            label={option.label}
            detail={option.detail}
            onClick={() => selectAndFocus(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          />
        );
      })}
    </div>
  );
}

export interface MultiSelectGroupProps<Value extends string> {
  label: string;
  options: readonly SelectionOption<Value>[];
  values: readonly Value[];
  onValuesChange: (values: Value[]) => void;
  maximum: number;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  limitMessage?: string;
  onToggle?: (value: Value, values: readonly Value[]) => Value[];
}

export function MultiSelectGroup<Value extends string>({
  label,
  options,
  values,
  onValuesChange,
  maximum,
  disabled = false,
  describedBy,
  invalid = false,
  limitMessage = `En fazla ${maximum} seçim yapabilirsin.`,
  onToggle,
}: MultiSelectGroupProps<Value>) {
  const [blockedValue, setBlockedValue] = useState<Value | null>(null);
  const limitHit = blockedValue !== null;
  const generatedId = useId();
  const limitId = `${generatedId}-limit`;
  const groupDescription = [describedBy, limitHit ? limitId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  useEffect(() => {
    if (
      blockedValue !== null &&
      (values.length < maximum || values.includes(blockedValue))
    ) {
      setBlockedValue(null);
    }
  }, [blockedValue, maximum, values]);

  const toggle = (value: Value) => {
    if (disabled) return;
    if (onToggle) {
      const next = onToggle(value, values);
      if (next.length > maximum) {
        setBlockedValue(value);
      } else {
        setBlockedValue(null);
        onValuesChange(next);
      }
      return;
    }
    if (values.includes(value)) {
      setBlockedValue(null);
      onValuesChange(values.filter((item) => item !== value));
      return;
    }
    if (values.length >= maximum) {
      setBlockedValue(value);
      return;
    }
    setBlockedValue(null);
    onValuesChange([...values, value]);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: Value) => {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    toggle(value);
  };

  return (
    <>
      <div
        role="group"
        aria-label={label}
        aria-describedby={groupDescription}
        className="flex flex-wrap gap-3"
      >
        {options.map((option) => (
          <OptionChip
            key={option.value}
            label={option.label}
            detail={option.detail}
            selected={values.includes(option.value)}
            disabled={disabled || option.disabled}
            invalid={invalid || blockedValue === option.value}
            onClick={() => toggle(option.value)}
            onKeyDown={(event) => handleKeyDown(event, option.value)}
          />
        ))}
      </div>
      {limitHit ? (
        <p
          id={limitId}
          role="alert"
          className="mt-3 text-sm font-medium text-destructive"
        >
          {limitMessage}
        </p>
      ) : null}
    </>
  );
}
