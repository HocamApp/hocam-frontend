"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileCheck2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  decideAdminTutorVerification,
  fetchAdminTutorVerificationPreview,
  fetchAdminTutorVerifications,
} from "@/lib/adminControlApi";
import type { AdminTutorVerification } from "@/types";

type StatusFilter = "pending" | "approved" | "rejected";

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    return response?.data?.detail || fallback;
  }
  return fallback;
}

function ReviewCard({
  verification,
  rejectionReasons,
  onPreview,
}: {
  verification: AdminTutorVerification;
  rejectionReasons: Array<{ value: string; label: string }>;
  onPreview: (verification: AdminTutorVerification, type: "student_id" | "yks_result") => void;
}) {
  const queryClient = useQueryClient();
  const [reasonCode, setReasonCode] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const decision = useMutation({
    mutationFn: (status: "approved" | "rejected") =>
      decideAdminTutorVerification(verification.id, {
        status,
        rejection_reason_code: status === "rejected" ? reasonCode : undefined,
        rejection_reason: status === "rejected" ? reasonNote : undefined,
      }),
    onSuccess: (result) => {
      toast.success(result.status === "approved" ? "Hoca doğrulandı." : "Başvuru reddedildi.");
      queryClient.invalidateQueries({ queryKey: ["admin-tutor-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-control-monitor"] });
    },
    onError: (error) => toast.error(errorMessage(error, "Karar kaydedilemedi.")),
  });
  const canApprove = verification.security_status === "safe";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{verification.tutor_name || verification.account_email}</CardTitle>
            <CardDescription className="mt-1">
              {verification.university} · {verification.department} · YKS sırası: {verification.declared_yks_rank.toLocaleString("tr-TR")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={verification.status === "pending" ? "secondary" : "outline"}>
              {verification.status === "pending" ? "İnceleme bekliyor" : verification.status === "approved" ? "Onaylandı" : "Reddedildi"}
            </Badge>
            <Badge variant={canApprove ? "outline" : "destructive"}>
              {canApprove ? "Güvenlik kontrolü tamam" : `Güvenlik: ${verification.security_status}`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Hesap:</span> {verification.account_email}</p>
          <p><span className="text-muted-foreground">Üniversite maili:</span> {verification.university_email}</p>
          <p><span className="text-muted-foreground">Başvuru:</span> {new Date(verification.submitted_at).toLocaleString("tr-TR")}</p>
          <p><span className="text-muted-foreground">Belge durumu:</span> {verification.documents_deleted_at ? "Saklama süresi sonunda silindi" : "Güvenli alanda"}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={!verification.preview_available.student_id} onClick={() => onPreview(verification, "student_id")}>
            <ExternalLink className="mr-2 h-4 w-4" />Öğrenci belgesini aç
          </Button>
          <Button type="button" variant="outline" disabled={!verification.preview_available.yks_result} onClick={() => onPreview(verification, "yks_result")}>
            <ExternalLink className="mr-2 h-4 w-4" />YKS belgesini aç
          </Button>
        </div>

        {Object.keys(verification.security_report || {}).length > 0 && (
          <details className="rounded-lg border p-3 text-sm">
            <summary className="cursor-pointer font-medium">Otomatik güvenlik kontrolü ayrıntıları</summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(verification.security_report, null, 2)}</pre>
          </details>
        )}

        {verification.status === "pending" && (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <div className="grid gap-3 md:grid-cols-[240px_1fr]">
              <select aria-label="Ret sebebi" className="h-10 rounded-md border bg-background px-3 text-sm" value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
                <option value="">Ret sebebi seç</option>
                {rejectionReasons.map((reason) => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
              </select>
              <Input aria-label="İnceleme notu" value={reasonNote} onChange={(event) => setReasonNote(event.target.value)} placeholder="İsteğe bağlı açıklama (hocaya gösterilir)" maxLength={1000} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!canApprove || decision.isPending} onClick={() => { if (window.confirm("Belgeler ve beyan edilen YKS sırası uyuşuyor mu? Hoca doğrulansın mı?")) decision.mutate("approved"); }}>
                <CheckCircle2 className="mr-2 h-4 w-4" />Onayla
              </Button>
              <Button type="button" variant="destructive" disabled={!reasonCode || decision.isPending} onClick={() => { if (window.confirm("Başvuru seçilen sebeple reddedilsin mi?")) decision.mutate("rejected"); }}>
                <XCircle className="mr-2 h-4 w-4" />Reddet
              </Button>
              {!canApprove && <p className="self-center text-xs text-destructive">Güvenlik taraması tamamlanmadan onay verilemez.</p>}
            </div>
          </div>
        )}

        {verification.status === "rejected" && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{verification.rejection_reason || "Yapılandırılmış ret sebebi kaydedildi."}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TutorVerificationReviewPanel() {
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const query = useQuery({
    queryKey: ["admin-tutor-verifications", status],
    queryFn: () => fetchAdminTutorVerifications(status),
  });

  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);

  async function openPreview(verification: AdminTutorVerification, type: "student_id" | "yks_result") {
    setPreviewLoading(true);
    try {
      const blob = await fetchAdminTutorVerificationPreview(verification.id, type);
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return { url: URL.createObjectURL(blob), title: type === "student_id" ? "Öğrenci belgesi" : "YKS sonuç belgesi" };
      });
    } catch (error) {
      toast.error(errorMessage(error, "Güvenli önizleme açılamadı. Belge yetkinizi kontrol edin."));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><FileCheck2 className="h-5 w-5" />Hoca belge kontrolü</h2>
          <p className="mt-1 text-sm text-muted-foreground">Temizlenmiş önizlemeleri karşılaştır, otomatik kontrolleri gör ve gerekçeli karar ver.</p>
        </div>
        <div className="flex gap-2">
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
            <option value="pending">İnceleme bekleyenler</option>
            <option value="approved">Onaylananlar</option>
            <option value="rejected">Reddedilenler</option>
          </select>
          <Button type="button" variant="outline" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Yenile</Button>
        </div>
      </div>

      {query.isLoading && <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Başvurular yükleniyor…</p>}
      {query.isError && <p className="rounded-lg border border-red-200 p-8 text-center text-sm text-destructive">Başvurular yüklenemedi.</p>}
      {query.data?.results.length === 0 && <p className="rounded-lg border p-8 text-center text-sm text-muted-foreground">Bu durumda başvuru yok.</p>}
      <div className="space-y-4">
        {query.data?.results.map((verification) => <ReviewCard key={verification.id} verification={verification} rejectionReasons={query.data.rejection_reasons} onPreview={openPreview} />)}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-h-[95vh] max-w-5xl overflow-auto">
          <DialogHeader><DialogTitle>{preview?.title} — güvenli önizleme</DialogTitle></DialogHeader>
          {/* Blob URLs are authenticated, short-lived admin evidence and cannot use Next Image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview.url} alt={preview.title} className="mx-auto max-h-[80vh] w-auto rounded border" />}
        </DialogContent>
      </Dialog>
      {previewLoading && <p className="fixed bottom-4 right-4 rounded-md bg-foreground px-3 py-2 text-sm text-background shadow">Güvenli önizleme yükleniyor…</p>}
    </div>
  );
}
