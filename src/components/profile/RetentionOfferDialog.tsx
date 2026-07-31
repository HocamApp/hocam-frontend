"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { acceptRetentionOffer } from "@/lib/paymentsApi";

interface RetentionOfferDialogProps {
  open: boolean;
  discountPercent: number;
  validityHours: number;
  /**
   * `false` here means the dialog was closed via the X button, an outside
   * click or Escape — a neutral dismissal, NOT a rejection of the offer, so
   * no accept/reject API call may fire from this path.
   */
  onOpenChange: (open: boolean) => void;
  /** Explicit "keep deleting my account" choice — continues the deletion flow. */
  onDecline: () => void;
}

/**
 * One-time retention offer shown when an eligible student starts the account
 * deletion flow. The discount is funded by Hocam (the tutor's payout is
 * untouched), which is why this dialog deliberately avoids any destructive /
 * red styling.
 */
export function RetentionOfferDialog({
  open,
  discountPercent,
  validityHours,
  onOpenChange,
  onDecline,
}: RetentionOfferDialogProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      const result = await acceptRetentionOffer();
      toast.success(`İndiriminiz tanımlandı: ${result.promotion_code}`);
      onOpenChange(false);
      // Checkout lives under a specific tutor, so the offer lands on the
      // tutors listing where the student picks a tutor and applies the code.
      router.push("/tutors?offer=retention");
    } catch {
      toast.error("İndirim tanımlanamadı. Lütfen tekrar deneyin.");
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
            <Gift className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>Gitmeden önce size özel bir teklifimiz var</DialogTitle>
          <DialogDescription>
            Hesabınızı silmek üzeresiniz. Dilerseniz 5 derslik pakette{" "}
            <span className="font-semibold text-green-700 dark:text-green-400">
              %{discountPercent} indirim
            </span>{" "}
            tanımlayalım — indirim tamamen bizden, hocanızın kazancı etkilenmez.
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs leading-5 text-muted-foreground">
          Tek kullanımlık · {validityHours} saat geçerli · Diğer indirimlerle
          birleşmez · Bu teklif bir kez sunulur
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="h-auto flex-1 whitespace-normal bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            {accepting ? "İndirim tanımlanıyor…" : "İndirimi kullan ve devam et"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDecline}
            disabled={accepting}
            className="h-auto flex-1 whitespace-normal"
          >
            Teşekkürler, hesabımı silmek istiyorum
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
