"use client";

import { useId } from "react";

import { CoachingAttachmentPanel } from "@/components/coaching/CoachingAttachmentPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  EXAM_ANALYSIS_STATUS_OPTIONS,
  type CoachingRecommendedResource,
  type CoachingAttachmentItem,
} from "@/lib/coachingApi";
import type { ReportExamForm } from "@/lib/coachingReportDraft";

function LabelledInput({
  label,
  value,
  onChange,
  type = "text",
  step,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5"
      />
    </div>
  );
}

function LabelledText({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-small text-ink-mid">{hint}</p> : null}
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-[5.5rem] bg-surface text-body text-ink focus-visible:border-ink focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

/** One exam status is required; the details open only for an analysed result. */
export function ReportExamStep({
  exam,
  onChange,
}: {
  exam: ReportExamForm;
  onChange: (field: keyof ReportExamForm, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-small font-medium text-ink">
          Bu dönemin deneme durumu <span className="font-normal text-ink-mid">(zorunlu)</span>
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXAM_ANALYSIS_STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-input border bg-surface p-3 text-small text-ink ${
                exam.status === option.value ? "border-ink ring-2 ring-ink" : "border-line"
              }`}
            >
              <input
                type="radio"
                name="exam-analysis-status"
                value={option.value}
                checked={exam.status === option.value}
                onChange={() => onChange("status", option.value)}
                className="h-4 w-4 accent-pink"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      {exam.status === "analyzed" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <LabelledInput
            label="Sınav türü"
            value={exam.exam_type}
            placeholder="YKS, DGS veya KPSS"
            onChange={(value) => onChange("exam_type", value)}
          />
          <LabelledInput
            label="Deneme veya test adı"
            value={exam.exam_name}
            onChange={(value) => onChange("exam_name", value)}
          />
          <LabelledInput
            label="Sınav tarihi"
            type="date"
            value={exam.date}
            onChange={(value) => onChange("date", value)}
          />
          <LabelledInput
            label="Puan veya net"
            type="number"
            step="any"
            value={exam.score_or_net}
            onChange={(value) => onChange("score_or_net", value)}
          />
          <LabelledText
            label="Güçlü alanlar"
            hint="Her satıra bir madde."
            value={exam.strengths}
            onChange={(value) => onChange("strengths", value)}
          />
          <LabelledText
            label="Odak alanları"
            hint="Her satıra bir madde."
            value={exam.focus_areas}
            onChange={(value) => onChange("focus_areas", value)}
          />
          <div className="sm:col-span-2">
            <LabelledText
              label="Öğretmen yorumu"
              value={exam.tutor_interpretation}
              onChange={(value) => onChange("tutor_interpretation", value)}
            />
          </div>
          <div className="sm:col-span-2">
            <LabelledText
              label="Sonraki adımlar"
              hint="Her satıra bir madde."
              value={exam.next_actions}
              onChange={(value) => onChange("next_actions", value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Sources the tutor recommends. A file is first put among the meeting's files
 * (the panel is above the rows, because a row can only point at a file that is
 * already there), then picked in the row.
 */
export function ReportResourcesStep({
  sessionId,
  studentName,
  summary,
  onSummary,
  resources,
  attachments,
  onChange,
}: {
  sessionId: string;
  studentName?: string | null;
  summary: string;
  onSummary: (value: string) => void;
  resources: CoachingRecommendedResource[];
  attachments: readonly CoachingAttachmentItem[];
  onChange: (next: CoachingRecommendedResource[]) => void;
}) {
  const update = (index: number, field: keyof CoachingRecommendedResource, value: string) =>
    onChange(resources.map((resource, i) => (i === index ? { ...resource, [field]: value } : resource)));

  return (
    <div className="space-y-5">
      <LabelledText
        label="Programdaki değişiklik özeti"
        hint="İsteğe bağlı."
        value={summary}
        onChange={onSummary}
      />
      <div className="space-y-3">
        <p className="text-small font-medium text-ink">Önerilen kaynaklar</p>
        <p className="text-small text-ink-mid">
          Bir dosyayı kaynak olarak önermek için önce aşağıdan görüşme dosyalarına yükle, sonra kaynağın dosya listesinden seç.
        </p>
        <CoachingAttachmentPanel sessionId={sessionId} viewerRole="tutor" otherName={studentName} />
        {resources.map((resource, index) => (
          <div key={index} className="grid gap-3 rounded-input border border-line bg-surface p-4 sm:grid-cols-2">
            <LabelledInput
              label={`Kaynak ${index + 1} başlığı`}
              value={resource.title}
              onChange={(value) => update(index, "title", value)}
            />
            <LabelledInput
              label={`Kaynak ${index + 1} bağlantısı`}
              value={resource.url ?? ""}
              placeholder="https://"
              onChange={(value) => update(index, "url", value)}
            />
            <div className="sm:col-span-2">
              <LabelledText
                label={`Kaynak ${index + 1} notu`}
                hint="İsteğe bağlı kısa not."
                value={resource.note ?? ""}
                onChange={(value) => update(index, "note", value)}
              />
            </div>
            <div className="sm:col-span-2">
              <ResourceFileSelect
                index={index}
                value={resource.attachment_id ?? ""}
                attachments={attachments}
                onChange={(value) => update(index, "attachment_id", value)}
              />
            </div>
            <button
              type="button"
              className="min-h-11 justify-self-start text-small text-ink underline underline-offset-4"
              onClick={() => onChange(resources.filter((_, i) => i !== index))}
            >
              Kaynağı kaldır
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="gold"
          size="sm"
          className="min-h-11"
          onClick={() => onChange([...resources, { title: "", url: "", note: "", attachment_id: "" }])}
        >
          Kaynak ekle
        </Button>
      </div>
    </div>
  );
}

function ResourceFileSelect({
  index,
  value,
  attachments,
  onChange,
}: {
  index: number;
  value: string;
  attachments: readonly CoachingAttachmentItem[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {`Kaynak ${index + 1} dosyası`}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-input border border-line bg-surface px-3 text-body text-ink focus:border-ink focus:outline-none"
      >
        <option value="">Dosya ekleme</option>
        {attachments.map((attachment) => (
          <option key={attachment.id} value={attachment.id}>
            {attachment.original_name}
          </option>
        ))}
      </select>
    </div>
  );
}
