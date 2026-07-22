"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ExternalLink, FileText, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteTutorStudentMaterial,
  fetchTutorStudentMaterialAccess,
  fetchTutorStudentMaterials,
  uploadTutorStudentMaterial,
} from "@/lib/notificationsApi";
import { cn, formatDate } from "@/lib/utils";
import type { TutorStudentMaterial } from "@/types";

const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;
const ACCEPTED_MATERIALS: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
};

export function formatMaterialSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) {
    return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(bytes / 1024) + " KB";
  }
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024)) + " MB";
}

export function validateMaterialFile(file: File): string | null {
  if (file.size > MAX_MATERIAL_BYTES) return "Dosya 25 MB veya daha küçük olmalı.";
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en-US") ?? "";
  if (!ACCEPTED_MATERIALS[extension]?.includes(file.type)) {
    return "PDF, JPG, PNG, WebP, DOCX veya PPTX dosyası seç.";
  }
  return null;
}

export interface TutorStudentMaterialsViewProps {
  materials: TutorStudentMaterial[];
  isLoading: boolean;
  isError: boolean;
  isUploading: boolean;
  uploadProgress: number;
  deletingMaterial: TutorStudentMaterial | null;
  isDeleting: boolean;
  compact?: boolean;
  onRetry: () => void;
  onSelectFile: (file: File) => void;
  onOpen: (material: TutorStudentMaterial) => void;
  onDownload: (material: TutorStudentMaterial) => void;
  onRequestDelete: (material: TutorStudentMaterial) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (material: TutorStudentMaterial) => void;
}

export function TutorStudentMaterialsView({
  materials,
  isLoading,
  isError,
  isUploading,
  uploadProgress,
  deletingMaterial,
  isDeleting,
  compact = false,
  onRetry,
  onSelectFile,
  onOpen,
  onDownload,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: TutorStudentMaterialsViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Paperclip className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Materyaller</h3>
            <p className="text-xs text-muted-foreground">Yalnızca sana görünür; öğrenciyle paylaşılmaz.</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.pptx"
          disabled={isUploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelectFile(file);
            event.currentTarget.value = "";
          }}
        />
        <Button size="sm" variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
          {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Dosya ekle
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WebP, DOCX veya PPTX · En fazla 25 MB</p>
      {isUploading && (
        <div className="space-y-1" aria-live="polite">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: uploadProgress + "%" }} />
          </div>
          <p className="text-xs text-muted-foreground">{"%" + uploadProgress + " yükleniyor"}</p>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2" data-testid="materials-loading">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p className="text-destructive">Materyaller yüklenemedi.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>Yeniden dene</Button>
        </div>
      ) : materials.length === 0 ? (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Bu öğrenci için henüz materyal eklemedin.
        </p>
      ) : (
        <div className={cn("space-y-2", compact && "max-h-56 overflow-y-auto pr-1")}>
          {materials.map((material) => (
            <article key={material.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={material.original_name}>{material.original_name}</p>
                <p className="text-xs text-muted-foreground">
                  {material.file_extension.toLocaleUpperCase("tr-TR")} · {formatMaterialSize(material.size_bytes)}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(material.created_at)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={material.original_name + " dosyasını aç"} onClick={() => onOpen(material)}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={material.original_name + " dosyasını indir"} onClick={() => onDownload(material)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label={material.original_name + " dosyasını sil"} onClick={() => onRequestDelete(material)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog open={Boolean(deletingMaterial)} onOpenChange={(open) => { if (!open) onCancelDelete(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Materyali sil?</DialogTitle>
            <DialogDescription>
              <strong className="font-medium text-foreground">{deletingMaterial?.original_name}</strong> kalıcı olarak silinecek.{" "}
              <span>Bu işlem geri alınamaz.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancelDelete} disabled={isDeleting}>Vazgeç</Button>
            <Button variant="destructive" onClick={() => deletingMaterial && onConfirmDelete(deletingMaterial)} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Evet, sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function TutorStudentMaterials({ studentId, compact = false }: { studentId: string; compact?: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = ["tutor-student-materials", studentId];
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingMaterial, setDeletingMaterial] = useState<TutorStudentMaterial | null>(null);
  const materialsQuery = useQuery({
    queryKey,
    queryFn: () => fetchTutorStudentMaterials(studentId),
    enabled: Boolean(studentId),
  });
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadTutorStudentMaterial(studentId, file, setUploadProgress),
    onMutate: () => setUploadProgress(0),
    onSuccess: async () => {
      setUploadProgress(100);
      await queryClient.invalidateQueries({ queryKey });
      toast.success("Materyal eklendi.");
    },
    onError: () => toast.error("Materyal yüklenemedi."),
    onSettled: () => setUploadProgress(0),
  });
  const deleteMutation = useMutation({
    mutationFn: (material: TutorStudentMaterial) => deleteTutorStudentMaterial(material.id),
    onSuccess: async (result) => {
      setDeletingMaterial(null);
      await queryClient.invalidateQueries({ queryKey });
      if (result.status === "delete_pending") toast.info("Silme tamamlanıyor. Dosya listeden kaldırıldı.");
      else toast.success("Materyal silindi.");
    },
    onError: () => toast.error("Materyal silinemedi."),
  });

  const requestAccess = async (material: TutorStudentMaterial, disposition: "inline" | "attachment") => {
    const openedWindow = disposition === "inline" ? window.open("", "_blank") : null;
    try {
      const access = await fetchTutorStudentMaterialAccess(material.id, disposition);
      if (disposition === "inline") {
        if (!openedWindow) {
          toast.error("Tarayıcı yeni pencereyi engelledi. Açılır pencerelere izin verip tekrar dene.");
          return;
        }
        openedWindow.opener = null;
        openedWindow.location.href = access.url;
        return;
      }
      const link = document.createElement("a");
      link.href = access.url;
      link.download = material.original_name;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      openedWindow?.close();
      toast.error(disposition === "inline" ? "Materyal açılamadı." : "Materyal indirilemedi.");
    }
  };

  return (
    <TutorStudentMaterialsView
      materials={materialsQuery.data ?? []}
      isLoading={materialsQuery.isLoading}
      isError={materialsQuery.isError}
      isUploading={uploadMutation.isPending}
      uploadProgress={uploadProgress}
      deletingMaterial={deletingMaterial}
      isDeleting={deleteMutation.isPending}
      compact={compact}
      onRetry={() => materialsQuery.refetch()}
      onSelectFile={(file) => {
        const error = validateMaterialFile(file);
        if (error) return toast.error(error);
        uploadMutation.mutate(file);
      }}
      onOpen={(material) => requestAccess(material, "inline")}
      onDownload={(material) => requestAccess(material, "attachment")}
      onRequestDelete={setDeletingMaterial}
      onCancelDelete={() => setDeletingMaterial(null)}
      onConfirmDelete={(material) => deleteMutation.mutate(material)}
    />
  );
}
