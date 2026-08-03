"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchLearningTopics,
  fetchTutorLessonTopicCheckIns,
  upsertLessonTopicCheckIn,
} from "@/lib/learningApi";
import type {
  Booking,
  LessonCoverageStage,
  LessonNextAction,
  LessonSupportLevel,
  LessonTopicCheckInPayload,
  LessonUnderstanding,
} from "@/types";

interface LessonTopicCheckInDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const coverageOptions: Array<{ value: LessonCoverageStage; label: string }> = [
  { value: "introduced", label: "Konuya giriş yapıldı" },
  { value: "practised", label: "Pratik yapıldı" },
  { value: "assessed", label: "Öğrenci değerlendirildi" },
];

const understandingOptions: Array<{ value: LessonUnderstanding; label: string }> = [
  { value: "understood", label: "Anladı" },
  { value: "partly_understood", label: "Kısmen anladı" },
  { value: "needs_review", label: "Tekrar gerekiyor" },
  { value: "not_assessed", label: "Değerlendirilmedi" },
];

const supportOptions: Array<{ value: LessonSupportLevel; label: string }> = [
  { value: "independent", label: "Bağımsız çalıştı" },
  { value: "prompted", label: "Küçük yönlendirmeler aldı" },
  { value: "fully_guided", label: "Yoğun yönlendirme aldı" },
  { value: "not_applicable", label: "Uygulanamaz" },
];

const nextActionOptions: Array<{ value: LessonNextAction; label: string }> = [
  { value: "revisit", label: "Konuyu yeniden ele al" },
  { value: "practise", label: "Bağımsız pratik yap" },
  { value: "advance", label: "Sonraki konuya geç" },
  { value: "reassess", label: "Daha sonra tekrar değerlendir" },
  { value: "none", label: "Şimdilik öneri yok" },
];

export function LessonTopicCheckInDialog({
  booking,
  open,
  onOpenChange,
}: LessonTopicCheckInDialogProps) {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [nextTopic, setNextTopic] = useState("__none__");
  const [curriculumVersion, setCurriculumVersion] = useState(
    `${new Date().getFullYear()} YKS`
  );
  const [subtopic, setSubtopic] = useState("");
  const [coverageStage, setCoverageStage] = useState<LessonCoverageStage>("practised");
  const [understanding, setUnderstanding] =
    useState<LessonUnderstanding>("partly_understood");
  const [supportLevel, setSupportLevel] = useState<LessonSupportLevel>("prompted");
  const [nextAction, setNextAction] = useState<LessonNextAction>("revisit");

  const topicsQuery = useQuery({
    queryKey: ["learning-topics"],
    queryFn: fetchLearningTopics,
    staleTime: Infinity,
    enabled: open,
  });
  const checkInsQuery = useQuery({
    queryKey: ["lesson-topic-check-ins", booking.student.id],
    queryFn: () => fetchTutorLessonTopicCheckIns(booking.student.id),
    enabled: open,
  });
  const existing = checkInsQuery.data?.find((item) => item.booking === booking.id);
  const compatibleTopics = useMemo(
    () =>
      (topicsQuery.data ?? []).filter(
        (item) =>
          item.is_active &&
          item.exam_type.toLocaleLowerCase("tr-TR") ===
            booking.subject.exam_type.toLocaleLowerCase("tr-TR") &&
          item.subject_name.toLocaleLowerCase("tr-TR") ===
            booking.subject.name.toLocaleLowerCase("tr-TR")
      ),
    [booking.subject.exam_type, booking.subject.name, topicsQuery.data]
  );

  useEffect(() => {
    if (!open) return;
    if (existing) {
      setTopic(existing.topic);
      setNextTopic(existing.next_topic ?? "__none__");
      setCurriculumVersion(existing.curriculum_version);
      setSubtopic(existing.subtopic ?? "");
      setCoverageStage(existing.coverage_stage);
      setUnderstanding(existing.understanding);
      setSupportLevel(existing.support_level);
      setNextAction(existing.next_action);
      return;
    }
    setTopic(booking.learning_context?.topic?.id ?? "");
  }, [booking.id, booking.learning_context?.topic?.id, existing, open]);

  useEffect(() => {
    if (understanding === "not_assessed") {
      setSupportLevel("not_applicable");
    }
  }, [understanding]);

  const mutation = useMutation({
    mutationFn: (payload: LessonTopicCheckInPayload) =>
      upsertLessonTopicCheckIn(booking.id, payload),
    onSuccess: async () => {
      toast.success(existing ? "Ders kaydı güncellendi." : "Ders kaydı eklendi.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bookings"] }),
        queryClient.invalidateQueries({
          queryKey: ["lesson-topic-check-ins", booking.student.id],
        }),
      ]);
      onOpenChange(false);
    },
    onError: () => toast.error("Ders kaydı kaydedilemedi."),
  });

  const handleSubmit = () => {
    if (!topic || !curriculumVersion.trim()) {
      toast.error("Konu ve müfredat sürümü zorunludur.");
      return;
    }
    mutation.mutate({
      topic,
      next_topic: nextTopic === "__none__" ? null : nextTopic,
      curriculum_version: curriculumVersion.trim(),
      subtopic: subtopic.trim(),
      coverage_stage: coverageStage,
      understanding,
      support_level: supportLevel,
      next_action: nextAction,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !mutation.isPending && onOpenChange(value)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Ders Sonu Gelişim Kaydı</DialogTitle>
          <DialogDescription>
            Yalnızca bu derste gözlemlediğin bilgiyi kaydet. Bu kayıt kesin bir seviye
            veya başarı ölçümü değildir.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Konu</Label>
            <Select value={topic} onValueChange={setTopic} disabled={mutation.isPending}>
              <SelectTrigger><SelectValue placeholder="İşlenen konuyu seç" /></SelectTrigger>
              <SelectContent>
                {compatibleTopics.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!topicsQuery.isLoading && compatibleTopics.length === 0 && (
              <p className="text-xs text-destructive">
                Bu ders için incelenmiş bir konu bulunamadı; kayıt yapılamaz.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="curriculum-version">Müfredat sürümü</Label>
            <Input id="curriculum-version" value={curriculumVersion}
              onChange={(event) => setCurriculumVersion(event.target.value)} maxLength={40} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtopic">Alt konu (isteğe bağlı)</Label>
            <Input id="subtopic" value={subtopic}
              onChange={(event) => setSubtopic(event.target.value)} maxLength={160} />
          </div>

          <div className="space-y-2">
            <Label>Ders içinde ne yapıldı?</Label>
            <Select value={coverageStage} onValueChange={(value) => setCoverageStage(value as LessonCoverageStage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{coverageOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Öğrencinin durumu</Label>
            <Select value={understanding} onValueChange={(value) => setUnderstanding(value as LessonUnderstanding)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{understandingOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kullanılan destek</Label>
            <Select value={supportLevel} onValueChange={(value) => setSupportLevel(value as LessonSupportLevel)} disabled={understanding === "not_assessed"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{supportOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sonraki adım</Label>
            <Select value={nextAction} onValueChange={(value) => setNextAction(value as LessonNextAction)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{nextActionOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Önerilen sonraki konu (isteğe bağlı)</Label>
            <Select value={nextTopic} onValueChange={setNextTopic}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Belirtilmedi</SelectItem>
                {compatibleTopics.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Vazgeç</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending || !topic || compatibleTopics.length === 0}>
            {mutation.isPending ? "Kaydediliyor..." : existing ? "Kaydı Güncelle" : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
