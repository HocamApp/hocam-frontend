"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchRecommendationControls, restoreTutorRecommendation } from "@/lib/matchingApi";

export function HiddenTutorControls() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["recommendation-controls"], queryFn: fetchRecommendationControls });
  const mutation = useMutation({
    mutationFn: restoreTutorRecommendation,
    onSuccess: () => { toast.success("Hoca yeniden önerilere eklendi."); void queryClient.invalidateQueries({ queryKey: ["recommendation-controls"] }); },
    onError: () => toast.error("Tercih geri alınamadı."),
  });
  const controls = query.data ?? [];
  if (!query.isLoading && controls.length === 0) return null;
  return <><Button type="button" variant="ghost" className="mt-5" onClick={() => setOpen(true)}>Gizlediğim hocalar ({controls.length})</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Gizlediğin hocalar</DialogTitle><DialogDescription>İstersen bir hocayı yeniden kişisel önerilerine ekleyebilirsin.</DialogDescription></DialogHeader><div className="space-y-2">{controls.map((control) => <div key={control.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><span className="text-sm font-medium">{control.tutor_summary.name} {control.tutor_summary.surname}</span><Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate(control.id)}>Geri al</Button></div>)}</div></DialogContent></Dialog></>;
}
