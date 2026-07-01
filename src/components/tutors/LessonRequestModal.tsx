"use client";

import { useState, useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import { TutorProfile, LessonRequest } from "@/types";
import { createLessonRequest } from "@/lib/lessonsApi";
import { ApiError } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

const LESSON_REQUEST_NONE = "__none__";

const lessonRequestSchema = z.object({
  subject: z.string().min(1, "Lütfen bir ders seçin"),
  message: z
    .string()
    .min(20, "Mesajınız en az 20 karakter olmalıdır")
    .max(500, "Mesajınız en fazla 500 karakter olabilir"),
});

type LessonRequestFormValues = z.infer<typeof lessonRequestSchema>;

type LearningContextQuery = {
  learning_goal_id: string;
  learning_milestone_id: string;
  learning_topic_id?: string | null;
};

interface LessonRequestModalProps {
  tutor: TutorProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lessonRequest: LessonRequest) => void;
  learningContext?: LearningContextQuery | null;
}

export function LessonRequestModal({
  tutor,
  isOpen,
  onClose,
  onSuccess,
  learningContext,
}: LessonRequestModalProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const subjectSelectId = useId();

  const form = useForm<LessonRequestFormValues>({
    defaultValues: {
      subject: "",
      message: "",
    },
    mode: "onSubmit",
  });

  const messageLength = form.watch("message")?.length ?? 0;

  const onSubmit = async (data: LessonRequestFormValues) => {
    setGeneralError(null);
    if (data.subject === LESSON_REQUEST_NONE || !data.subject) {
      form.setError("subject", { message: "Lütfen bir ders seçin" });
      return;
    }
    const parsed = lessonRequestSchema.safeParse(data);
    if (!parsed.success) {
      const err = parsed.error.flatten();
      if (err.fieldErrors.subject) form.setError("subject", { message: err.fieldErrors.subject[0] });
      if (err.fieldErrors.message) form.setError("message", { message: err.fieldErrors.message[0] });
      return;
    }

    const subjectId = parsed.data.subject && String(parsed.data.subject).trim();
    if (!subjectId || subjectId === LESSON_REQUEST_NONE) {
      form.setError("subject", { message: "Lütfen bir ders seçin" });
      return;
    }
    try {
      const result = await createLessonRequest({
        tutor: String(tutor.id),
        subject: subjectId,
        message: parsed.data.message,
        ...(learningContext
          ? {
              learning_goal_id: learningContext.learning_goal_id,
              learning_milestone_id: learningContext.learning_milestone_id,
              ...(learningContext.learning_topic_id
                ? { learning_topic_id: learningContext.learning_topic_id }
                : {}),
            }
          : {}),
      });
      onSuccess(result);
      onClose();
      form.reset();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400 && err.response?.data) {
        const body = err.response.data as ApiError;
        if (body.subject) form.setError("subject", { message: body.subject[0] });
        if (body.message) form.setError("message", { message: body.message[0] });
        const otherKeys = Object.keys(body).filter((k) => !["subject", "message"].includes(k));
        if (otherKeys.length > 0) {
          setGeneralError(
            otherKeys.map((k) => (body as Record<string, string[]>)[k].join(" ")).join(" ")
          );
        } else {
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
            Hocaya kendini tanıt, hangi derste yardım istediğini ve beklentilerini yaz.
            Mesajın gönderildiğinde mesajlaşma konuşması hemen açılır.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {generalError && <ErrorMessage message={generalError} />}
            {learningContext && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                Bu mesaj isteği öğrenme hedefinle ilişkilendirilecek.
              </div>
            )}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => {
                const rawValue = field.value;
                const selectValue = rawValue && String(rawValue).trim() !== "" ? String(rawValue) : LESSON_REQUEST_NONE;
                return (
                  <FormItem>
                    <FormLabel htmlFor={subjectSelectId}>Ders</FormLabel>
                    <Select
                      value={selectValue}
                      onValueChange={(v) => {
                        const next = v === LESSON_REQUEST_NONE ? "" : v;
                        field.onChange(next);
                      }}
                      disabled={form.formState.isSubmitting}
                    >
                      <SelectTrigger id={subjectSelectId}>
                        <SelectValue placeholder="Ders seçin" />
                      </SelectTrigger>
                      <SelectContent className="z-[100]" position="popper">
                        <SelectItem value={LESSON_REQUEST_NONE}>Ders seçin</SelectItem>
                        {(tutor.subjects ?? [])
                          .filter((s): s is typeof s & { id: string } => s != null && s.id != null)
                          .map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name} ({s.exam_type})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlk mesajın</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Merhaba hocam, YKS'ye hazırlanıyorum ve ... konusunda yardıma ihtiyacım var. Kısaca kendimden ve beklentilerimden bahsediyorum..."
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
