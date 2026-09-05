"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";
import { ClassroomError } from "./TutorClassroomShared";
import { fetchTutorStudentContext, saveTutorStudentContext } from "@/lib/notificationsApi";
import type { TutorStudentContextFields } from "@/types";

const fields: Array<{ key: keyof TutorStudentContextFields; label: string; placeholder: string }> = [
  { key: "goals", label: "Hedefler", placeholder: "Öğrencinin ulaşmak istediği hedefler…" },
  { key: "difficult_topics", label: "Zorlandığı konular", placeholder: "Birlikte tekrar edeceğiniz konular…" },
  { key: "resources", label: "Kullandığı kaynaklar", placeholder: "Kitaplar, soru bankaları ve diğer kaynaklar…" },
  { key: "study_preferences", label: "Çalışma tercihleri", placeholder: "Öğrenmesini kolaylaştıran yöntemler…" },
];
const empty: TutorStudentContextFields = { goals: "", difficult_topics: "", resources: "", study_preferences: "" };

export function TutorStudentContextCard(props: { studentId: string; tutorId: string }) {
  return <ContextCard key={`${props.tutorId}:${props.studentId}`} {...props} />;
}

function ContextCard({ studentId, tutorId }: { studentId: string; tutorId: string }) {
  const client = useQueryClient();
  const queryKey = ["tutor-student-context", tutorId, studentId];
  const query = useQuery({ queryKey, queryFn: () => fetchTutorStudentContext(studentId) });
  const [draft, setDraft] = useState<TutorStudentContextFields>(empty);
  const [editing, setEditing] = useState(false);
  const mutation = useMutation({
    mutationFn: (value: TutorStudentContextFields) => saveTutorStudentContext(studentId, value),
    onSuccess: (data) => { client.setQueryData(queryKey, data); setEditing(false); toast.success("Öğrenci bilgileri kaydedildi."); },
  });
  if (query.isPending) return <section aria-label="Öğrenci bilgileri yükleniyor" className="space-y-4 rounded-card border border-line bg-surface p-6"><Skeleton className="h-6 w-48" />{fields.map(field => <Skeleton key={field.key} className="h-16 w-full" />)}</section>;
  if (query.isError) return <ClassroomError message="Öğrenci bilgileri yüklenemedi. Yeniden deneyebilirsin." onRetry={() => void query.refetch()} />;
  const data = query.data;
  return <section aria-labelledby="student-context-title" className="space-y-6 rounded-card border border-line bg-surface p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="student-context-title" className="text-h3 font-medium">Öğrenci bilgi kartı</h2><p className="mt-1 text-small text-ink-mid">Yalnızca sana görünür.</p></div>
      {!editing && <Button variant="outline" size="sm" onClick={() => { setDraft({ goals: data.goals, difficult_topics: data.difficult_topics, resources: data.resources, study_preferences: data.study_preferences }); mutation.reset(); setEditing(true); }}><PencilSimple className="mr-2 h-4 w-4" aria-hidden="true" />Düzenle</Button>}
    </div>
    {editing ? <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (!mutation.isPending) mutation.mutate(draft); }}>
      {fields.map(field => <div key={field.key} className="space-y-2"><label htmlFor={`context-${field.key}`} className="block text-small font-medium">{field.label}</label><Textarea id={`context-${field.key}`} value={draft[field.key]} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })} placeholder={field.placeholder} maxLength={1000} disabled={mutation.isPending} className="min-h-24 rounded-input border-line text-base" /><p className="text-right text-label tabular-nums text-ink-mid">{draft[field.key].length}/1.000</p></div>)}
      <SensitiveDataGuidance />
      {mutation.isError && <p role="alert" className="text-small text-destructive">Bilgiler kaydedilemedi. Yazdıkların korunuyor, yeniden deneyebilirsin.</p>}
      <div className="flex gap-3"><Button type="submit" variant="gold" disabled={mutation.isPending}>{mutation.isPending ? "Kaydediliyor…" : "Kaydet"}</Button><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => { setEditing(false); mutation.reset(); }}>Vazgeç</Button></div>
    </form> : <dl className="grid gap-6 sm:grid-cols-2">{fields.map(field => <div key={field.key} className="min-w-0"><dt className="text-small font-medium">{field.label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-small leading-6 text-ink-mid">{data[field.key] || "Henüz eklenmedi."}</dd></div>)}</dl>}
  </section>;
}
