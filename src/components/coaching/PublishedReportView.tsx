import { FileDown, Link as LinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CoachingRecommendedResource,
  CoachingSessionReportRevision,
} from "@/lib/coachingApi";

function TextSection({ title, value }: { title: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{value}</p>
    </section>
  );
}

function StringList({ title, values }: { title: string; values?: string[] }) {
  const visible = values?.filter((value) => value.trim()) ?? [];
  if (!visible.length) return null;
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
        {visible.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </section>
  );
}

export function ReportResources({
  resources,
  onDownloadAttachment,
}: {
  resources?: CoachingRecommendedResource[];
  onDownloadAttachment?: (attachmentId: string) => void;
}) {
  if (!resources?.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Önerilen kaynaklar</h3>
      <ul className="space-y-2">
        {resources.map((resource, index) => {
          // Published resources expose only authorised attachment metadata;
          // the browser must request its short-lived URL through the API.
          const attachmentId = resource.attachment_id ?? resource.attachment?.id;
          return (
          <li key={`${resource.title}-${index}`} className="rounded-md border p-3 text-sm">
            <p className="font-medium">{resource.title}</p>
            {resource.note ? (
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{resource.note}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {resource.url ? (
                <Button asChild size="sm" variant="outline">
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    <LinkIcon className="mr-1 h-3.5 w-3.5" /> Bağlantıyı aç
                  </a>
                </Button>
              ) : null}
              {attachmentId && onDownloadAttachment ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadAttachment(attachmentId)}
                >
                  <FileDown className="mr-1 h-3.5 w-3.5" />
                  {resource.attachment?.original_name ?? "Dosyayı indir"}
                </Button>
              ) : null}
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Student-facing report content is always a published immutable revision. */
export function PublishedReportView({
  revision,
  onDownloadAttachment,
}: {
  revision: CoachingSessionReportRevision;
  onDownloadAttachment?: (attachmentId: string) => void;
}) {
  const content = revision.content;
  const exam = content.exam_analysis;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Görüşme raporu</CardTitle>
        <p className="text-sm text-muted-foreground">
          Revizyon {revision.revision_number} ·{" "}
          {new Date(revision.published_at).toLocaleString("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {revision.change_note ? (
          <p className="text-sm text-muted-foreground">{revision.change_note}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <TextSection title="Kısa özet" value={content.short_summary} />
        <TextSection title="Görüşülen konular" value={content.topics_discussed} />
        <TextSection title="Öğrencinin ilerlemesi" value={content.student_progress} />
        <TextSection title="Sonraki öncelikler" value={content.next_priorities} />
        <TextSection title="Çalışma önerileri" value={content.study_recommendations} />
        <TextSection
          title="Bir sonraki görüşmeye kadar odak"
          value={content.focus_until_next_meeting}
        />
        <TextSection title="Program değişikliği" value={content.program_changes_summary} />

        {exam ? (
          <section className="space-y-3 rounded-lg bg-muted/50 p-4">
            <h3 className="text-sm font-semibold">Sınav analizi</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {exam.exam_type ? <div><dt className="text-muted-foreground">Sınav</dt><dd>{exam.exam_type}</dd></div> : null}
              {exam.exam_name ? <div><dt className="text-muted-foreground">Deneme / test</dt><dd>{exam.exam_name}</dd></div> : null}
              {exam.date ? <div><dt className="text-muted-foreground">Tarih</dt><dd>{exam.date}</dd></div> : null}
              {exam.score_or_net !== undefined && exam.score_or_net !== null ? <div><dt className="text-muted-foreground">Puan / net</dt><dd>{exam.score_or_net}</dd></div> : null}
            </dl>
            <StringList title="Güçlü alanlar" values={exam.strengths} />
            <StringList title="Odak alanları" values={exam.focus_areas} />
            <TextSection title="Öğretmen yorumu" value={exam.tutor_interpretation} />
            <StringList title="Sonraki adımlar" values={exam.next_actions} />
          </section>
        ) : null}

        <ReportResources
          resources={content.recommended_resources}
          onDownloadAttachment={onDownloadAttachment}
        />
      </CardContent>
    </Card>
  );
}
