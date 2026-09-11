"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type OtpStatus = "idle" | "error" | "success";
export type OtpInputHandle = { clear: () => void; focus: () => void };
export type OtpInputProps = {
  length?: number;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  status?: OtpStatus;
  errorMessage?: string;
  successMessage?: string;
  hint?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
};

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  {
    length = 6,
    defaultValue = "",
    onChange,
    onComplete,
    status = "idle",
    errorMessage = "",
    successMessage = "",
    hint = "",
    label = "Doğrulama kodu",
    disabled = false,
    autoFocus = false,
    className,
  },
  forwardedRef
) {
  const reducedMotion = useReducedMotion();
  const statusId = useId();
  const [digits, setDigits] = useState(() =>
    Array.from({ length }, (_, index) => defaultValue.replace(/\D/g, "")[index] ?? "")
  );
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const valueRef = useRef(digits);
  valueRef.current = digits;

  const focusAt = useCallback(
    (index: number) => {
      const input = inputs.current[Math.max(0, Math.min(length - 1, index))];
      input?.focus();
      input?.select();
    },
    [length]
  );

  const commit = useCallback(
    (next: string[]) => {
      setDigits(next);
      valueRef.current = next;
      const value = next.join("");
      onChange?.(value);
      if (next.every(Boolean)) onComplete?.(value);
    },
    [onChange, onComplete]
  );

  const clear = useCallback(() => {
    commit(Array.from({ length }, () => ""));
  }, [commit, length]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      clear: () => {
        clear();
        focusAt(0);
      },
      focus: () => focusAt(0),
    }),
    [clear, focusAt]
  );

  useEffect(() => {
    if (autoFocus && !disabled) focusAt(0);
  }, [autoFocus, disabled, focusAt]);

  const fill = (start: number, raw: string) => {
    const incoming = raw.replace(/\D/g, "").slice(0, length);
    const next = [...valueRef.current];
    incoming.split("").forEach((digit, offset) => {
      if (start + offset < length) next[start + offset] = digit;
    });
    commit(next);
    focusAt(Math.min(start + incoming.length, length - 1));
  };

  const handleChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const incoming = event.currentTarget.value.replace(/\D/g, "");
    if (!incoming) {
      const next = [...valueRef.current];
      next[index] = "";
      commit(next);
      return;
    }
    fill(index, incoming);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...valueRef.current];
      if (next[index]) next[index] = "";
      else if (index > 0) {
        next[index - 1] = "";
        focusAt(index - 1);
      }
      commit(next);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const message = status === "error" ? errorMessage : status === "success" ? successMessage : hint;

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        role="group"
        aria-label={label}
        data-status={status}
        className="flex w-full justify-center gap-2 sm:gap-3"
        animate={status === "error" && !reducedMotion ? { x: [0, -6, 5, -4, 0] } : { x: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.32 }}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            aria-label={`${label}, ${index + 1}/${length}`}
            aria-invalid={status === "error" || undefined}
            aria-describedby={message ? statusId : undefined}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            inputMode="numeric"
            pattern="[0-9]*"
            value={digit}
            disabled={disabled}
            maxLength={length}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event: ClipboardEvent<HTMLInputElement>) => {
              event.preventDefault();
              const text = event.clipboardData.getData("text");
              fill(text.replace(/\D/g, "").length >= length ? 0 : index, text);
            }}
            onFocus={(event) => event.currentTarget.select()}
            className={cn(
              "h-12 min-w-0 flex-1 rounded-xl border-2 bg-background text-center font-mono text-base tabular-nums text-foreground outline-none transition-colors sm:h-14 sm:max-w-12",
              status === "error"
                ? "border-destructive"
                : status === "success"
                  ? "border-emerald-500"
                  : "border-border focus:border-primary"
            )}
          />
        ))}
      </motion.div>
      {message && (
        <p
          id={statusId}
          role="status"
          className={cn(
            "mt-2 text-sm",
            status === "error"
              ? "text-destructive"
              : status === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
});

export default OtpInput;
