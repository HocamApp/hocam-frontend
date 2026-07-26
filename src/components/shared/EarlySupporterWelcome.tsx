"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Heart,
  Percent,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { findUnreadEarlySupporterWelcome } from "@/lib/earlySupporterWelcome";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/lib/notificationsApi";
import type { Notification, NotificationSummary } from "@/types/api";

interface EarlySupporterWelcomeProps {
  enabled: boolean;
}

interface EarlySupporterWelcomeDialogProps {
  welcome: Notification;
  isPending: boolean;
  onAcknowledge: () => void;
}

const highlights = [
  {
    icon: Heart,
    title: "Erken destekçi ayrıcalığı",
    body: "İlk hocalarımız için hazırladığımız lansman avantajlarını sana öncelikli olarak duyuracağız.",
  },
  {
    icon: Percent,
    title: "Komisyon avantajları",
    body: "Erken dönem hocalarımıza özel komisyon fırsatlarının koşullarını netleştiğinde seninle paylaşacağız.",
  },
  {
    icon: BookOpen,
    title: "Birlikte şekillendiriyoruz",
    body: "Deneyimin ve geri bildirimlerin, Hocam'ı öğrenciler ve hocalar için daha iyi hâle getirecek.",
  },
] as const;

export function EarlySupporterWelcome({
  enabled,
}: EarlySupporterWelcomeProps) {
  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled,
    retry: false,
    staleTime: 15_000,
  });
  const welcome = findUnreadEarlySupporterWelcome(notificationsQuery.data);

  const acknowledgeMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Notification[]>(
        ["notifications"],
        (notifications = []) =>
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
      );
      queryClient.setQueryData<NotificationSummary>(
        ["notification-summary"],
        (summary) => {
          if (!summary) return summary;
          const unreadCount = Math.max(0, summary.unread_count - 1);
          return {
            has_unread: unreadCount > 0,
            unread_count: unreadCount,
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notification-summary"] });
    },
    onError: () => {
      toast.error("Mesaj kapatılamadı. Lütfen tekrar dene.");
    },
  });

  if (!welcome) return null;

  return (
    <EarlySupporterWelcomeDialog
      welcome={welcome}
      isPending={acknowledgeMutation.isPending}
      onAcknowledge={() => acknowledgeMutation.mutate(welcome.id)}
    />
  );
}

export function EarlySupporterWelcomeDialog({
  welcome,
  isPending,
  onAcknowledge,
}: EarlySupporterWelcomeDialogProps) {
  return (
    <Dialog open>
      <DialogContent
        showClose={false}
        className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto border-brand-200 bg-transparent p-0 shadow-2xl dark:border-brand-800"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="relative isolate overflow-hidden rounded-lg bg-brand-600 px-5 py-6 text-white sm:px-8 sm:py-8 dark:bg-brand-800">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            aria-hidden="true"
          >
            <span className="absolute left-[6%] top-[8%] rotate-[-12deg] text-2xl font-semibold">
              x² + y²
            </span>
            <span className="absolute right-[7%] top-[9%] rotate-[8deg] text-xl font-medium">
              √144 = 12
            </span>
            <span className="absolute bottom-[12%] left-[8%] rotate-[7deg] text-lg font-medium">
              a² + b² = c²
            </span>
            <span className="absolute bottom-[8%] right-[10%] rotate-[-9deg] text-2xl font-semibold">
              ∑ başarı
            </span>
            <span className="absolute left-[42%] top-[4%] text-5xl font-light">
              π
            </span>
            <span className="absolute bottom-[5%] left-[46%] text-4xl font-light">
              ∞
            </span>
          </div>

          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/15 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-brand-300/30 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <BrandMark
              size="sm"
              className="rounded-full bg-white/95 px-3 py-1.5 text-slate-950 shadow-sm"
            />
            <div className="mt-8 max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Hocam&apos;ın ilk hocalarından
              </div>
              <DialogTitle className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                {welcome.title}
              </DialogTitle>
              <DialogDescription className="mt-3 max-w-2xl text-base leading-7 text-white/85">
                {welcome.body}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="bg-card px-5 py-6 sm:px-8 sm:py-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border border-brand-100 bg-brand-50/70 p-4 dark:border-brand-900 dark:bg-brand-900/20"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-5 text-muted-foreground">
              Bu özel teşekkür notu yalnızca ilk dönem hocalarımız için
              hazırlandı. Avantajların kapsamı ve koşulları ayrıca
              duyurulacaktır.
            </p>
            <Button
              type="button"
              size="lg"
              className="shrink-0 bg-brand-600 text-white shadow-md shadow-brand-600/20 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400"
              disabled={isPending}
              onClick={onAcknowledge}
            >
              {isPending
                ? "Hazırlanıyor…"
                : "Hocam'ı keşfetmeye başla"}
              {!isPending && (
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
