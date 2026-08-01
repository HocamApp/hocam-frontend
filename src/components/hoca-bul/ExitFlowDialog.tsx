"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Leaving is not destructive — the draft is already saved — so the dialog says
 * so instead of warning about losing work. Radix supplies the focus trap,
 * Escape handling and focus restoration.
 */
export function ExitFlowDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eşleşmeden çıkmak istiyor musun?</DialogTitle>
          <DialogDescription>
            Yanıtların kayıtlı kalacak, istediğin zaman kaldığın yerden devam
            edebilirsin.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Devam et
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-xl"
            onClick={onConfirm}
          >
            Çık
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
