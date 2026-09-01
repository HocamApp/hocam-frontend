"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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
import { dativeName } from "@/lib/turkishSuffix";

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

  const tutorName = [tutor.name, tutor.surname].filter(Boolean).join(" ").trim();
  const firstName = tutor.name?.trim() || tutorName;
  const initials =
    [tutor.name, tutor.surname]
      .filter(Boolean)
      .map((part) => part!.trim().charAt(0).toLocaleUpperCase("tr-TR"))
      .join("")
      .slice(0, 2) || "H";
  const greeting = useMemo(
    () => (firstName ? `Merhaba ${firstName}, ` : "Merhaba, "),
    [firstName],
  );

  const form = useForm<MessageRequestFormValues>({
    defaultValues: {
      message: greeting,
    },
    mode: "onSubmit",
  });

  // Re-seed the greeting every time the dialog opens, so a cancelled draft
  // does not leave the next one starting from an empty box.
  useEffect(() => {
    if (isOpen) form.reset({ message: greeting });
  }, [isOpen, greeting, form]);

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
      form.reset({ message: greeting });
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
      form.reset({ message: greeting });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 p-6 sm:max-w-[420px] sm:p-8">
        {/* Face, name, one line of why. The old copy spent three sentences
            explaining what a message is, then put a four-line example in the
            placeholder — a wall of text in front of a text box people already
            know how to use. */}
        {/* Preply's shape, measured off it: a 96px portrait, ~16px to the
            name, ~8px to the line under it, then a clear gap before the box.
            The photo is square with a card radius because that is what a
            tutor's photo is everywhere else in this product — the directory
            card, the profile header. A circle here would be the only round
            one on the site. */}
        <DialogHeader className="items-center space-y-0 text-center">
          <span className="mb-4 inline-flex size-24 items-center justify-center overflow-hidden rounded-card bg-ink text-paper">
            {tutor.profile_picture ? (
              <Image
                src={tutor.profile_picture}
                alt=""
                width={192}
                height={192}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-[28px] font-semibold">{initials}</span>
            )}
          </span>
          <DialogTitle className="text-center text-[22px] leading-[1.3] tracking-[-0.01em]">
            {dativeName(firstName)} yaz
          </DialogTitle>
          <DialogDescription className="!mt-2 text-center text-body">
            Kendini tanıt, hedefini söyle, aklındaki soruyu sor.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
            {generalError && <ErrorMessage message={generalError} />}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  {/* The greeting is real text in the field, not a
                      placeholder: it is the part nobody wants to type, and
                      leaving it as a hint means it never ends up in the
                      message. The caret lands after it. */}
                  <FormLabel className="sr-only">İlk mesajın</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      maxLength={500}
                      autoFocus
                      placeholder="Mesajını buraya yaz..."
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormMessage />
                    <span className="ml-auto text-xs tabular-nums text-ink-mid">
                      {messageLength}/500
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
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
