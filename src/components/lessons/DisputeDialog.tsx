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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { disputeBooking, type DisputeCategory } from "@/lib/lessonsApi";
import type { Booking } from "@/types";

const CATEGORY_OPTIONS: { value: DisputeCategory; label: string }[] = [
  { value: "technical_issue", label: "Teknik sorun" },
  { value: "tutor_no_show", label: "Hoca derse gelmedi" },
  { value: "interrupted", label: "Ders yarıda kesildi" },
  { value: "conduct", label: "Davranış şikayeti" },
];

const disputeSchema = z.object({
  category: z.enum([
    "technical_issue",
    "tutor_no_show",
    "interrupted",
    "conduct",
  ]),
  description: z
    .string()
    .min(10, "Lütfen sorunu en az birkaç cümleyle anlat.")
    .max(1000, "Açıklama en fazla 1000 karakter olabilir."),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

const EMPTY_FORM: Partial<DisputeFormValues> = {
  category: undefined,
  description: "",
};

interface DisputeDialogProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: DisputeDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<Partial<DisputeFormValues>>({
    defaultValues: EMPTY_FORM,
    mode: "onSubmit",
  });

  const descriptionLength = form.watch("description")?.length ?? 0;

  const onSubmit = async (data: Partial<DisputeFormValues>) => {
    setSubmitError(null);
    const parsed = disputeSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.category)
        form.setError("category", { message: "Lütfen bir kategori seç." });
      if (err.fieldErrors.description)
        form.setError("description", { message: err.fieldErrors.description[0] });
      return;
    }

    try {
      await disputeBooking(booking.id, parsed.data);
      onSuccess();
      onClose();
      form.reset(EMPTY_FORM);
    } catch {
      setSubmitError("İtiraz gönderilemedi. Lütfen tekrar deneyin.");
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
          <DialogTitle>Sorun bildir</DialogTitle>
          <DialogDescription>
            {booking.subject.name} dersiyle ilgili yaşadığın sorunu bildir. Bildirim
            admin tarafından incelenecek.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Bir kategori seç" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ne oldu? Mümkün olduğunca detaylı anlat."
                      rows={4}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {descriptionLength}/1000
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError && <ErrorMessage message={submitError} />}

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Gönderiliyor..." : "İtirazı gönder"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
