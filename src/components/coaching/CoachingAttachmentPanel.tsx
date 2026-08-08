"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  fetchCoachingSessionAttachments,
  uploadCoachingSessionAttachment,
  fetchCoachingAttachmentDownloadUrl,
  extractCoachingErrorMessage,
} from "@/lib/coachingApi";

/** Shared upload/list/download panel — used by both the coaching room
 * (/session/coaching/[sessionId]) and the tutor "Hazırlan" screen, so
 * files uploaded from either side of a session show up in the same list. */
export function CoachingAttachmentPanel({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const { data: attachments } = useQuery({
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

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Görüşme dosyaları</p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-muted">
        {uploadMutation.isPending ? "Yükleniyor..." : "Dosya yükle (PDF, JPG, PNG, WebP, DOCX, PPTX)"}
        <input
          type="file"
          className="hidden"
          disabled={uploadMutation.isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadMutation.mutate(file);
            e.target.value = "";
          }}
        />
      </label>
      <ul className="space-y-1">
        {(attachments ?? []).map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded border px-2 py-1 text-xs">
            <span className="truncate">{a.original_name}</span>
            <Button size="sm" variant="ghost" onClick={() => handleDownload(a.id)}>
              İndir
            </Button>
          </li>
        ))}
        {attachments?.length === 0 && (
          <li className="text-xs text-muted-foreground">Henüz dosya yok.</li>
        )}
      </ul>
    </div>
  );
}
