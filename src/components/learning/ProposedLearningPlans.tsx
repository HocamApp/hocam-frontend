"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Map } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { respondToLearningPlan } from "@/lib/learningApi";
import type { StudentGoal } from "@/types";

export function ProposedLearningPlans({ goals }: { goals: StudentGoal[] }) {
  const queryClient = useQueryClient();
  const proposed = goals.filter((goal) => goal.status === "proposed");
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "accept" | "request_correction"; reason?: string }) => respondToLearningPlan(id, { action, reason }),
    onSuccess: (_data, variables) => { toast.success(variables.action === "accept" ? "Plan kabul edildi." : "Düzeltme talebin gönderildi."); setCorrectionId(null); setReason(""); void queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] }); },
    onError: () => toast.error("Plan yanıtı kaydedilemedi."),
  });
  if (proposed.length === 0) return null;
  return <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><Map className="h-5 w-5 text-primary" /><div><h2 className="font-semibold">Eğitmenin bir yol haritası önerdi</h2><p className="text-sm text-muted-foreground">Plan ancak sen kabul edersen aktif olur.</p></div></div><div className="space-y-3">{proposed.map((goal) => <article key={goal.id} className="rounded-xl border bg-card p-4"><h3 className="font-medium">{goal.title}</h3><p className="mt-1 text-sm text-muted-foreground">{goal.outcome}</p><ol className="mt-3 space-y-1 text-sm">{goal.milestones.map((item, index) => <li key={item.id}>{index + 1}. {item.title} — {item.outcome}</li>)}</ol>{goal.proposal_message && <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{goal.proposal_message}</p>}{correctionId === goal.id ? <div className="mt-3 space-y-2"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Neyin değişmesini istediğini yaz…" maxLength={500} /><div className="flex gap-2"><Button size="sm" onClick={() => mutation.mutate({ id: goal.id, action: "request_correction", reason: reason.trim() })} disabled={!reason.trim() || mutation.isPending}>Talebi gönder</Button><Button size="sm" variant="ghost" onClick={() => setCorrectionId(null)}>Vazgeç</Button></div></div> : <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => mutation.mutate({ id: goal.id, action: "accept" })} disabled={mutation.isPending}>Planı kabul et</Button><Button size="sm" variant="outline" onClick={() => setCorrectionId(goal.id)}>Düzeltme iste</Button></div>}</article>)}</div></section>;
}
