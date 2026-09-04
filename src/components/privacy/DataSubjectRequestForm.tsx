"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PrivacyNotice } from "@/components/privacy/PrivacyNotice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchConsentState,
  fetchDataSubjectRequests,
  submitDataSubjectRequest,
  type DataSubjectRequestType,
} from "@/lib/privacyApi";

const REQUEST_TYPES: { value: DataSubjectRequestType; label: string }[] = [
  { value: "info", label: "Verilerim hakkında bilgi istiyorum" },
  { value: "correction", label: "Yanlış olan bir bilgimi düzeltin" },
  { value: "deletion", label: "Verilerimin silinmesini istiyorum" },
  { value: "objection", label: "Otomatik bir karara itiraz ediyorum" },
  { value: "transfer_info", label: "Verilerim kimlere aktarıldı?" },
];

const STATUS_LABELS: Record<string, string> = {
  received: "Alındı",
  in_review: "İnceleniyor",
  completed: "Tamamlandı",
  rejected: "Reddedildi",
};

export function DataSubjectRequestForm() {
  const queryClient = useQueryClient();
  const [requestType, setRequestType] =
    useState<DataSubjectRequestType>("info");
  const [message, setMessage] = useState("");

  const { data: requests } = useQuery({
    queryKey: ["privacy", "requests"],
    queryFn: fetchDataSubjectRequests,
  });
  const { data: consentState } = useQuery({
    queryKey: ["privacy", "consents"],
    queryFn: fetchConsentState,
  });
  // The published address comes from the backend so the two cannot drift.
  // The fallback only covers the request failing outright.
  const contactEmail =
    consentState?.contact_email ?? "iletisim@hocamozelders.com";

  const mutation = useMutation({
    mutationFn: () => submitDataSubjectRequest(requestType, message),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["privacy", "requests"] });
      setMessage("");
      toast.success("Başvurun alındı. En geç 30 gün içinde döneceğiz.");
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 503) {
        toast.error(
          `Çevrimiçi kanal şu anda kullanılamıyor. Başvurunu ${contactEmail} adresine gönderebilirsin.`,
        );
        return;
      }
      toast.error("Başvuru gönderilemedi. Tekrar dener misin?");
    },
  });

  return (
    <div className="space-y-6">
      {consentState?.request_channel_enabled ? (
        <div className="space-y-4 rounded-card border border-line bg-surface p-5">
          <div className="space-y-2">
            {REQUEST_TYPES.map((option) => (
              <label
                key={option.value}
                className="flex min-h-9 cursor-pointer items-center gap-2 text-small text-ink"
              >
                <input
                  type="radio"
                  name="request_type"
                  value={option.value}
                  checked={requestType === option.value}
                  onChange={() => setRequestType(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>

          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Talebini kısaca anlatabilirsin (isteğe bağlı)."
            rows={4}
          />

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Başvuruyu gönder
          </Button>
        </div>
      ) : (
        <PrivacyNotice title="Çevrimiçi başvuru kanalı henüz etkin değil">
          Başvurunu her zaman{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="font-medium text-ink underline underline-offset-2 transition-colors duration-[var(--duration-state)] hover:text-pink"
          >
            {contactEmail}
          </a>{" "}
          adresine gönderebilirsin. En geç 30 gün içinde cevaplarız.
        </PrivacyNotice>
      )}

      {requests && requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-body font-medium text-ink">Önceki başvurularım</h3>
          <ul className="space-y-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-input border border-line bg-surface px-4 py-3 text-small text-ink"
              >
                <span>
                  {REQUEST_TYPES.find((t) => t.value === request.request_type)
                    ?.label ?? request.request_type}
                </span>
                <span className="tabular-nums text-ink-mid">
                  {STATUS_LABELS[request.status] ?? request.status} ·{" "}
                  {new Date(request.received_at).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
