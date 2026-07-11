"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, StickyNote, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createTutorStudentNote,
  deleteTutorStudentNote,
  fetchTutorStudentNotes,
  updateTutorStudentNote,
} from "@/lib/notificationsApi";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export function TutorStudentNotes({ studentId, compact = false }: { studentId: string; compact?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = ["tutor-student-notes", studentId];
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchTutorStudentNotes(studentId),
    enabled: Boolean(studentId),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const createMutation = useMutation({
    mutationFn: createTutorStudentNote,
    onSuccess: () => { setDraft(""); refresh(); toast.success("Not eklendi."); },
    onError: () => toast.error("Not eklenemedi."),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => updateTutorStudentNote(id, content),
    onSuccess: () => { setEditingId(null); refresh(); toast.success("Not güncellendi."); },
    onError: () => toast.error("Not güncellenemedi."),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteTutorStudentNote,
    onSuccess: () => { refresh(); toast.success("Not silindi."); },
    onError: () => toast.error("Not silinemedi."),
  });

  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary"><StickyNote className="h-4 w-4" /></span>
        <div><h3 className="text-sm font-semibold">Özel Notlarım</h3><p className="text-xs text-muted-foreground">Yalnızca sana görünür.</p></div>
      </div>
      {isLoading ? <Skeleton className="h-20 w-full" /> : notes.length === 0 ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Bu öğrenci için henüz notun yok.</p> : (
        <div className={compact ? "max-h-48 space-y-2 overflow-y-auto" : "space-y-2"}>
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg border bg-card p-3">
              {editingId === note.id ? <div className="space-y-2"><Textarea value={editingContent} onChange={(e) => setEditingContent(e.target.value)} maxLength={1000} /><div className="flex gap-2"><Button size="sm" onClick={() => updateMutation.mutate({ id: note.id, content: editingContent.trim() })} disabled={!editingContent.trim()}>Kaydet</Button><Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button></div></div> : <><p className="whitespace-pre-wrap text-sm leading-6">{note.content}</p><div className="mt-2 flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span><span className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Notu düzenle" onClick={() => { setEditingId(note.id); setEditingContent(note.content); }}><Pencil className="h-3.5 w-3.5" /></Button><Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" aria-label="Notu sil" onClick={() => deleteMutation.mutate(note.id)}><Trash2 className="h-3.5 w-3.5" /></Button></span></div></>}
            </article>
          ))}
        </div>
      )}
      <div className="space-y-2 border-t pt-3"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder="Öğrenciyle ilgili kalıcı bir not ekle…" className="min-h-20" /><Button size="sm" onClick={() => createMutation.mutate({ student: studentId, content: draft.trim() })} disabled={!draft.trim() || createMutation.isPending}><Plus className="mr-2 h-4 w-4" />Not ekle</Button></div>
    </section>
  );
}
