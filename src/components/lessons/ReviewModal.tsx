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
import { REVIEW_CRITERIA } from "@/lib/reviewCriteria";
import { formatRating } from "@/lib/utils";
import { Booking } from "@/types";

const criterionSchema = z
  .number()
  .min(1, "Lütfen tüm değerlendirme başlıklarını puanla.")
  .max(5);

const reviewSchema = z.object({
  clarity_rating: criterionSchema,
  preparation_rating: criterionSchema,
  progress_rating: criterionSchema,
  confidence_rating: criterionSchema,
  comment: z
    .string()
    .max(800, "Yorum en fazla 800 karakter olabilir")
    .optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const EMPTY_FORM: ReviewFormValues = {
  clarity_rating: 0,
  preparation_rating: 0,
  progress_rating: 0,
  confidence_rating: 0,
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
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-2xl leading-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          aria-label={`${star} yıldız`}
        >
          <span
            className={
              star <= value ? "text-amber-500" : "text-muted-foreground/50"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
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
  const criteriaValues = form.watch([
    "clarity_rating",
    "preparation_rating",
    "progress_rating",
    "confidence_rating",
  ]);
  const allRated = criteriaValues.every((value) => value >= 1);
  const computedRating = allRated
    ? criteriaValues.reduce((sum, value) => sum + value, 0) / 4
    : null;

  const onSubmit = async (data: ReviewFormValues) => {
    setSubmitError(null);
    const parsed = reviewSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      REVIEW_CRITERIA.forEach(({ field }) => {
        if (err.fieldErrors[field]) {
          form.setError(field, {
            message: "Lütfen tüm değerlendirme başlıklarını puanla.",
          });
        }
      });
      if (err.fieldErrors.comment)
        form.setError("comment", { message: err.fieldErrors.comment[0] });
      return;
    }

    try {
      await createReview({
        booking: booking.id,
        clarity_rating: parsed.data.clarity_rating,
        preparation_rating: parsed.data.preparation_rating,
        progress_rating: parsed.data.progress_rating,
        confidence_rating: parsed.data.confidence_rating,
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
        <DialogHeader>
          <DialogTitle>Dersi değerlendir</DialogTitle>
          <DialogDescription>
            {booking.subject.name} · Bu değerlendirme hocanın profilindeki ders
            ve kriter puanlarına yansır.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {REVIEW_CRITERIA.map(({ field: fieldName, label, question }) => (
              <FormField
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <p className="text-xs text-muted-foreground">{question}</p>
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
            ))}

            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm font-medium">
                {computedRating !== null
                  ? `Bu ders için hesaplanan puan: ${formatRating(computedRating)} / 5`
                  : "Bu ders için hesaplanan puan: — / 5"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ders puanı, dört kriterin ortalamasıyla otomatik hesaplanır.
              </p>
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
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Gönderiliyor..."
                : "Değerlendirmeyi gönder"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
