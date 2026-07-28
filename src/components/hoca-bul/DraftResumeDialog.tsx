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
 * Only shown for a draft that actually holds progress, so a student who merely
 * opened the flow once is never interrupted.
 *
 * Restarting clears this flow's own draft and nothing else.
 */
export function DraftResumeDialog({
  open,
  stepLabel,
  onResume,
  onRestart,
}: {
  open: boolean;
  stepLabel: string;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        // Closing without choosing would leave the flow in limbo.
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Yarım kalmış bir eşleşmen var</DialogTitle>
          <DialogDescription>
            {stepLabel} bölümünden devam edebilir ya da baştan başlayabilirsin.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 rounded-xl"
            onClick={onRestart}
          >
            Baştan başla
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-xl"
            onClick={onResume}
          >
            Kaldığın yerden devam et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
