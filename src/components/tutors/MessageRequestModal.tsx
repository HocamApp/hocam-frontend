"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { TutorProfile, MessageRequest } from "@/types";
import { createMessageRequest } from "@/lib/messagingApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

const messageRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Lütfen bir mesaj yazın")
    .max(500, "Mesajınız en fazla 500 karakter olabilir"),
});

type MessageRequestFormValues = z.infer<typeof messageRequestSchema>;

interface MessageRequestModalProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (messageRequest: MessageRequest) => void;
}

/** Normalize a DRF error value (string or string[]) to a single displayable string. */
function firstError(value: unknown): string | null {
  if (Array.isArray(value)) return value.length ? String(value[0]) : null;
  if (typeof value === "string") return value;
  return null;
}

export function MessageRequestModal({
  tutor,
  isOpen,
  onClose,
  onSuccess,
}: MessageRequestModalProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<MessageRequestFormValues>({
    defaultValues: {
      message: "",
    },
    mode: "onSubmit",
  });

  const messageLength = form.watch("message")?.length ?? 0;

  const onSubmit = async (data: MessageRequestFormValues) => {
    setGeneralError(null);
    const parsed = messageRequestSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.message)
        form.setError("message", { message: err.fieldErrors.message[0] });
      return;
    }

    try {
      const result = await createMessageRequest({
        tutor: String(tutor.id),
        message: parsed.data.message,
      });
      onSuccess(result);
      onClose();
      form.reset();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data) {
        const body = err.response.data as Record<string, unknown>;
        // Field-level validation from the backend (message length).
        const messageError = firstError(body.message);
        if (messageError) {
          form.setError("message", { message: messageError });
        }
        // Tutor-scoped conflicts (duplicate pending, rejected retry, blocked,
        // existing conversation) and generic `detail` errors surface at the top.
        const generalKeys = Object.keys(body).filter((k) => k !== "message");
        if (generalKeys.length > 0) {
          const combined = generalKeys
            .map((k) => firstError(body[k]))
            .filter((v): v is string => Boolean(v))
            .join(" ");
          if (combined) setGeneralError(combined);
          else if (!messageError)
            setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } else if (!messageError) {
          setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
      } else {
        setGeneralError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setGeneralError(null);
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hocaya Mesaj Gönder</DialogTitle>
          <DialogDescription>
            Hocaya kendini tanıt, hedefini ve nasıl destek almak istediğini kısaca
            anlat. Mesajını gönderdiğinde konuşma hemen başlar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {generalError && <ErrorMessage message={generalError} />}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlk mesajın</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      maxLength={500}
                      placeholder="Merhaba hocam, YKS'ye hazırlanıyorum. Özellikle zorlandığım konuları ve hedeflerimi anlatmak istiyorum. Uygun olduğunuzda konuşmak isterim."
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {messageLength}/500
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                      aria-hidden
                    />
                    Gönderiliyor
                  </span>
                ) : (
                  "Mesaj Gönder"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
