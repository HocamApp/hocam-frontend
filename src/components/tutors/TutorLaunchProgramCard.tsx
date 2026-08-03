"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTutorLaunchProgram, updateTutorLaunchProgram } from "@/lib/dashboardApi";

export function TutorLaunchProgramCard() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["tutor-launch-program"], queryFn: fetchTutorLaunchProgram });
  const [limit, setLimit] = useState("1");
  const mutation = useMutation({
    mutationFn: updateTutorLaunchProgram,
    onSuccess: (data) => { setLimit(String(data.lesson_limit)); toast.success("Başlangıç programı güncellendi."); void queryClient.invalidateQueries({ queryKey: ["tutor-launch-program"] }); },
    onError: () => toast.error("Başlangıç programı güncellenemedi."),
  });
  const program = query.data;
  if (query.isLoading) return <div className="h-32 animate-pulse rounded-xl bg-muted" />;
  if (!program) return null;
  return <section className="rounded-2xl border bg-card p-5"><div className="flex items-start gap-3"><span className="rounded-full bg-primary/10 p-2 text-primary"><Rocket className="h-5 w-5" /></span><div><h3 className="font-semibold">Yeni Hoca Başlangıç Programı</h3><p className="mt-1 text-sm text-muted-foreground">Katılım gönüllüdür. Şu anda yalnızca açıkça kabul ettiğin sıfır ücretli tanıtım dersi seçeneği hazırlanmıştır; sistem ödeme veya ders hakkı üretmez.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><div><label htmlFor="launch-limit" className="text-sm font-medium">Sunmak istediğin toplam ders (1–10)</label><Input id="launch-limit" type="number" min={1} max={10} value={limit} onChange={(e) => setLimit(e.target.value)} className="mt-1 max-w-32" /></div><div className="flex flex-wrap items-end gap-2"><Button variant="outline" onClick={() => mutation.mutate({ lesson_limit: Number(limit) })} disabled={mutation.isPending}>Limiti kaydet</Button>{!program.enabled ? <Button onClick={() => mutation.mutate({ enabled: true, paused: false, accept_terms: true, lesson_limit: Number(limit), compensation_mode: "voluntary_zero" })} disabled={mutation.isPending}>Gönüllü olarak katıl</Button> : <Button variant="outline" onClick={() => mutation.mutate({ paused: !program.paused })} disabled={mutation.isPending}>{program.paused ? "Programı sürdür" : "Programı duraklat"}</Button>}</div></div><p className="mt-3 text-xs text-muted-foreground">Kalan tanıtım dersi: {program.remaining_lessons}. Normal kimlik, güvenlik, deneme uygunluğu, rezervasyon ve iptal kuralları aynen uygulanır.</p></section>;
}
