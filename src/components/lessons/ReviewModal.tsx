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
import { Booking } from "@/types";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z
    .string()
    .min(10, "Yorum en az 10 karakter olmalıdır")
    .max(1000, "Yorum en fazla 1000 karakter olabilir"),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReviewFormValues>({
    defaultValues: { rating: 0, comment: "" },
    mode: "onSubmit",
  });

  const commentLength = form.watch("comment")?.length ?? 0;

  const onSubmit = async (data: ReviewFormValues) => {
    setSubmitError(null);
    const parsed = reviewSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.rating)
        form.setError("rating", { message: "Puan seçin" });
      if (err.fieldErrors.comment)
        form.setError("comment", { message: err.fieldErrors.comment[0] });
      return;
    }

    try {
      await createReview({
        booking: booking.id,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });
      onSuccess();
      onClose();
      form.reset({ rating: 0, comment: "" });
    } catch {
      setSubmitError("Değerlendirme gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSubmitError(null);
      form.reset({ rating: 0, comment: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dersi Değerlendir</DialogTitle>
          <DialogDescription>{booking.subject.name}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Puanınız</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          className="text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                          aria-label={`${star} yıldız`}
                        >
                          <span
                            className={
                              star <= (field.value || 0)
                                ? "text-amber-500"
                                : "text-muted-foreground/50"
                            }
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yorumunuz</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ders deneyiminizi paylaşın..."
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {commentLength}/1000
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
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Gönderiliyor..." : "Değerlendirme Gönder"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
