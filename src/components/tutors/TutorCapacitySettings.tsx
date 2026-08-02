"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmTutorAvailability, updateMyTutorProfile } from "@/lib/tutorsApi";
import type { TutorProfile } from "@/types";

export function TutorCapacitySettings({ profile }: { profile: TutorProfile }) {
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(profile.accepting_new_students ?? true);
  const [slots, setSlots] = useState(profile.open_student_slots ?? 5);
  const [earliest, setEarliest] = useState(profile.earliest_start_date ?? "");
  const [pauseUntil, setPauseUntil] = useState(profile.availability_pause_until ?? "");
  const [acceptsTrials, setAcceptsTrials] = useState(profile.accepts_trial_lessons ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAccepting(profile.accepting_new_students ?? true);
    setSlots(profile.open_student_slots ?? 5);
    setEarliest(profile.earliest_start_date ?? "");
    setPauseUntil(profile.availability_pause_until ?? "");
    setAcceptsTrials(profile.accepts_trial_lessons ?? true);
  }, [profile]);

  const commit = (updated: TutorProfile) => queryClient.setQueryData(["tutor-me"], updated);
  async function save() {
    setSaving(true);
    try {
      const updated = await updateMyTutorProfile({
        accepting_new_students: accepting,
        open_student_slots: Math.min(20, Math.max(0, slots)),
        earliest_start_date: earliest || null,
        availability_pause_until: pauseUntil || null,
        accepts_trial_lessons: acceptsTrials,
      });
      commit(updated);
      toast.success("Öğrenci kapasitesi kaydedildi.");
    } catch {
      toast.error("Kapasite ayarları kaydedilemedi.");
    } finally { setSaving(false); }
  }
  async function confirm() {
    setSaving(true);
    try {
      const updated = await confirmTutorAvailability();
      commit(updated);
      toast.success("Müsaitlik bilgilerin güncel olarak işaretlendi.");
    } catch { toast.error("Müsaitlik doğrulanamadı."); }
    finally { setSaving(false); }
  }

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div><h2 className="font-semibold">Yeni öğrenci kapasitesi</h2><p className="mt-1 text-sm text-muted-foreground">Takvimine ek olarak kaç yeni öğrenciyle çalışabileceğini belirt.</p></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={accepting} onChange={(event) => setAccepting(event.target.checked)} /> Yeni öğrenci kabul ediyorum</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={acceptsTrials} onChange={(event) => setAcceptsTrials(event.target.checked)} /> Ücretsiz deneme dersi kabul ediyorum</label>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="open-slots">Açık öğrenci yeri</Label><Input id="open-slots" type="number" min={0} max={20} value={slots} onChange={(event) => setSlots(Number(event.target.value))} /></div>
        <div className="space-y-1.5"><Label htmlFor="earliest-start">En erken başlangıç</Label><Input id="earliest-start" type="date" value={earliest} onChange={(event) => setEarliest(event.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="pause-until">Şu tarihe kadar duraklat</Label><Input id="pause-until" type="date" value={pauseUntil} onChange={(event) => setPauseUntil(event.target.value)} /></div>
      </div>
      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        {profile.availability_is_stale ? "Müsaitlik bilgin 30 günden eski veya henüz doğrulanmadı." : "Müsaitlik bilgin güncel."}
      </div>
      <div className="flex flex-wrap gap-2"><Button type="button" disabled={saving} onClick={() => void save()}>Kapasiteyi kaydet</Button><Button type="button" variant="outline" disabled={saving} onClick={() => void confirm()}>Müsaitliğim güncel</Button></div>
    </section>
  );
}
