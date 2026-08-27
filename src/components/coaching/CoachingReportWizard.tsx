"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { SensitiveDataGuidance } from "@/components/privacy/SensitiveDataGuidance";
import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  extractCoachingErrorMessage,
  fetchCoachingReportDraft,
  fetchCoachingReports,
  fetchCoachingSessionAttachments,
  fetchCoachingSessionDetail,
  fetchTutorCoachingReportHistory,
  getReportPublishInvalidationKeys,
  getPrimaryReportTiming,
  normalizeScoreOrNet,
  publishCoachingReportRevision,
  publishInitialCoachingReport,
  saveCoachingReportDraft,
  type CoachingExamAnalysis,
  type CoachingRecommendedResource,
  type CoachingReportDraftInput,
} from "@/lib/coachingApi";

const STEPS = [
  "Özet",
  "İlerleme",
  "Öncelikler",
  "Sınav analizi",
  "Kaynaklar",
];

const EMPTY_DRAFT: CoachingReportDraftInput = {
  short_summary: "",
  topics_discussed: "",
  student_progress: "",
  next_priorities: "",
  study_recommendations: "",
  focus_until_next_meeting: "",
  exam_analysis: {},
  recommended_resources: [],
  program_changes_summary: "",
};

type ExamForm = {
  exam_type: string;
  exam_name: string;
  date: string;
  score_or_net: string;
  strengths: string;
  focus_areas: string;
  tutor_interpretation: string;
  next_actions: string;
};

const EMPTY_EXAM: ExamForm = {
  exam_type: "",
  exam_name: "",
  date: "",
  score_or_net: "",
  strengths: "",
  focus_areas: "",
  tutor_interpretation: "",
  next_actions: "",
};

function splitLines(value: string) {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function createExamForm(exam?: CoachingExamAnalysis | null): ExamForm {
  return {
    exam_type: String(exam?.exam_type ?? ""),
    exam_name: String(exam?.exam_name ?? ""),
    date: String(exam?.date ?? ""),
    score_or_net: String(exam?.score_or_net ?? ""),
    strengths: (exam?.strengths ?? []).join("\n"),
    focus_areas: (exam?.focus_areas ?? []).join("\n"),
    tutor_interpretation: String(exam?.tutor_interpretation ?? ""),
    next_actions: (exam?.next_actions ?? []).join("\n"),
  };
}

function toExamAnalysis(exam: ExamForm): CoachingExamAnalysis {
  const output: CoachingExamAnalysis = {};
  if (exam.exam_type.trim()) output.exam_type = exam.exam_type.trim();
  if (exam.exam_name.trim()) output.exam_name = exam.exam_name.trim();
  if (exam.date) output.date = exam.date;
  const scoreOrNet = normalizeScoreOrNet(exam.score_or_net);
  if (scoreOrNet !== null) output.score_or_net = scoreOrNet;
  const strengths = splitLines(exam.strengths);
  const focusAreas = splitLines(exam.focus_areas);
  const nextActions = splitLines(exam.next_actions);
  if (strengths.length) output.strengths = strengths;
  if (focusAreas.length) output.focus_areas = focusAreas;
  if (exam.tutor_interpretation.trim()) output.tutor_interpretation = exam.tutor_interpretation.trim();
  if (nextActions.length) output.next_actions = nextActions;
  return output;
}

function isIncident(status: string) {
  return ["student_no_show", "tutor_no_show", "technical_failure"].includes(status);
}

function ReportTimingNotice({
  session,
}: {
  session: Awaited<ReturnType<typeof fetchCoachingSessionDetail>>;
}) {
  const timing = getPrimaryReportTiming(session);
  if (!timing.reportDueAt) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Bu görüşme için normal rapor yok</AlertTitle>
        <AlertDescription>Incident oturumları için primary report ve eksik rapor zamanlaması uygulanmaz.</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant={timing.reportOverdue ? "destructive" : "default"}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{timing.reportOverdue ? "Rapor süresi geçti" : "Primary rapor zamanlaması"}</AlertTitle>
      <AlertDescription>
        Rapor için son zaman: {new Date(timing.reportDueAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}.
        {timing.complaintEligibleAt ? ` Eksik rapor desteği ${new Date(timing.complaintEligibleAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })} itibarıyla kullanılabilir.` : ""}
        {timing.complaintEligible ? <span className="ml-1 font-medium">Destek girişi şu anda kullanılabilir.</span> : null}
      </AlertDescription>
    </Alert>
  );
}

export function CoachingReportWizard({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CoachingReportDraftInput>(EMPTY_DRAFT);
  const [exam, setExam] = useState<ExamForm>(EMPTY_EXAM);
  const [resources, setResources] = useState<CoachingRecommendedResource[]>([]);
  const [changeNote, setChangeNote] = useState("");
  const [hydratedDraftVersion, setHydratedDraftVersion] = useState<number | null>(null);

  const sessionQuery = useQuery({
    queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId),
    queryFn: () => fetchCoachingSessionDetail(sessionId),
  });
  const draftQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.reportDraft(sessionId),
    queryFn: () => fetchCoachingReportDraft(sessionId),
  });
  const reportListQuery = useQuery({
    queryKey: COACHING_FAZ6_QUERY_KEYS.tutorReportList(),
    queryFn: fetchCoachingReports,
  });
  const attachmentsQuery = useQuery({
    queryKey: ["coaching-session-attachments", sessionId],
    queryFn: () => fetchCoachingSessionAttachments(sessionId),
  });
  const report = useMemo(
    () => reportListQuery.data?.find((item) => item.session_id === sessionId) ?? null,
    [reportListQuery.data, sessionId]
  );
  const revisionHistoryQuery = useQuery({
    queryKey: report ? COACHING_FAZ6_QUERY_KEYS.reportHistory(report.id) : COACHING_FAZ6_QUERY_KEYS.reportHistory("none"),
    queryFn: () => fetchTutorCoachingReportHistory(report!.id),
    enabled: Boolean(report),
  });

  useEffect(() => {
    const serverDraft = draftQuery.data;
    if (!serverDraft || hydratedDraftVersion === serverDraft.draft_version) return;
    setDraft({ ...EMPTY_DRAFT, ...serverDraft.content });
    setExam(createExamForm(serverDraft.content.exam_analysis));
    setResources(serverDraft.content.recommended_resources ?? []);
    setHydratedDraftVersion(serverDraft.draft_version);
  }, [draftQuery.data, hydratedDraftVersion]);

  const payload = (): CoachingReportDraftInput => ({
    ...draft,
    exam_analysis: toExamAnalysis(exam),
    recommended_resources: resources.filter((resource) => resource.title.trim()).map((resource) => ({
      title: resource.title.trim(),
      ...(resource.url?.trim() ? { url: resource.url.trim() } : {}),
      ...(resource.note?.trim() ? { note: resource.note.trim() } : {}),
      ...(resource.attachment_id ? { attachment_id: resource.attachment_id } : {}),
    })),
  });
  const invalidateDraft = () => queryClient.invalidateQueries({
    queryKey: COACHING_FAZ6_QUERY_KEYS.reportDraft(sessionId),
  });
  const saveMutation = useMutation({
    mutationFn: () => saveCoachingReportDraft(sessionId, payload()),
    onSuccess: (saved) => {
      setHydratedDraftVersion(saved.draft_version);
      setDraft({ ...EMPTY_DRAFT, ...saved.content });
      setExam(createExamForm(saved.content.exam_analysis));
      setResources(saved.content.recommended_resources ?? []);
      invalidateDraft();
      toast.success("Rapor taslağı kaydedildi.");
    },
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });
  const initialPublishMutation = useMutation({
    mutationFn: async () => {
      const savedDraft = await saveMutation.mutateAsync();
      const revision = await publishInitialCoachingReport(sessionId);
      return { revision, reportId: savedDraft.id };
    },
    onSuccess: ({ revision, reportId }) => {
      toast.success(`İlk rapor yayınlandı (revizyon ${revision.revision_number}).`);
      invalidateAfterInitialPublish(reportId);
    },
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });
  const revisionPublishMutation = useMutation({
    mutationFn: async () => {
      await saveMutation.mutateAsync();
      if (!report) throw new Error("Rapor henüz bulunamadı.");
      return publishCoachingReportRevision(report.id, changeNote);
    },
    onSuccess: (revision) => {
      toast.success(`Yeni rapor revizyonu yayınlandı (revizyon ${revision.revision_number}).`);
      invalidateAfterRevisionPublish(report?.id);
      setChangeNote("");
    },
    onError: (error) => toast.error(extractCoachingErrorMessage(error)),
  });

  function invalidateAfterInitialPublish(reportId: string) {
    const keys = getReportPublishInvalidationKeys({ sessionId, reportId, initial: true });
    queryClient.invalidateQueries({ queryKey: keys.draft });
    queryClient.invalidateQueries({ queryKey: keys.sessionDetail });
    queryClient.invalidateQueries({ queryKey: keys.sessionToken });
    queryClient.invalidateQueries({ queryKey: keys.studentSessionList });
    queryClient.invalidateQueries({ queryKey: keys.tutorSessionList });
    queryClient.invalidateQueries({ queryKey: keys.tutorReportList });
    queryClient.invalidateQueries({ queryKey: keys.studentReportList });
    queryClient.invalidateQueries({ queryKey: keys.publishedReport });
    queryClient.invalidateQueries({ queryKey: keys.reportHistory });
  }

  function invalidateAfterRevisionPublish(reportId?: string) {
    if (!reportId) return;
    const keys = getReportPublishInvalidationKeys({ sessionId, reportId, initial: false });
    queryClient.invalidateQueries({ queryKey: keys.draft });
    queryClient.invalidateQueries({ queryKey: keys.tutorReportList });
    queryClient.invalidateQueries({ queryKey: keys.studentReportList });
    queryClient.invalidateQueries({ queryKey: keys.publishedReport });
    queryClient.invalidateQueries({ queryKey: keys.reportHistory });
  }

  if (sessionQuery.isLoading || draftQuery.isLoading || reportListQuery.isLoading) {
    return <div className="flex min-h-48 items-center justify-center"><LoadingSpinner /></div>;
  }
  if (sessionQuery.isError || !sessionQuery.data) return <ErrorMessage message={extractCoachingErrorMessage(sessionQuery.error)} />;
  if (draftQuery.isError) return <ErrorMessage message={extractCoachingErrorMessage(draftQuery.error)} />;

  const session = sessionQuery.data;
  if (isIncident(session.status)) {
    return <div className="space-y-4"><ReportTimingNotice session={session} /><CoachingAttachmentPanel sessionId={sessionId} /></div>;
  }
  // Master Spec §22.2: "Görüşme sırasında otomatik taslak açılır. Öğretmen
  // görüşmede doldurabilir." — the backend already accepts a draft write
  // as soon as the session is in_progress (see save_report_draft), so the
  // wizard must open for drafting then too, not only once the session
  // reaches awaiting_report. Publishing itself stays gated below.
  const draftableStatuses = ["in_progress", "awaiting_report"];
  if (!draftableStatuses.includes(session.status) && !report?.latest_revision) {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Rapor henüz açılamaz</AlertTitle><AlertDescription>Primary rapor taslağı, görüşme başladığında hazırlanabilir.</AlertDescription></Alert>;
  }

  const hasPublishedRevision = Boolean(report?.latest_revision);
  const currentRevision = report?.latest_revision;
  const updateDraft = (field: keyof CoachingReportDraftInput, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));
  const updateExam = (field: keyof ExamForm, value: string) => setExam((current) => ({ ...current, [field]: value }));
  const upsertResource = (index: number, field: keyof CoachingRecommendedResource, value: string) =>
    setResources((current) => current.map((resource, resourceIndex) => resourceIndex === index ? { ...resource, [field]: value } : resource));
  const pending = saveMutation.isPending || initialPublishMutation.isPending || revisionPublishMutation.isPending;

  return (
    <div className="space-y-6">
      <ReportTimingNotice session={session} />
      <Card>
        <CardHeader>
          <CardTitle>Görüşme raporu</CardTitle>
          <p className="text-sm text-muted-foreground">Taslağı adım adım kaydedebilir, sonrasında immutable bir revizyon olarak yayınlayabilirsin.</p>
          <SensitiveDataGuidance />
          <ol className="grid grid-cols-5 gap-1 pt-2 text-center text-xs text-muted-foreground" aria-label="Rapor adımları">
            {STEPS.map((label, index) => <li key={label} className={index === step ? "rounded bg-primary px-1 py-2 font-medium text-primary-foreground" : "rounded bg-muted px-1 py-2"}>{index + 1}. {label}</li>)}
          </ol>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); saveMutation.mutate(); }}>
            {step === 0 ? <>
              <Textarea required value={draft.short_summary} onChange={(event) => updateDraft("short_summary", event.target.value)} placeholder="Görüşmenin kısa özeti" aria-label="Kısa özet" />
              <Textarea required value={draft.topics_discussed} onChange={(event) => updateDraft("topics_discussed", event.target.value)} placeholder="Görüşülen konular" aria-label="Görüşülen konular" />
            </> : null}
            {step === 1 ? <Textarea required value={draft.student_progress} onChange={(event) => updateDraft("student_progress", event.target.value)} placeholder="Öğrencinin mevcut durumu ve ilerlemesi" aria-label="Öğrencinin ilerlemesi" /> : null}
            {step === 2 ? <>
              <Textarea required value={draft.next_priorities} onChange={(event) => updateDraft("next_priorities", event.target.value)} placeholder="Sonraki dönem öncelikleri" aria-label="Sonraki öncelikler" />
              <Textarea required value={draft.study_recommendations} onChange={(event) => updateDraft("study_recommendations", event.target.value)} placeholder="Çalışma önerileri" aria-label="Çalışma önerileri" />
              <Textarea required value={draft.focus_until_next_meeting} onChange={(event) => updateDraft("focus_until_next_meeting", event.target.value)} placeholder="Bir sonraki görüşmeye kadar odak" aria-label="Bir sonraki görüşmeye kadar odak" />
            </> : null}
            {step === 3 ? <div className="grid gap-3 sm:grid-cols-2">
              <Input value={exam.exam_type} onChange={(event) => updateExam("exam_type", event.target.value)} placeholder="Sınav türü (YKS, DGS, KPSS)" aria-label="Sınav türü" />
              <Input value={exam.exam_name} onChange={(event) => updateExam("exam_name", event.target.value)} placeholder="Deneme / test adı" aria-label="Deneme veya test adı" />
              <Input type="date" value={exam.date} onChange={(event) => updateExam("date", event.target.value)} aria-label="Sınav tarihi" />
              <Input type="number" step="any" value={exam.score_or_net} onChange={(event) => updateExam("score_or_net", event.target.value)} placeholder="Puan / net" aria-label="Puan veya net" />
              <Textarea value={exam.strengths} onChange={(event) => updateExam("strengths", event.target.value)} placeholder="Güçlü alanlar (her satıra bir madde)" aria-label="Güçlü alanlar" />
              <Textarea value={exam.focus_areas} onChange={(event) => updateExam("focus_areas", event.target.value)} placeholder="Odak alanları (her satıra bir madde)" aria-label="Odak alanları" />
              <Textarea className="sm:col-span-2" value={exam.tutor_interpretation} onChange={(event) => updateExam("tutor_interpretation", event.target.value)} placeholder="Öğretmen yorumu" aria-label="Öğretmen yorumu" />
              <Textarea className="sm:col-span-2" value={exam.next_actions} onChange={(event) => updateExam("next_actions", event.target.value)} placeholder="Sonraki adımlar (her satıra bir madde)" aria-label="Sonraki adımlar" />
            </div> : null}
            {step === 4 ? <div className="space-y-4">
              <Textarea value={draft.program_changes_summary ?? ""} onChange={(event) => updateDraft("program_changes_summary", event.target.value)} placeholder="Programdaki değişiklik özeti (opsiyonel)" aria-label="Program değişikliği özeti" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Önerilen kaynaklar</p>
                {resources.map((resource, index) => <div key={index} className="grid gap-2 rounded border p-3 sm:grid-cols-2">
                  <Input value={resource.title} onChange={(event) => upsertResource(index, "title", event.target.value)} placeholder="Kaynak başlığı" aria-label={`Kaynak ${index + 1} başlığı`} />
                  <Input value={resource.url ?? ""} onChange={(event) => upsertResource(index, "url", event.target.value)} placeholder="https:// bağlantısı (opsiyonel)" aria-label={`Kaynak ${index + 1} bağlantısı`} />
                  <Textarea className="sm:col-span-2" value={resource.note ?? ""} onChange={(event) => upsertResource(index, "note", event.target.value)} placeholder="Kısa not (opsiyonel)" aria-label={`Kaynak ${index + 1} notu`} />
                  <select className="h-10 rounded-md border border-input bg-background px-3 text-sm sm:col-span-2" value={resource.attachment_id ?? ""} aria-label={`Kaynak ${index + 1} dosyası`} onChange={(event) => upsertResource(index, "attachment_id", event.target.value)}>
                    <option value="">Dosya ekleme</option>
                    {(attachmentsQuery.data ?? []).map((attachment) => <option key={attachment.id} value={attachment.id}>{attachment.original_name}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="ghost" className="justify-self-start" onClick={() => setResources((current) => current.filter((_, resourceIndex) => resourceIndex !== index))}>Kaynağı kaldır</Button>
                </div>)}
                <Button type="button" size="sm" variant="outline" onClick={() => setResources((current) => [...current, { title: "", url: "", note: "", attachment_id: "" }])}>Kaynak ekle</Button>
              </div>
              <CoachingAttachmentPanel sessionId={sessionId} />
            </div> : null}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)}><ChevronLeft className="mr-1 h-4 w-4" /> Geri</Button>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="outline" disabled={pending}><Save className="mr-1 h-4 w-4" /> Taslağı kaydet</Button>
                {step < STEPS.length - 1 ? <Button type="button" onClick={() => setStep((current) => current + 1)}>İleri <ChevronRight className="ml-1 h-4 w-4" /></Button> : null}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Yayınla</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {hasPublishedRevision ? <>
            <p className="text-sm text-muted-foreground">Son yayınlanan revizyon: #{currentRevision?.revision_number}. Taslaktaki gerçek değişiklikler yeni bir immutable revizyon üretir.</p>
            <Textarea value={changeNote} onChange={(event) => setChangeNote(event.target.value)} placeholder="Bu revizyondaki değişiklik notu (opsiyonel)" aria-label="Revizyon değişiklik notu" />
            <Button disabled={pending || !report} onClick={() => revisionPublishMutation.mutate()}><Send className="mr-2 h-4 w-4" /> Yeni revizyonu yayınla</Button>
          </> : <>
            <p className="text-sm text-muted-foreground">İlk yayın, görüşmeyi normal primary report tamamlanma kapısından geçirir. Sonraki yayınlar yeni revizyon olur.</p>
            <Button disabled={pending || session.status !== "awaiting_report"} onClick={() => initialPublishMutation.mutate()}><Send className="mr-2 h-4 w-4" /> İlk raporu yayınla</Button>
          </>}
        </CardContent>
      </Card>

      {hasPublishedRevision ? <Card>
        <CardHeader><CardTitle className="text-lg">Yayın geçmişi</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-3 border-l pl-4">
            {(revisionHistoryQuery.data?.revisions ?? (currentRevision ? [currentRevision] : [])).map((revision) => <li key={revision.id} className="relative text-sm"><span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full bg-primary" />Revizyon {revision.revision_number} · {new Date(revision.published_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}{revision.change_note ? ` · ${revision.change_note}` : ""}</li>)}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">Öğrenci yalnız en güncel immutable yayınlanmış revizyonu görür.</p>
        </CardContent>
      </Card> : null}
    </div>
  );
}
