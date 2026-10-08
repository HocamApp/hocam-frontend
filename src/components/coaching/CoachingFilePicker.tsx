"use client";

import { useId } from "react";
import { UploadSimple } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

/**
 * A file input that looks like a button and stays reachable by keyboard.
 * The input is visually hidden with `sr-only`, not `hidden`: display:none
 * takes it out of the tab order, which left keyboard users unable to upload.
 */
export function CoachingFilePicker({
  label,
  hint,
  accept,
  disabled = false,
  busy = false,
  onFile,
  className,
}: {
  label: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={id}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-input border border-dashed border-line px-4 py-2 text-body font-medium text-ink transition-colors focus-within:ring-2 focus-within:ring-pink focus-within:ring-offset-2 hover:border-ink",
          (disabled || busy) && "cursor-not-allowed opacity-60",
        )}
      >
        <UploadSimple className="h-4 w-4" aria-hidden="true" />
        {busy ? "Yükleniyor…" : label}
        <input
          id={id}
          type="file"
          className="sr-only"
          accept={accept}
          aria-describedby={hintId}
          disabled={disabled || busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            event.target.value = "";
          }}
        />
      </label>
      {hint ? (
        <p id={hintId} className="text-small text-ink-mid">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
