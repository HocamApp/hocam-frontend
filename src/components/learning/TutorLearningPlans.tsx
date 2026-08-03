"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Map, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createTutorLearningPlan, fetchLearningTopics, fetchTutorLearningPlans, proposeTutorLearningPlan } from "@/lib/learningApi";
import type { TutorPlanMilestoneInput } from "@/types";

export function TutorLearningPlans({ studentId }: { studentId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [outcome, setOutcome] = useState("");
  const [message, setMessage] = useState("");
  const [topicId, setTopicId] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneOutcome, setMilestoneOutcome] = useState("");
  const [minimum, setMinimum] = useState("1");
  const [maximum, setMaximum] = useState("3");

  const plansQuery = useQuery({ queryKey: ["tutor-learning-plans", studentId], queryFn: () => fetchTutorLearningPlans(studentId) });
  const topicsQuery = useQuery({ queryKey: ["learning-topics"], queryFn: fetchLearningTopics, staleTime: Infinity });
  const topic = useMemo(() => topicsQuery.data?.find((item) => item.id === topicId), [topicId, topicsQuery.data]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["tutor-learning-plans", studentId] });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!topic) throw new Error("topic");
      const milestone: TutorPlanMilestoneInput = {
        topic: topic.id, title: milestoneTitle.trim(), outcome: milestoneOutcome.trim(),
        is_required: true, expected_lessons_min: Number(minimum), expected_lessons_max: Number(maximum),
        completion_rule: "tutor_observation", order: 1,
      };
      return createTutorLearningPlan({
        student: studentId, title: title.trim(), outcome: outcome.trim(), exam_type: topic.exam_type,
        subject_name: topic.subject_name, curriculum_version: `${new Date().getFullYear()} YKS`,
        estimated_lessons_min: Number(minimum), estimated_lessons_max: Number(maximum),
        proposal_message: message.trim(), milestones: [milestone],
      });
    },
    onSuccess: () => { toast.success("Plan taslağı oluşturuldu."); setOpen(false); void refresh(); },
    onError: () => toast.error("Plan taslağı oluşturulamadı."),
  });
  const proposeMutation = useMutation({
    mutationFn: proposeTutorLearningPlan,
    onSuccess: () => { toast.success("Plan öğrenciye gönderildi."); void refresh(); },
    onError: () => toast.error("Plan gönderilemedi."),
  });

  const canSave = Boolean(topic && title.trim() && outcome.trim() && milestoneTitle.trim() && milestoneOutcome.trim());
  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Map className="h-4 w-4 text-primary" /><div><h3 className="text-sm font-semibold">Öğrenme Yol Haritası</h3><p className="text-xs text-muted-foreground">Öğrencinin onaylayacağı ortak plan.</p></div></div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Plan oluştur</Button>
      </div>
      {(plansQuery.data ?? []).length === 0 ? <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Henüz ortak bir plan yok.</p> : (
        <div className="space-y-2">{plansQuery.data?.map((plan) => (
          <article key={plan.id} className="rounded-lg border bg-card p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{plan.title}</p><p className="mt-1 text-xs text-muted-foreground">{plan.milestones.length} aşama · {plan.status === "draft" ? "Taslak" : plan.status === "proposed" ? "Öğrenci onayı bekleniyor" : plan.status === "active" ? "Aktif" : plan.status}</p></div>{plan.status === "draft" && <Button size="sm" onClick={() => proposeMutation.mutate(plan.id)} disabled={proposeMutation.isPending}><Send className="mr-1.5 h-3.5 w-3.5" />Öner</Button>}</div></article>
        ))}</div>
      )}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>Yeni öğrenme planı</DialogTitle><DialogDescription>İlk aşamayı oluştur. Öğrenci kabul etmeden plan aktif olmaz.</DialogDescription></DialogHeader><div className="space-y-4">
        <div className="space-y-2"><Label>Plan adı</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="TYT Matematik Temelleri" /></div>
        <div className="space-y-2"><Label>Öğrencinin ulaşacağı sonuç</Label><Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} /></div>
        <div className="space-y-2"><Label>İlk konu</Label><Select value={topicId} onValueChange={setTopicId}><SelectTrigger><SelectValue placeholder="İncelenmiş konu seç" /></SelectTrigger><SelectContent>{topicsQuery.data?.map((item) => <SelectItem key={item.id} value={item.id}>{item.exam_type} · {item.subject_name} · {item.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Aşama adı</Label><Input value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} /></div><div className="space-y-2"><Label>Aşama sonucu</Label><Input value={milestoneOutcome} onChange={(e) => setMilestoneOutcome(e.target.value)} /></div></div>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>En az ders</Label><Input type="number" min={1} max={50} value={minimum} onChange={(e) => setMinimum(e.target.value)} /></div><div className="space-y-2"><Label>En fazla ders</Label><Input type="number" min={1} max={50} value={maximum} onChange={(e) => setMaximum(e.target.value)} /></div></div>
        <div className="space-y-2"><Label>Öğrenciye mesaj</Label><Textarea value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button><Button onClick={() => createMutation.mutate()} disabled={!canSave || createMutation.isPending}>Taslağı Kaydet</Button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}
