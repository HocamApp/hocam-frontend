"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarX, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  disconnectGoogleCalendar,
  fetchGoogleCalendarConnection,
  startGoogleCalendarConnection,
} from "@/lib/googleCalendarApi";
import { useGoogleCalendarCallbackResult } from "@/hooks/useGoogleCalendarCallbackResult";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GoogleCalendarConnection } from "@/types/api";

export const GOOGLE_CALENDAR_QUERY_KEY = ["tutor", "google-calendar"] as const;

/**
 * Shown to the tutor before disconnecting. The wording is deliberate: nothing
 * is deleted in Google, only future syncing stops.
 */
export const DISCONNECT_CONFIRMATION =
  "Mevcut etkinlikler Google Calendar'da kalır. Bundan sonraki rezervasyon değişiklikleri senkronize edilmez.";

export interface GoogleCalendarConnectionCardViewProps {
  connection: GoogleCalendarConnection | null;
  isLoading: boolean;
  isError: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  isConfirmingDisconnect: boolean;
  onRetry: () => void;
  onConnect: () => void;
  onRequestDisconnect: () => void;
  onCancelDisconnect: () => void;
  onConfirmDisconnect: () => void;
}

export function GoogleCalendarConnectionCardView({
  connection,
  isLoading,
  isError,
  isConnecting,
  isDisconnecting,
  isConfirmingDisconnect,
  onRetry,
  onConnect,
  onRequestDisconnect,
  onCancelDisconnect,
  onConfirmDisconnect,
}: GoogleCalendarConnectionCardViewProps) {
  if (isLoading) {
    return (
      <div
        className="rounded-lg border bg-card p-4"
        data-testid="google-calendar-loading"
      >
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
    );
  }

  if (isError || !connection) {
    return (
      <div className="rounded-lg border bg-card p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Google Calendar durumu şu anda yüklenemedi.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full sm:mt-0 sm:w-auto"
          onClick={onRetry}
        >
          Yeniden dene
        </Button>
      </div>
    );
  }

  const isConnected = connection.status === "connected";
  const needsReauthorization = connection.status === "reauthorization_required";

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          {isConnected ? (
            <CalendarCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-primary"
              aria-hidden="true"
            />
          ) : needsReauthorization ? (
            <RefreshCw
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          ) : (
            <CalendarX
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">Google Calendar</p>
            {isConnected && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {connection.account_email
                  ? `${connection.account_email} · ${connection.calendar_name}`
                  : connection.calendar_name}
              </p>
            )}
            {needsReauthorization && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Erişim sona erdi. Rezervasyonların aktarılmaya devam etsin
                istiyorsan yeniden bağlan.
              </p>
            )}
            {!isConnected && !needsReauthorization && (
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Bağlarsan rezervasyonların &quot;Hocam Dersleri&quot; takvimine
                otomatik eklenir.
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:mt-0 sm:flex-row sm:items-center">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestDisconnect}
              disabled={isDisconnecting || isConfirmingDisconnect}
            >
              Bağlantıyı kes
            </Button>
          ) : (
            <Button size="sm" onClick={onConnect} disabled={isConnecting}>
              {isConnecting
                ? "Yönlendiriliyor…"
                : needsReauthorization
                  ? "Yeniden bağla"
                  : "Google Calendar'a bağla"}
            </Button>
          )}
        </div>
      </div>

      {isConfirmingDisconnect && (
        <div
          className="mt-3 rounded-md border border-dashed p-3"
          data-testid="google-calendar-disconnect-confirm"
        >
          <p className="text-xs leading-5 text-muted-foreground">
            {DISCONNECT_CONFIRMATION}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="destructive"
              size="sm"
              onClick={onConfirmDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Kesiliyor…" : "Evet, bağlantıyı kes"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelDisconnect}
              disabled={isDisconnecting}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Owner-only Google Calendar control, rendered inside the profile's
 * availability section. Students and visitors never see this component.
 */
export function GoogleCalendarConnectionCard() {
  const queryClient = useQueryClient();
  const [isConfirmingDisconnect, setIsConfirmingDisconnect] = useState(false);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: GOOGLE_CALENDAR_QUERY_KEY });
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: GOOGLE_CALENDAR_QUERY_KEY,
    queryFn: fetchGoogleCalendarConnection,
  });

  useGoogleCalendarCallbackResult(invalidate);

  const connectMutation = useMutation({
    mutationFn: startGoogleCalendarConnection,
    onSuccess: ({ authorization_url }) => {
      // Full-page navigation, never a popup: Google blocks the consent screen
      // in many popup contexts and the tab may be closed mid-flow.
      window.location.assign(authorization_url);
    },
    onError: () => {
      toast.error("Google Calendar bağlantısı şu anda başlatılamadı.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => {
      setIsConfirmingDisconnect(false);
      toast.success("Google Calendar bağlantın kesildi.");
      invalidate();
    },
    onError: () => {
      toast.error("Bağlantı kesilemedi. Lütfen yeniden dene.");
    },
  });

  return (
    <GoogleCalendarConnectionCardView
      connection={data ?? null}
      isLoading={isLoading}
      isError={isError}
      isConnecting={connectMutation.isPending}
      isDisconnecting={disconnectMutation.isPending}
      isConfirmingDisconnect={isConfirmingDisconnect}
      onRetry={() => void refetch()}
      onConnect={() => connectMutation.mutate()}
      onRequestDisconnect={() => setIsConfirmingDisconnect(true)}
      onCancelDisconnect={() => setIsConfirmingDisconnect(false)}
      onConfirmDisconnect={() => disconnectMutation.mutate()}
    />
  );
}
