import type { Message } from "@/types";

import { istanbulDayKey } from "@/lib/bookingTime";

function sameDay(a: Date, b: Date): boolean {
  const aDay = istanbulDayKey(a);
  const bDay = istanbulDayKey(b);
  return aDay !== "" && aDay === bDay;
}

export function formatDaySeparator(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(
    Date.parse(`${istanbulDayKey(now)}T00:00:00Z`) - 86_400_000,
  );
  if (sameDay(date, now)) return "Bugün";
  if (sameDay(date, yesterday)) return "Dün";
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year:
      istanbulDayKey(date).slice(0, 4) === istanbulDayKey(now).slice(0, 4)
        ? undefined
        : "numeric",
    timeZone: "Europe/Istanbul",
  });
}

export type ThreadItem =
  | { kind: "separator"; key: string; label: string }
  | {
      kind: "message";
      message: Message;
      groupedWithPrev: boolean;
      showTime: boolean;
    };

export function buildThreadItems(messages: Message[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  for (let index = 0; index < messages.length; index += 1) {
    const current = messages[index];
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const currentDate = new Date(current.created_at);
    const startsNewDay =
      !previous || !sameDay(new Date(previous.created_at), currentDate);

    if (startsNewDay) {
      items.push({
        kind: "separator",
        key: `sep-${current.id}`,
        label: formatDaySeparator(current.created_at),
      });
    }

    const groupedWithPrev =
      !startsNewDay && !!previous && previous.sender === current.sender;
    const showTime =
      !next ||
      next.sender !== current.sender ||
      !sameDay(new Date(next.created_at), currentDate);
    items.push({
      kind: "message",
      message: current,
      groupedWithPrev,
      showTime,
    });
  }
  return items;
}
