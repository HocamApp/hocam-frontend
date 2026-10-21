"use client";

import React, { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowClockwise, ClipboardText, Plus, WarningCircle } from "@phosphor-icons/react";
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
import { TutorPrivateFrame } from "./TutorPrivateFrame";

type TutorStudentNotesProps = {
  studentId: string;
  compact?: boolean;
  /** Inside a row that already names the notes and says who sees them: no card, band or caption. */
  bare?: boolean;
};

export function TutorStudentNotes(props: TutorStudentNotesProps) {
  return <StudentNotes key={props.studentId} {...props} />;
}

/**
 * The tutor's private notes about one student. Plain class strings throughout:
 * tailwind-merge would drop a named size such as text-label next to a colour.
 */
function StudentNotes({ studentId, compact = false, bare = false }: TutorStudentNotesProps) {
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
  const scroll = compact ? " max-h-48 overflow-y-auto" : "";
  const textareaClass = "min-h-32 bg-white text-ink placeholder:text-ink-mid focus-visible:border-ink focus-visible:ring-ink";

  return (
    <TutorPrivateFrame id={formId} title="Özel notlarım" count={notesQuery.isSuccess ? `${notes.length} not` : null} bare={bare} compact={compact}>
      {checkInsQuery.isLoading ? (
        <div role="status" aria-label="Ders sonu kayıtları yükleniyor" aria-busy="true"><Skeleton className="h-24 w-full" /></div>
      ) : checkInsQuery.isError ? (
        <div className="space-y-3 rounded-input border border-error p-3" role="alert">
          <p className="flex items-center gap-2 text-small text-error"><WarningCircle size={20} aria-hidden="true" />Ders sonu kayıtları yüklenemedi.</p>
          <Button size="sm" variant="outline" aria-label="Ders sonu kayıtlarını yeniden yükle" disabled={checkInsQuery.isFetching} onClick={() => checkInsQuery.refetch()}>
            <ArrowClockwise size={20} className="mr-2" aria-hidden="true" />Yeniden dene
          </Button>
        </div>
      ) : checkIns.length > 0 ? (
        <ul className={`space-y-3${scroll}`}>
          {checkIns.map((checkIn) => (
            <li key={checkIn.id} className="rounded-input bg-paper p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-label font-medium text-ink">
                  <ClipboardText size={16} aria-hidden="true" />Ders sonu kaydı · Eğitmen gözlemi
                </span>
                <span className="text-label tabular-nums text-ink-mid">{formatDate(checkIn.updated_at)}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-body text-ink">{checkIn.rendered_note}</p>
              {checkIn.revision_count > 0 && (
                <p className="mt-2 text-label tabular-nums text-ink-mid">{checkIn.revision_count} düzeltme geçmişi korunuyor.</p>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {notesQuery.isLoading ? (
        <div role="status" aria-label="Özel notlar yükleniyor" aria-busy="true"><Skeleton className="h-24 w-full" /></div>
      ) : notesQuery.isError ? (
        <div className="space-y-3 rounded-input border border-error p-3" role="alert">
          <p className="flex items-center gap-2 text-small text-error"><WarningCircle size={20} aria-hidden="true" />Özel notlar yüklenemedi.</p>
          <Button size="sm" variant="outline" aria-label="Özel notları yeniden yükle" disabled={notesQuery.isFetching} onClick={() => notesQuery.refetch()}>
            <ArrowClockwise size={20} className="mr-2" aria-hidden="true" />Yeniden dene
          </Button>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-body text-ink-mid">Bu öğrenci için henüz notun yok. İlk notunu aşağıdan ekleyebilirsin.</p>
      ) : (
        <ul className={`divide-y divide-line${scroll}`}>
          {notes.map((note) => (
            <li key={note.id} className="py-4 first:pt-0 last:pb-0">
              {editingId === note.id ? (
                <div className="space-y-3">
                  <label htmlFor={`${formId}-edit`} className="block text-label font-medium text-ink">Notu düzenle</label>
                  <Textarea id={`${formId}-edit`} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} maxLength={1000} className={textareaClass} disabled={isPending} aria-describedby={`${formId}-edit-count`} />
                  <p id={`${formId}-edit-count`} className="text-label tabular-nums text-ink-mid">{editingContent.length}/1000 karakter</p>
                  <SensitiveDataGuidance className="text-ink-mid" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="gold" className="min-h-11" onClick={() => updateMutation.mutate({ id: note.id, content: editingContent.trim() })} disabled={!editingContent.trim() || isPending}>{updateMutation.isPending ? "Kaydediliyor" : "Kaydet"}</Button>
                    <Button size="sm" variant="ghost" className="min-h-11" onClick={() => setEditingId(null)} disabled={isPending}>Vazgeç</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap break-words text-body text-ink">{note.content}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <span className="text-label tabular-nums text-ink-mid">{formatDate(note.created_at)}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="gold" className="min-h-11" aria-label="Notu düzenle" disabled={isPending} onClick={() => { setEditingId(note.id); setEditingContent(note.content); }}>Düzenle</Button>
                      <Button size="sm" variant="destructive" className="min-h-11" aria-label="Notu sil" disabled={isPending} onClick={() => deleteMutation.mutate(note.id)}>Sil</Button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-3 border-t border-line pt-4">
        <label htmlFor={`${formId}-draft`} className="block text-label font-medium text-ink">Yeni özel not</label>
        <Textarea id={`${formId}-draft`} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={"Son derste çalıştıklarımız\nTekrar edilmesi gerekenler\nBir sonraki ders"} className={textareaClass} disabled={isPending} aria-describedby={`${formId}-count`} />
        <p id={`${formId}-count`} className="text-label tabular-nums text-ink-mid">{draft.length}/1000 karakter</p>
        <SensitiveDataGuidance className="text-ink-mid" />
        <Button size="sm" variant="gold" className="min-h-11" onClick={() => createMutation.mutate({ student: studentId, content: draft.trim() })} disabled={!draft.trim() || isPending}><Plus size={20} className="mr-2" aria-hidden="true" />{createMutation.isPending ? "Ekleniyor" : "Not ekle"}</Button>
      </div>
    </TutorPrivateFrame>
  );
}
