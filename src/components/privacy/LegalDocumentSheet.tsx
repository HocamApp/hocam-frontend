"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { LegalDocumentPreview } from "@/components/privacy/LegalDocumentPreview";

interface LegalDocumentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Same-origin path of the published legal page to show. */
  url: string;
}

/**
 * Shows a published legal document without leaving the current form.
 *
 * Below `sm` it is a bottom sheet that uses the full width of the phone;
 * from `sm` up it is a centred dialog. Every way of closing it (X, Escape,
 * overlay, the footer button) goes through `onOpenChange`, and nothing is
 * gated on how it was closed.
 */
export function LegalDocumentSheet({
  open,
  onOpenChange,
  title,
  url,
}: LegalDocumentSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={[
            "fixed z-50 flex flex-col overflow-hidden bg-background shadow-float focus:outline-none",
            // Phone: bottom sheet
            "inset-x-0 bottom-0 h-[92dvh] max-h-[92vh] rounded-t-modal",
            "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
            // sm and up: centred dialog
            "sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[min(85dvh,760px)] sm:w-[calc(100vw-2rem)] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-modal sm:duration-200",
            "sm:data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-left-1/2 sm:data-[state=open]:slide-in-from-top-[48%]",
            "sm:data-[state=closed]:fade-out-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=closed]:slide-out-to-left-1/2 sm:data-[state=closed]:slide-out-to-top-[48%]",
          ].join(" ")}
        >
          <div className="flex shrink-0 items-center gap-3 border-b py-1.5 pl-5 pr-1.5 sm:pl-6">
            <DialogPrimitive.Title className="min-w-0 flex-1 text-base font-semibold leading-tight">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Pencereyi kapat"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <LegalDocumentPreview url={url} />
          </div>

          <div className="shrink-0 border-t px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex sm:justify-end sm:pb-4">
            <DialogPrimitive.Close className="min-h-11 w-full rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto">
              Kapat
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
