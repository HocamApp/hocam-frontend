"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { createReview } from "@/lib/reviewsApi";
import { formatRating } from "@/lib/utils";
import { Booking } from "@/types";

const reviewSchema = z.object({
  rating: z.number().min(1, "Lütfen derse puan ver.").max(5),
  comment: z
    .string()
    .max(800, "Yorum en fazla 800 karakter olabilir")
    .optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const EMPTY_FORM: ReviewFormValues = {
  rating: 0,
  comment: "",
};

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="text-3xl leading-none transition-transform duration-150 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          aria-label={`${star} yıldız`}
        >
          <span
            className={
              star <= active
                ? "text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.5)]"
                : "text-muted-foreground/30"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

const RATING_REACTIONS: { max: number; emoji: string; label: string }[] = [
  { max: 1.5, emoji: "😕", label: "Daha iyisini hak ediyorsun" },
  { max: 2.5, emoji: "🙂", label: "Fena değil" },
  { max: 3.5, emoji: "😊", label: "Güzel gidiyor" },
  { max: 4.5, emoji: "🤩", label: "Harika!" },
  { max: 5.01, emoji: "🎉", label: "Mükemmel ders!" },
];

function reactionFor(rating: number | null) {
  if (rating === null) return null;
  return RATING_REACTIONS.find((r) => rating <= r.max) ?? RATING_REACTIONS[RATING_REACTIONS.length - 1];
}

export function ReviewModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReviewFormValues>({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });

  const commentLength = form.watch("comment")?.length ?? 0;
  const rating = form.watch("rating");
  const reaction = reactionFor(rating >= 1 ? rating : null);

  const onSubmit = async (data: ReviewFormValues) => {
    setSubmitError(null);
    const parsed = reviewSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.rating)
        form.setError("rating", { message: err.fieldErrors.rating[0] });
      if (err.fieldErrors.comment)
        form.setError("comment", { message: err.fieldErrors.comment[0] });
      return;
    }

    try {
      await createReview({
        booking: booking.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? "",
      });
      onSuccess();
      onClose();
      form.reset(EMPTY_FORM);
    } catch {
      setSubmitError("Değerlendirme gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSubmitError(null);
      form.reset(EMPTY_FORM);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <div className="-m-6 mb-0 rounded-t-lg bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-6 py-5 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">
              Dersi değerlendir ✨
            </DialogTitle>
            <DialogDescription className="text-brand-50">
              {booking.subject.name} · Puanın ve yorumun hocanın profilindeki
              değerlendirmelere yansır.
            </DialogDescription>
          </DialogHeader>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-gradient-to-br from-brand-50/60 to-transparent p-3">
                  <FormLabel className="text-brand-800">Genel puan</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Bu dersi genel olarak nasıl değerlendirirsin?
                  </p>
                  <FormControl>
                    <StarInput
                      value={field.value || 0}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-amber-50 p-3">
              <span className="text-3xl" aria-hidden>
                {reaction?.emoji ?? "⭐"}
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  {rating >= 1
                    ? `${formatRating(rating)} / 5 — ${reaction?.label}`
                    : "Puanını seçince burada görünür"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Bu puan hocanın genel değerlendirmesine eklenir.
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Yorumun{" "}
                    <span className="font-normal text-muted-foreground">
                      (opsiyonel)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ders deneyimini birkaç cümleyle anlatabilirsin."
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {commentLength}/800
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && (
              <ErrorMessage message={submitError} />
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md transition-transform hover:scale-[1.02] hover:from-brand-600 hover:to-brand-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Gönderiliyor..."
                : "Değerlendirmeyi gönder 🚀"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
