"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowSquareOut, DownloadSimple, FileText, SpinnerGap, Paperclip, Trash, UploadSimple, WarningCircle } from "@phosphor-icons/react";
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
  getMaterialUploadError,
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
    <section className="space-y-4 rounded-card border border-line bg-white p-4 text-ink sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex shrink-0 items-center justify-center">
            <Paperclip size={24} aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-medium">Materyaller</h3>
            <p className="text-xs text-ink-mid">Yalnızca sana görünür; öğrenciyle paylaşılmaz.</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          aria-label="Özel materyal dosyası seç"
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
          {isUploading ? <SpinnerGap size={20} className="mr-2 animate-spin" aria-hidden="true" /> : <UploadSimple size={20} className="mr-2" aria-hidden="true" />}
          Dosya ekle
        </Button>
      </div>
      <p className="text-xs text-ink-mid">PDF, JPG, PNG, WebP, DOCX veya PPTX · En fazla 25 MB</p>
      {isUploading && (
        <div className="space-y-1" aria-live="polite">
          <div className="h-2 overflow-hidden rounded-pill bg-line" role="progressbar" aria-label="Materyal yükleniyor" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}>
            <div className="h-full rounded-pill bg-ink transition-none" style={{ width: uploadProgress + "%" }} />
          </div>
          <p className="text-xs tabular-nums text-ink-mid">{"%" + uploadProgress + " yükleniyor"}</p>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2" data-testid="materials-loading" role="status" aria-label="Materyaller yükleniyor" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <div className="rounded-input border border-error p-3 text-sm">
          <p className="flex items-center gap-2 text-error" role="alert"><WarningCircle size={20} aria-hidden="true" />Materyaller yüklenemedi.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>Yeniden dene</Button>
        </div>
      ) : materials.length === 0 ? (
        <p className="rounded-input border border-dashed border-line bg-paper p-3 text-sm text-ink-mid">
          Bu öğrenci için henüz materyal eklemedin.
        </p>
      ) : (
        <div className={cn("space-y-2", compact && "max-h-56 overflow-y-auto pr-1")}>
          {materials.map((material) => (
            <article key={material.id} className="flex flex-wrap items-center gap-3 rounded-input border border-line bg-white p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-paper text-ink-mid">
                <FileText size={20} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 basis-40">
                <p className="truncate text-sm font-medium" title={material.original_name}>{material.original_name}</p>
                <p className="text-xs tabular-nums text-ink-mid">
                  {material.file_extension.toLocaleUpperCase("tr-TR")} · {formatMaterialSize(material.size_bytes)}
                </p>
                <p className="text-xs tabular-nums text-ink-mid">{formatDate(material.created_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" className="px-3" aria-label={material.original_name + " dosyasını aç"} onClick={() => onOpen(material)}>
                  <ArrowSquareOut size={20} className="mr-2" aria-hidden="true" />Aç
                </Button>
                <Button size="sm" variant="ghost" className="px-3" aria-label={material.original_name + " dosyasını indir"} onClick={() => onDownload(material)}>
                  <DownloadSimple size={20} className="mr-2" aria-hidden="true" />İndir
                </Button>
                <Button size="sm" variant="ghost" className="px-3 text-error" disabled={isDeleting} aria-label={material.original_name + " dosyasını sil"} onClick={() => onRequestDelete(material)}>
                  <Trash size={20} className="mr-2" aria-hidden="true" />Sil
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog open={Boolean(deletingMaterial)} onOpenChange={(open) => { if (!open && !isDeleting) onCancelDelete(); }}>
        <DialogContent className="rounded-modal border-line bg-white text-ink sm:max-w-md" showClose={!isDeleting}>
          <DialogHeader>
            <DialogTitle>Materyali sil?</DialogTitle>
            <DialogDescription>
              <strong className="font-medium text-ink">{deletingMaterial?.original_name}</strong> kalıcı olarak silinecek.{" "}
              <span>Bu işlem geri alınamaz.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCancelDelete} disabled={isDeleting}>Vazgeç</Button>
            <Button variant="destructive" onClick={() => deletingMaterial && onConfirmDelete(deletingMaterial)} disabled={isDeleting}>
              {isDeleting && <SpinnerGap size={20} className="mr-2 animate-spin" aria-hidden="true" />}
              Evet, sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function TutorStudentMaterials(props: { studentId: string; compact?: boolean }) {
  return <StudentMaterials key={props.studentId} {...props} />;
}

function StudentMaterials({ studentId, compact = false }: { studentId: string; compact?: boolean }) {
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
    onError: (error) => toast.error(getMaterialUploadError(error)),
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
