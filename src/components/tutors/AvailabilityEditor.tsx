"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAvailability,
  createAvailabilityRule,
  deleteAvailabilityRule,
} from "@/lib/dashboardApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { AvailabilityRule } from "@/types";

const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function formatTimeForInput(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

export function AvailabilityEditor() {
  const queryClient = useQueryClient();
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timeError, setTimeError] = useState<string | null>(null);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["availability"],
    queryFn: fetchAvailability,
  });

  const createMutation = useMutation({
    mutationFn: createAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      setStartTime("");
      setEndTime("");
      setTimeError(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAvailabilityRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });

  const handleAdd = () => {
    setTimeError(null);
    if (!startTime || !endTime) {
      setTimeError("Başlangıç ve bitiş saati girin");
      return;
    }
    const start = startTime.trim();
    const end = endTime.trim();
    if (start >= end) {
      setTimeError("Başlangıç saati bitiş saatinden önce olmalıdır");
      return;
    }
    createMutation.mutate({
      day_of_week: dayOfWeek,
      start_time: start.length === 5 ? start : start + ":00",
      end_time: end.length === 5 ? end : end + ":00",
    });
  };

  const groupedByDay = rules.reduce<Record<number, AvailabilityRule[]>>(
    (acc, rule) => {
      if (!acc[rule.day_of_week]) acc[rule.day_of_week] = [];
      acc[rule.day_of_week].push(rule);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Müsaitlik Saatleri</h2>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Henüz müsaitlik saati eklenmemiş
            </p>
          ) : (
            Object.keys(groupedByDay)
              .map(Number)
              .sort((a, b) => a - b)
              .map((day) => (
                <div key={day} className="space-y-1">
                  {groupedByDay[day].map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span>
                        {DAY_NAMES[rule.day_of_week]}{" "}
                        {formatTimeForInput(rule.start_time)}–
                        {formatTimeForInput(rule.end_time)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteMutation.mutate(rule.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))
          )}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Yeni Saat Ekle</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Gün</Label>
            <Select
              value={String(dayOfWeek)}
              onValueChange={(v) => setDayOfWeek(Number(v))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAY_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Başlangıç</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Bitiş</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={createMutation.isPending}
          >
            Ekle
          </Button>
        </div>
        {timeError && (
          <p className="text-sm text-destructive">{timeError}</p>
        )}
      </div>
    </div>
  );
}
