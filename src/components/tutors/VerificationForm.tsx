"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVerification, submitVerification } from "@/lib/dashboardApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { cn, formatDate } from "@/lib/utils";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const ACCEPTED_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Shared by both the click-to-browse <input onChange> and the drag-and-drop
// handler so there is exactly one place a file can be rejected, with one
// message, regardless of how it arrived.
function validateDocumentFile(file: File): string | null {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
    return "Desteklenmeyen dosya türü. JPEG, PNG, WEBP veya PDF yükleyin.";
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Dosya çok büyük. En fazla 10 MB yükleyebilirsiniz.";
  }
  return null;
}

export function VerificationForm() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: verification, isLoading } = useQuery({
    queryKey: ["verification"],
    queryFn: async () => {
      try {
        return await fetchVerification();
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) return null;
        throw error;
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification"] });
      setSubmitError(null);
      toast.success("Doğrulama başvurun gönderildi.");
    },
    onError: (error: unknown) => {
      const data = (error as { response?: { data?: unknown } }).response?.data;
      if (data && typeof data === "object") {
        const body = data as Record<string, unknown>;
        const firstFieldError = Object.values(body).find(
          (value) => Array.isArray(value) && value[0]
        );
        if (Array.isArray(firstFieldError) && firstFieldError[0]) {
          setSubmitError(String(firstFieldError[0]));
          return;
        }
        if (typeof body.detail === "string") {
          setSubmitError(body.detail);
          return;
        }
      }
      setSubmitError("Başvuru gönderilemedi. Lütfen bilgileri kontrol edip tekrar deneyin.");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const studentIdFile = formData.get("student_id_document") as File | null;
    const yksFile = formData.get("yks_result_document") as File | null;
    const email = (formData.get("university_email") as string)?.trim();

    if (!studentIdFile?.size || !yksFile?.size || !email) {
      setSubmitError("Tüm alanları doldurun ve her iki belgeyi yükleyin.");
      return;
    }

    const payload = new FormData();
    payload.append("student_id_document", studentIdFile);
    payload.append("yks_result_document", yksFile);
    payload.append("university_email", email);
    submitMutation.mutate(payload);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
  }

  if (verification?.status === "pending") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-950/30">
        <div className="flex gap-3">
          <Clock className="h-10 w-10 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="font-semibold">Başvurunuz İnceleniyor</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Belgeleriniz yöneticilerimiz tarafından inceleniyor. Bu süreç
              genellikle 1-2 iş günü sürer.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Başvuru tarihi: {formatDate(verification.submitted_at)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verification?.status === "approved") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50/50 p-6 dark:border-green-800 dark:bg-green-950/30">
        <div className="flex gap-3">
          <CheckCircle className="h-10 w-10 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="font-semibold">Hesabınız Doğrulandı ✓</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Profilinizde onaylı rozeti görünüyor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verification?.status === "rejected") {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 dark:border-red-800 dark:bg-red-950/30">
          <div className="flex gap-3">
            <XCircle className="h-10 w-10 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold">Başvurunuz Reddedildi</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {verification.rejection_reason
                  ? verification.rejection_reason
                  : "Belgeleriniz doğrulanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin."}
              </p>
            </div>
          </div>
        </div>

        <VerificationUploadForm
          onSubmit={handleSubmit}
          submitMutation={submitMutation}
          submitError={submitError}
        />
      </div>
    );
  }

  return (
    <VerificationUploadForm
      onSubmit={handleSubmit}
      submitMutation={submitMutation}
      submitError={submitError}
    />
  );
}

function VerificationUploadForm({
  onSubmit,
  submitMutation,
  submitError,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  submitMutation: { mutate: (fd: FormData) => void; isPending: boolean };
  submitError: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Hesabını Doğrula</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Öğrenci kimliğin, YKS sonuç belgen ve üniversite e-posta adresinle
          hesabını doğrula. Onaylanan hocalar daha fazla öğrenciye ulaşır.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FileDropInput
          id="student_id_document"
          name="student_id_document"
          label="Öğrenci Kimliği"
          helperText="Öğrenci kimlik kartınızın fotoğrafı veya taraması"
        />

        <FileDropInput
          id="yks_result_document"
          name="yks_result_document"
          label="YKS Sonuç Belgesi"
          helperText="YKS sonuç belgenizin ekran görüntüsü veya PDF'i"
        />

        <div className="space-y-2">
          <Label htmlFor="university_email">Üniversite E-postası</Label>
          <Input
            id="university_email"
            name="university_email"
            type="email"
            placeholder="isim@universite.edu.tr"
            required
          />
          <p className="text-xs text-muted-foreground">
            .edu.tr uzantılı üniversite e-postanız
          </p>
        </div>

        {submitError && <ErrorMessage message={submitError} />}

        <Button
          type="submit"
          className="w-full"
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Gönderiliyor..." : "Doğrulama Başvurusu Yap"}
        </Button>
      </form>
    </div>
  );
}

function FileDropInput({
  id,
  name,
  label,
  helperText,
}: {
  id: string;
  name: string;
  label: string;
  helperText: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const applyFile = (file: File | undefined) => {
    if (!file) {
      setError(null);
      setFileName(null);
      return;
    }
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(validationError);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setFileName(file.name);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(event.target.files?.[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    // Programmatically assigning to the underlying <input>'s FileList is
    // what keeps the existing FormData(form) submit path working unchanged
    // for dropped files, and what satisfies its native `required` check.
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
    applyFile(file);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "rounded-md border border-dashed p-3 transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-input"
        )}
      >
        <Input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          onChange={handleChange}
        />
        {fileName && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{fileName}</p>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
