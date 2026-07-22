"use client";

import { useRef, type RefObject } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SolvableQuestion } from "@/types";

interface LessonQuestionInvitationDialogProps {
  open: boolean;
  question: SolvableQuestion | null;
  returnFocusRef: RefObject<HTMLButtonElement>;
  onAccept: () => void;
  onDismiss: () => void;
}

export function LessonQuestionInvitationDialog({
  open,
  question,
  returnFocusRef,
  onAccept,
  onDismiss,
}: LessonQuestionInvitationDialogProps) {
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  if (!question) return null;

  const details = [
    `${question.exam_type} ${question.exam_year}`,
    question.subject?.name,
    question.topic?.title,
    question.original_question_number
      ? `Soru ${question.original_question_number}`
      : null,
  ].filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      <DialogContent
        showClose={false}
        className="w-[calc(100dvw-2rem)] max-w-md rounded-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          primaryActionRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus();
        }}
      >
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileQuestion className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>Hocan bir soru paylaştı</DialogTitle>
          <DialogDescription>
            {details.join(" · ")}. Soruyu canlı ders ekranında birlikte inceleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        <p className="line-clamp-3 whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm leading-6 text-foreground">
          {question.prompt}
        </p>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button type="button" variant="outline" onClick={onDismiss}>
            Daha sonra
          </Button>
          <Button ref={primaryActionRef} type="button" onClick={onAccept}>
            Soruyu aç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
