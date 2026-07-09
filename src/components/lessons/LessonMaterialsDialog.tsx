"use client";

import { FileQuestion, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBookingArtifacts, fetchBookingQuestions } from "@/lib/lessonsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, LessonArtifactKind } from "@/types";

function artifactKindLabel(kind: LessonArtifactKind) {
  const labels: Record<LessonArtifactKind, string> = {
    whiteboard: "Whiteboard",
    solved_question: "Çözülen soru",
    material: "Materyal",
  };
  return labels[kind] ?? kind;
}

export function LessonMaterialsDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bookingId = booking?.id;
  const { data: artifacts = [], isLoading: artifactsLoading } = useQuery({
    queryKey: ["booking-artifacts", bookingId],
    queryFn: () => fetchBookingArtifacts(bookingId as string),
    enabled: open && Boolean(bookingId),
  });
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["booking-questions", bookingId],
    queryFn: () => fetchBookingQuestions(bookingId as string),
    enabled: open && Boolean(bookingId),
  });
  const isLoading = artifactsLoading || questionsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ders Materyalleri</DialogTitle>
          <DialogDescription>
            {booking
              ? `${booking.subject.name} dersinden kalan whiteboard, soru ve çalışma dosyaları.`
              : "Ders materyalleri"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Paylaşılan materyaller</h3>
              </div>
              {artifacts.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                  Bu derse henüz materyal eklenmemiş. Whiteboard veya çözülen sorular
                  eklendiğinde burada açılıp indirilebilecek.
                </div>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((artifact) => {
                    const href = artifact.file_url || artifact.external_url;
                    return (
                      <div
                        key={artifact.id}
                        className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{artifact.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {artifactKindLabel(artifact.kind)}
                          </p>
                          {artifact.description && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              {artifact.description}
                            </p>
                          )}
                        </div>
                        {href && (
                          <Button asChild size="sm" variant="outline">
                            <a href={href} target="_blank" rel="noreferrer">
                              Aç / İndir
                            </a>
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Soru altyapısı</h3>
              </div>
              {questions.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Çözülebilir soru altyapısı hazır. İleride bu derste çözülen sorular,
                  yanlış havuzu ve tekrar çalışmaları buradan büyüyecek.
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-4">
                      <p className="text-sm font-medium">{item.question.prompt}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Zorluk: {item.question.difficulty}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
