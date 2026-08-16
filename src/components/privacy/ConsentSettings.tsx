"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, ShieldCheck, X } from "lucide-react";

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

export function ConsentSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [birthDate, setBirthDate] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");

  const { data, isLoading } = useQuery({
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

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Yükleniyor…</p>;
  }

  const items = consentCopyForRole(user?.role);
  const needsBirthDate = data.birth_date === null;
  const isMinor = data.is_minor === true;

  return (
    <div className="space-y-8">
      {needsBirthDate && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Doğum tarihini soruyoruz</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  18 yaşından küçüksen bazı özellikler için velinin onayı
                  gerekiyor. Ders alma ve mesajlaşma her hâlükârda açık kalır.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </section>
      )}

      {isMinor && (
        <section className="rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Veli onayı</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  18 yaşından küçük olduğun için aşağıdaki onaylardan bazıları
                  velinin onayına bağlı. Velinin e-posta adresini yaz, onay
                  bağlantısını ona gönderelim.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
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
        </section>
      )}

      <section className="space-y-4">
        {items.map((item) => {
          const granted = data.consents[item.purpose] ?? false;
          const guardianGated =
            data.guardian_required_purposes.includes(item.purpose) && isMinor;

          return (
            <div key={item.purpose} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.code}
                    </span>
                    <h3 className="font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-6">{item.body}</p>
                  <p className="text-sm text-muted-foreground">
                    Onay vermezsen: {item.ifDeclined}
                  </p>
                  {guardianGated && (
                    <p className="text-sm text-amber-700 dark:text-amber-500">
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
                    disabled={granted || consentMutation.isPending}
                  >
                    <Check className="mr-1 h-4 w-4" />
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
                    <X className="mr-1 h-4 w-4" />
                    Onayı geri al
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <p className="text-xs text-muted-foreground">
        Onay metni sürümü: {data.text_version}
      </p>
    </div>
  );
}
