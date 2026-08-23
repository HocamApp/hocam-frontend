"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmUniversityEmailCode,
  fetchUniversityEmailVerification,
  fetchVerification,
  requestUniversityEmailCode,
  submitVerification,
} from "@/lib/dashboardApi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { cn, formatDate } from "@/lib/utils";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const STUDENT_ID_DOCUMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];
const YKS_DOCUMENT_TYPES = ["application/pdf"];
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Shared by both the click-to-browse <input onChange> and the drag-and-drop
// handler so there is exactly one place a file can be rejected, with one
// message, regardless of how it arrived.
function validateDocumentFile(
  file: File,
  acceptedTypes: readonly string[],
  acceptedTypeMessage: string
): string | null {
  if (!acceptedTypes.includes(file.type)) {
    return acceptedTypeMessage;
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return "Dosya çok büyük. En fazla 10 MB yükleyebilirsiniz.";
  }
  return null;
}

export function VerificationForm() {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [universityEmail, setUniversityEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

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
  const { data: emailProof, isLoading: emailProofLoading } = useQuery({
    queryKey: ["university-email-verification"],
    queryFn: fetchUniversityEmailVerification,
  });

  const emailRequestMutation = useMutation({
    mutationFn: requestUniversityEmailCode,
    onSuccess: (result) => {
      queryClient.setQueryData(["university-email-verification"], result);
      setEmailError(null);
      toast.success("Doğrulama kodu üniversite e-postana gönderildi.");
    },
    onError: (error: unknown) => setEmailError(apiErrorMessage(error, "Kod gönderilemedi.")),
  });
  const emailConfirmMutation = useMutation({
    mutationFn: confirmUniversityEmailCode,
    onSuccess: (result) => {
      queryClient.setQueryData(["university-email-verification"], result);
      setEmailError(null);
      toast.success("Üniversite e-postan doğrulandı.");
    },
    onError: (error: unknown) => setEmailError(apiErrorMessage(error, "Kod doğrulanamadı.")),
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

    if (!studentIdFile?.size || !yksFile?.size) {
      setSubmitError("Her iki belgeyi de yükleyin.");
      return;
    }
    const studentIdError = validateDocumentFile(
      studentIdFile,
      STUDENT_ID_DOCUMENT_TYPES,
      "Öğrenci kimliği için JPEG, PNG veya PDF yükleyin."
    );
    const yksError = validateDocumentFile(
      yksFile,
      YKS_DOCUMENT_TYPES,
      "YKS sonucu için ÖSYM'den indirdiğiniz orijinal PDF'i yükleyin."
    );
    if (studentIdError || yksError) {
      setSubmitError(studentIdError || yksError);
      return;
    }

    const payload = new FormData();
    payload.append("student_id_document", studentIdFile);
    payload.append("yks_result_document", yksFile);
    submitMutation.mutate(payload);
  };

  if (isLoading || emailProofLoading) {
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
            {verification.security_status === "safe" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Dosya güvenlik kontrolü tamamlandı; incelemede yalnızca güvenli önizlemeler açılır.
              </p>
            )}
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

  if (verification?.status === "rejected" && emailProof?.status === "verified") {
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

  if (emailProof?.status !== "verified") {
    return (
      <div className="space-y-5 rounded-lg border p-5">
        {verification?.status === "rejected" && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <p className="font-medium">Önceki başvurun tamamlanamadı</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {verification.rejection_reason || "Yeniden başvurmak için üniversite e-postanı doğrula."}
            </p>
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold">Üniversite e-postanı doğrula</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Profilindeki üniversiteye ait e-posta adresine tek kullanımlık kod göndereceğiz.
            Bu adım yalnızca bu kurumsal gelen kutusuna erişebildiğini kanıtlar.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="university-email-proof">Üniversite e-postası</Label>
          <Input
            id="university-email-proof"
            type="email"
            value={universityEmail}
            onChange={(event) => setUniversityEmail(event.target.value)}
            placeholder="isim@universite.edu.tr"
            autoComplete="email"
            disabled={emailRequestMutation.isPending}
          />
          <p className="text-xs text-muted-foreground">
            Alan adı profilindeki üniversiteyle eşleşmelidir. Adresin listede yoksa destek ekibi alan adını inceleyebilir.
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={emailRequestMutation.isPending || !universityEmail.trim()}
            onClick={() => emailRequestMutation.mutate(universityEmail.trim())}
          >
            {emailRequestMutation.isPending ? "Kod gönderiliyor..." : emailProof?.status === "code_sent" ? "Kodu yeniden gönder" : "Kod gönder"}
          </Button>
        </div>
        {emailProof?.status === "code_sent" && (
          <div className="space-y-2 rounded-lg bg-muted/50 p-4">
            <Label htmlFor="university-email-code">6 haneli kod</Label>
            <Input
              id="university-email-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={emailCode}
              onChange={(event) => setEmailCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
            <p className="text-xs text-muted-foreground">Kod {emailProof.email} adresine gönderildi ve 10 dakika geçerlidir.</p>
            <Button
              type="button"
              disabled={emailConfirmMutation.isPending || emailCode.length !== 6}
              onClick={() => emailConfirmMutation.mutate(emailCode)}
            >
              {emailConfirmMutation.isPending ? "Doğrulanıyor..." : "E-postayı doğrula"}
            </Button>
          </div>
        )}
        {emailError && <ErrorMessage message={emailError} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div><p className="font-medium">Üniversite e-postası doğrulandı</p><p className="text-sm text-muted-foreground">{emailProof.email}</p></div>
      </div>
      <VerificationUploadForm onSubmit={handleSubmit} submitMutation={submitMutation} submitError={submitError} />
    </div>
  );
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } }).response?.data;
  if (!data || typeof data !== "object") return fallback;
  const body = data as Record<string, unknown>;
  const fieldError = Object.values(body).find((value) => Array.isArray(value) && value[0]);
  if (Array.isArray(fieldError) && fieldError[0]) return String(fieldError[0]);
  return typeof body.detail === "string" ? body.detail : fallback;
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
          Üniversite e-postan doğrulandı. Şimdi öğrenci kimliğini ve YKS sonuç
          belgeni incelemeye gönder.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Belgeler özel alanda tutulur; inceleme sonrasında saklama süresi dolunca silinir.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <FileDropInput
          id="student_id_document"
          name="student_id_document"
          label="Öğrenci Kimliği"
          helperText="Öğrenci kimlik kartınızın fotoğrafı veya taraması"
          acceptedTypes={STUDENT_ID_DOCUMENT_TYPES}
          acceptedTypeMessage="Öğrenci kimliği için JPEG, PNG veya PDF yükleyin."
        />

        <FileDropInput
          id="yks_result_document"
          name="yks_result_document"
          label="YKS Sonuç Belgesi"
          helperText="ÖSYM AİS'ten indirdiğiniz orijinal sonuç PDF'i (ekran görüntüsü değil)"
          acceptedTypes={YKS_DOCUMENT_TYPES}
          acceptedTypeMessage="YKS sonucu için ÖSYM'den indirdiğiniz orijinal PDF'i yükleyin."
        />

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
  acceptedTypes,
  acceptedTypeMessage,
}: {
  id: string;
  name: string;
  label: string;
  helperText: string;
  acceptedTypes: readonly string[];
  acceptedTypeMessage: string;
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
    const validationError = validateDocumentFile(file, acceptedTypes, acceptedTypeMessage);
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
          accept={acceptedTypes.join(",")}
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
