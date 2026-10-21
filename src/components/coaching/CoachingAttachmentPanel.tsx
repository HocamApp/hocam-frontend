"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CoachingFilePicker } from "@/components/coaching/CoachingFilePicker";
import { CoachingLoadError } from "@/components/coaching/CoachingLoadError";
import { Button } from "@/components/ui/button";
import {
  fetchCoachingSessionAttachments,
  uploadCoachingSessionAttachment,
  fetchCoachingAttachmentDownloadUrl,
  extractCoachingErrorMessage,
} from "@/lib/coachingApi";
import { prepareFileRows } from "@/lib/coachingPrepare";

function shareNote(viewerRole: "tutor" | "student" | undefined, otherName: string | null | undefined): string {
  if (viewerRole === "tutor") {
    const first = otherName?.trim().split(/\s+/)[0] || "Öğrenci";
    return `${first} bu dosyaları görür ve kendisi de dosya yükleyebilir.`;
  }
  if (viewerRole === "student") return "Hocan bu dosyaları görür ve o da dosya yükleyebilir.";
  return "Bu dosyalar öğrenci ve hoca arasında paylaşılır.";
}

/**
 * The files of a coaching period, shared by the tutor and the student: used in
 * the room and on the tutor's Hazırlan page, so a file put there from either
 * side shows up in the same list. The panel says who sees them (the student
 * does, which a tutor could not tell before), and each file says who added it,
 * when, and how big it is. The list is the whole period's, not one meeting's.
 *
 * Plain class strings: tailwind-merge would drop a named size next to a colour.
 */
export function CoachingAttachmentPanel({
  sessionId,
  viewerRole,
  otherName,
  heading = "Görüşme dosyaları",
}: {
  sessionId: string;
  viewerRole?: "tutor" | "student";
  /** The other side's name, for "Ayşe yükledi". */
  otherName?: string | null;
  /** null when the place it sits in (a titled row) already names the list. */
  heading?: string | null;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["coaching-session-attachments", sessionId],
    queryFn: () => fetchCoachingSessionAttachments(sessionId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadCoachingSessionAttachment(sessionId, file),
    onSuccess: () => {
      toast.success("Dosya yüklendi.");
      queryClient.invalidateQueries({ queryKey: ["coaching-session-attachments", sessionId] });
    },
    onError: (err) => toast.error(extractCoachingErrorMessage(err)),
  });

  const handleDownload = async (attachmentId: string) => {
    try {
      const { url } = await fetchCoachingAttachmentDownloadUrl(attachmentId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(extractCoachingErrorMessage(err));
    }
  };

  const rows = prepareFileRows({ items: query.data ?? [], viewerRole, otherName });

  return (
    <div className="space-y-3">
      <div>
        {heading ? <h3 className="text-small font-medium text-ink">{heading}</h3> : null}
        <p className={`${heading ? "mt-0.5 " : ""}text-small text-ink-mid`}>{shareNote(viewerRole, otherName)}</p>
      </div>
      <CoachingFilePicker
        label="Dosya yükle"
        hint="PDF, JPG, PNG, WebP, DOCX veya PPTX."
        accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
        tone="gold"
        busy={uploadMutation.isPending}
        onFile={(file) => uploadMutation.mutate(file)}
      />
      {query.isError ? (
        <CoachingLoadError
          message="Dosyalar yüklenemedi."
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : query.isLoading ? null : rows.length === 0 ? (
        <p className="text-small text-ink-mid">Henüz dosya yok.</p>
      ) : (
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-small font-medium text-ink">{row.name}</p>
                <p className="text-small text-ink-mid">{`${row.who} · ${row.when} · ${row.size}`}</p>
              </div>
              <Button type="button" size="sm" variant="gold" className="min-h-11" onClick={() => handleDownload(row.id)}>
                İndir
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
