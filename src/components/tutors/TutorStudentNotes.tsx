"use client";

import React, { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowClockwise, ClipboardText, Note, PencilSimple, Plus, Trash, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  createTutorStudentNote,
  deleteTutorStudentNote,
  fetchTutorStudentNotes,
  updateTutorStudentNote,
} from "@/lib/notificationsApi";
import { formatDate } from "@/lib/utils";
import { fetchTutorLessonTopicCheckIns } from "@/lib/learningApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";

type TutorStudentNotesProps = { studentId: string; compact?: boolean };

export function TutorStudentNotes(props: TutorStudentNotesProps) {
  return <StudentNotes key={props.studentId} {...props} />;
}

function StudentNotes({ studentId, compact = false }: TutorStudentNotesProps) {
  const queryClient = useQueryClient();
  const queryKey = ["tutor-student-notes", studentId];
  const formId = useId();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const notesQuery = useQuery({
    queryKey,
    queryFn: () => fetchTutorStudentNotes(studentId),
    enabled: Boolean(studentId),
  });
  const checkInsQuery = useQuery({
    queryKey: ["lesson-topic-check-ins", studentId],
    queryFn: () => fetchTutorLessonTopicCheckIns(studentId),
    enabled: Boolean(studentId),
  });
  const notes = notesQuery.data ?? [];
  const checkIns = checkInsQuery.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const createMutation = useMutation({
    mutationFn: createTutorStudentNote,
    onSuccess: () => { setDraft(""); refresh(); toast.success("Not eklendi."); },
    onError: () => toast.error("Not eklenemedi. Yazdıklarını koruduk, yeniden dene."),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateTutorStudentNote(id, content),
    onSuccess: () => { setEditingId(null); refresh(); toast.success("Not güncellendi."); },
    onError: () => toast.error("Not güncellenemedi. Yazdıklarını koruduk, yeniden dene."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTutorStudentNote,
    onSuccess: () => { refresh(); toast.success("Not silindi."); },
    onError: () => toast.error("Not silinemedi. Yeniden dene."),
  });
  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const listClass = compact ? "max-h-48 space-y-3 overflow-y-auto" : "space-y-3";
  const textareaClass = "min-h-32 bg-white text-ink placeholder:text-ink-mid focus-visible:border-ink focus-visible:ring-ink";

  return (
    <section className="space-y-4 rounded-card border border-line bg-white p-4 text-ink sm:p-6" aria-labelledby={`${formId}-title`}>
      <div className="flex items-center gap-3">
        <Note size={24} aria-hidden="true" className="shrink-0" />
        <div>
          <h3 id={`${formId}-title`} className="text-base font-medium">Özel Notlarım</h3>
          <p className="text-xs text-ink-mid">Yalnızca sana görünür; öğrenciyle paylaşılmaz.</p>
        </div>
      </div>
      {checkInsQuery.isLoading ? (
        <div role="status" aria-label="Ders sonu kayıtları yükleniyor" aria-busy="true"><Skeleton className="h-24 w-full" /></div>
      ) : checkInsQuery.isError ? (
        <div className="rounded-input border border-error p-3" role="alert">
          <p className="flex items-center gap-2 text-sm text-error"><WarningCircle size={20} aria-hidden="true" />Ders sonu kayıtları yüklenemedi.</p>
          <Button size="sm" variant="outline" className="mt-3" aria-label="Ders sonu kayıtlarını yeniden yükle" disabled={checkInsQuery.isFetching} onClick={() => checkInsQuery.refetch()}>
            <ArrowClockwise size={20} className="mr-2" aria-hidden="true" />Yeniden dene
          </Button>
        </div>
      ) : checkIns.length > 0 ? (
        <div className={listClass}>
          {checkIns.map((checkIn) => (
            <article key={checkIn.id} className="rounded-input border border-line bg-paper p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-medium">
                  <ClipboardText size={16} aria-hidden="true" />Ders sonu kaydı · Eğitmen gözlemi
                </span>
                <span className="text-xs tabular-nums text-ink-mid">{formatDate(checkIn.updated_at)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{checkIn.rendered_note}</p>
              {checkIn.revision_count > 0 && (
                <p className="mt-2 text-xs tabular-nums text-ink-mid">{checkIn.revision_count} düzeltme geçmişi korunuyor.</p>
              )}
            </article>
          ))}
        </div>
      ) : null}
      {notesQuery.isLoading ? (
        <div role="status" aria-label="Özel notlar yükleniyor" aria-busy="true"><Skeleton className="h-24 w-full" /></div>
      ) : notesQuery.isError ? (
        <div className="rounded-input border border-error p-3" role="alert">
          <p className="flex items-center gap-2 text-sm text-error"><WarningCircle size={20} aria-hidden="true" />Özel notlar yüklenemedi.</p>
          <Button size="sm" variant="outline" className="mt-3" aria-label="Özel notları yeniden yükle" disabled={notesQuery.isFetching} onClick={() => notesQuery.refetch()}>
            <ArrowClockwise size={20} className="mr-2" aria-hidden="true" />Yeniden dene
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <p className="rounded-input border border-dashed border-line bg-paper p-4 text-sm text-ink-mid">Bu öğrenci için henüz notun yok. İlk notunu aşağıdan ekleyebilirsin.</p>
      ) : (
        <div className={listClass}>
          {notes.map((note) => (
            <article key={note.id} className="rounded-input border border-line p-3">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <label htmlFor={`${formId}-edit`} className="block text-[13px] font-medium">Notu düzenle</label>
                  <Textarea id={`${formId}-edit`} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} maxLength={1000} className={textareaClass} disabled={isPending} aria-describedby={`${formId}-edit-count`} />
                  <p id={`${formId}-edit-count`} className="text-xs tabular-nums text-ink-mid">{editingContent.length}/1000 karakter</p>
                  <SensitiveDataGuidance className="text-ink-mid" />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="gold" onClick={() => updateMutation.mutate({ id: note.id, content: editingContent.trim() })} disabled={!editingContent.trim() || isPending}>{updateMutation.isPending ? "Kaydediliyor" : "Kaydet"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} disabled={isPending}>Vazgeç</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{note.content}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs tabular-nums text-ink-mid">{formatDate(note.created_at)}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" className="px-3" aria-label="Notu düzenle" disabled={isPending} onClick={() => { setEditingId(note.id); setEditingContent(note.content); }}><PencilSimple size={20} className="mr-2" aria-hidden="true" />Düzenle</Button>
                      <Button size="sm" variant="ghost" className="px-3 text-error" aria-label="Notu sil" disabled={isPending} onClick={() => deleteMutation.mutate(note.id)}><Trash size={20} className="mr-2" aria-hidden="true" />Sil</Button>
                    </div>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
      <div className="space-y-3 border-t border-line pt-4">
        <label htmlFor={`${formId}-draft`} className="block text-[13px] font-medium">Yeni özel not</label>
        <Textarea id={`${formId}-draft`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={"Son derste çalıştıklarımız\nTekrar edilmesi gerekenler\nBir sonraki ders"} className={textareaClass} disabled={isPending} aria-describedby={`${formId}-count`} />
        <p id={`${formId}-count`} className="text-xs tabular-nums text-ink-mid">{draft.length}/1000 karakter</p>
        <SensitiveDataGuidance className="text-ink-mid" />
        <Button size="sm" variant="gold" onClick={() => createMutation.mutate({ student: studentId, content: draft.trim() })} disabled={!draft.trim() || isPending}><Plus size={20} className="mr-2" aria-hidden="true" />{createMutation.isPending ? "Ekleniyor" : "Not ekle"}</Button>
      </div>
    </section>
  );
}
