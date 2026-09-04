"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "@phosphor-icons/react";

import { PrivacyNotice } from "@/components/privacy/PrivacyNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { consentCopyForRole } from "@/lib/consentCopy";
import {
  fetchConsentState,
  startGuardianApproval,
  submitBirthDate,
  updateConsent,
  type ConsentPurpose,
} from "@/lib/privacyApi";
import { cn } from "@/lib/utils";

function ConsentSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="rounded-card border border-line p-5">
          <div className="h-4 w-40 animate-skeleton-pulse rounded-pill bg-skeleton" />
          <div className="mt-3 h-3 w-full animate-skeleton-pulse rounded-pill bg-skeleton" />
          <div className="mt-2 h-3 w-3/5 animate-skeleton-pulse rounded-pill bg-skeleton" />
        </div>
      ))}
    </div>
  );
}

export function ConsentSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["privacy", "consents"],
    queryFn: fetchConsentState,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["privacy", "consents"] });

  const consentMutation = useMutation({
    mutationFn: ({
      purpose,
      granted,
    }: {
      purpose: ConsentPurpose;
      granted: boolean;
    }) => updateConsent(purpose, granted),
    onSuccess: (_result, variables) => {
      void invalidate();
      toast.success(
        variables.granted ? "Onayın kaydedildi." : "Onayın geri alındı.",
      );
    },
    onError: (error: unknown) => {
      // 409 is the backend telling us a minor needs a guardian first. It is a
      // normal outcome of the flow, not a failure to apologise for.
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) {
        toast.error("Bu onay için önce velinin onayı gerekiyor.");
        return;
      }
      if (status === 503) {
        toast.error("Yeni onay toplama hukuki inceleme tamamlanana kadar kapalı.");
        return;
      }
      toast.error("Onay kaydedilemedi. Tekrar dener misin?");
    },
  });

  const birthDateMutation = useMutation({
    mutationFn: (value: string) => submitBirthDate(value),
    onSuccess: () => {
      void invalidate();
      toast.success("Doğum tarihin kaydedildi.");
    },
    onError: () => toast.error("Doğum tarihi kaydedilemedi."),
  });

  const guardianMutation = useMutation({
    mutationFn: (email: string) =>
      startGuardianApproval(
        email,
        (data?.guardian_required_purposes ?? []) as ConsentPurpose[],
      ),
    onSuccess: () => {
      toast.success("Veline onay e-postası gönderildi.");
      setGuardianEmail("");
    },
    onError: () => toast.error("Onay e-postası gönderilemedi."),
  });

  if (isPending) return <ConsentSkeleton />;

  // The old code returned the loading line whenever `data` was missing, which
  // meant a failed request sat on "Yükleniyor…" forever with no way out.
  if (isError || !data) {
    return (
      <PrivacyNotice tone="attention" title="Onayların yüklenemedi">
        <p>
          Bağlantı kurulamadı, bu yüzden hangi onayları verdiğini
          gösteremiyoruz.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Deneniyor…" : "Tekrar dene"}
        </Button>
      </PrivacyNotice>
    );
  }

  const items = consentCopyForRole(user?.role);
  const needsBirthDate = data.collection_enabled && data.birth_date === null;
  const isMinor = data.is_minor === true;
  const grantedCount = items.filter(
    (item) => data.consents[item.purpose] ?? false,
  ).length;

  return (
    <div className="space-y-6">
      <p className="text-small text-ink-mid">
        {grantedCount === 0
          ? "Şu anda etkin bir açık rızan bulunmuyor."
          : `${items.length} onaydan ${grantedCount} tanesi etkin.`}
      </p>

      {!data.collection_enabled && (
        <PrivacyNotice title="Yeni onay toplama şu anda kapalı">
          Her işlemin hukuki dayanağı bağımsız olarak doğrulanana kadar yeni
          açık rıza toplamıyoruz. Aşağıdaki liste, verebileceğin onayların
          tamamını ve mevcut durumunu gösterir. Daha önce verdiğin bir onay
          varsa geri almaya her zaman devam edebilirsin.
        </PrivacyNotice>
      )}

      {needsBirthDate && (
        <div className="rounded-card border border-line bg-surface p-5">
          <h3 className="text-body font-medium text-ink">
            Doğum tarihini soruyoruz
          </h3>
          <p className="mt-1 max-w-[60ch] text-small leading-[1.6] text-ink-mid">
            18 yaşından küçüksen bazı özellikler için velinin onayı gerekiyor.
            Ders alma ve mesajlaşma her hâlükârda açık kalır.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="w-44"
              aria-label="Doğum tarihi"
            />
            <Button
              onClick={() => birthDateMutation.mutate(birthDate)}
              disabled={!birthDate || birthDateMutation.isPending}
            >
              Kaydet
            </Button>
          </div>
        </div>
      )}

      {data.guardian_approval_enabled && isMinor && (
        <div className="rounded-card border border-line bg-surface p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck
              weight="regular"
              className="mt-0.5 h-5 w-5 shrink-0 text-ink"
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="text-body font-medium text-ink">Veli onayı</h3>
              <p className="mt-1 max-w-[60ch] text-small leading-[1.6] text-ink-mid">
                18 yaşından küçük olduğun için aşağıdaki onaylardan bazıları
                velinin onayına bağlı. Velinin e-posta adresini yaz, onay
                bağlantısını ona gönderelim.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Input
                  type="email"
                  placeholder="veli@ornek.com"
                  value={guardianEmail}
                  onChange={(event) => setGuardianEmail(event.target.value)}
                  className="w-64"
                  aria-label="Veli e-posta adresi"
                />
                <Button
                  onClick={() => guardianMutation.mutate(guardianEmail)}
                  disabled={!guardianEmail || guardianMutation.isPending}
                >
                  Onay bağlantısı gönder
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Every purpose is listed, granted or not. Hiding the ones you cannot
          currently grant left this page blank, which read as broken rather
          than as "nothing is switched on". */}
      <ul className="space-y-3">
        {items.map((item) => {
          const granted = data.consents[item.purpose] ?? false;
          const guardianGated =
            data.guardian_required_purposes.includes(item.purpose) && isMinor;

          return (
            <li
              key={item.purpose}
              className="rounded-card border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                <div className="min-w-0 max-w-[60ch] space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-pill border border-line px-2 py-0.5 text-label tabular-nums text-ink-mid">
                      {item.code}
                    </span>
                    <h3 className="text-body font-medium text-ink">
                      {item.title}
                    </h3>
                    <span
                      className={cn(
                        "rounded-pill px-2 py-0.5 text-label",
                        granted
                          ? "bg-ink text-white"
                          : "border border-line text-ink-mid",
                      )}
                    >
                      {granted ? "Onaylı" : "Onaylı değil"}
                    </span>
                  </div>
                  <p className="text-small leading-[1.6] text-ink-mid">
                    {item.body}
                  </p>
                  <p className="text-small leading-[1.6] text-ink-mid">
                    <span className="font-medium text-ink">
                      Onay vermezsen:
                    </span>{" "}
                    {item.ifDeclined}
                  </p>
                  {guardianGated && (
                    <p className="text-small text-ink-mid">
                      Bu onay için velinin onayı gerekiyor.
                    </p>
                  )}
                </div>

                {/* Granting and withdrawing are the same size and the same
                    number of clicks — taking consent back must not be the
                    harder path. */}
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant={granted ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      consentMutation.mutate({
                        purpose: item.purpose,
                        granted: true,
                      })
                    }
                    disabled={
                      granted ||
                      !data.collection_enabled ||
                      consentMutation.isPending
                    }
                  >
                    <Check weight="regular" className="mr-1 h-4 w-4" />
                    Onay ver
                  </Button>
                  <Button
                    variant={!granted ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      consentMutation.mutate({
                        purpose: item.purpose,
                        granted: false,
                      })
                    }
                    disabled={!granted || consentMutation.isPending}
                  >
                    <X weight="regular" className="mr-1 h-4 w-4" />
                    Onayı geri al
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-label tabular-nums text-ink-mid">
        Onay metni sürümü: {data.text_version}
      </p>
    </div>
  );
}
