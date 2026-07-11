"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  fetchAvailability,
  createAvailabilityRule,
  deleteAvailabilityRule,
} from "@/lib/dashboardApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/components/ui/time-select";

function formatRuleTime(t: string | null): string {
  if (!t) return "";
  return t.slice(0, 5);
}

interface DayAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number;
  date: string;
  dayLabel: string;
}

export function DayAvailabilityDialog({
  open,
  onOpenChange,
  dayOfWeek,
  date,
  dayLabel,
}: DayAvailabilityDialogProps) {
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);

  const { data: rules = [] } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
    enabled: open,
  });

  const dateRules = rules.filter((r) => r.specific_date === date);
  const isClosed = dateRules.some((rule) => rule.is_unavailable);
  const dayRules = (dateRules.length > 0
    ? dateRules
    : rules.filter((r) => !r.specific_date && r.day_of_week === dayOfWeek))
    .filter((rule) => !rule.is_unavailable)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const createMutation = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      setStartTime("");
      setEndTime("");
      setTimeError(null);
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      toast.error("Müsaitlik güncellenemedi.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      toast.success("Müsaitlik güncellendi.");
    },
    onError: () => {
      toast.error("Müsaitlik güncellenemedi.");
    },
  });

  const isMutating = createMutation.isPending || deleteMutation.isPending;

  const handleAdd = () => {
    setTimeError(null);
    if (!startTime || !endTime) {
      setTimeError("Başlangıç ve bitiş saati seçin");
      return;
    }
    if (startTime >= endTime) {
      setTimeError("Başlangıç saati bitiş saatinden önce olmalıdır");
      return;
    }
    createMutation.mutate({
      day_of_week: dayOfWeek,
      specific_date: date,
      start_time: startTime.length === 5 ? startTime : startTime + ":00",
      end_time: endTime.length === 5 ? endTime : endTime + ":00",
    });
  };

  const handleCloseDay = () => {
    createMutation.mutate({ day_of_week: dayOfWeek, specific_date: date, is_unavailable: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dayLabel} Müsaitliği</DialogTitle>
          <DialogDescription>
            Değişiklikler yalnızca seçtiğin tarih için geçerlidir; diğer haftaların
            düzenli müsaitliğini değiştirmez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isClosed && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">Bu gün kapalı.</p>}
          {dayRules.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Bu gün için henüz müsaitlik saati eklenmemiş.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {dayRules.map((rule) => {
                const start = formatRuleTime(rule.start_time);
                const end = formatRuleTime(rule.end_time);
                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1.5 text-sm"
                  >
                    <span className="font-medium tabular-nums">
                      {start}–{end}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      disabled={isMutating}
                      aria-label={`${dayLabel} ${start}–${end} saatini sil`}
                      className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Yeni saat ekle</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Başlangıç</Label>
                <TimeSelect
                  value={startTime}
                  onChange={setStartTime}
                  disabled={isMutating}
                  className="w-[130px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bitiş</Label>
                <TimeSelect
                  value={endTime}
                  onChange={setEndTime}
                  disabled={isMutating}
                  className="w-[130px]"
                />
              </div>
              <Button type="button" onClick={handleAdd} disabled={isMutating}>
                Ekle
              </Button>
            </div>
            {timeError && <p className="text-sm text-destructive">{timeError}</p>}
            {!isClosed && <Button type="button" variant="outline" className="border-destructive/40 text-destructive" onClick={handleCloseDay} disabled={isMutating}>Bu günü kapat</Button>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
