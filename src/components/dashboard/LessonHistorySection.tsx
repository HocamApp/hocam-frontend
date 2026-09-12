"use client";

import { useMemo, useState } from "react";
import { BookOpenText, FolderOpen, MagnifyingGlass } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParticipantAvatar } from "@/components/messaging/ParticipantAvatar";
import { bookingDateLabel, bookingInstant } from "@/lib/bookingTime";
import type { Booking } from "@/types";

const PAGE_SIZE = 5;
// Below this a search box is furniture: you can see every row at once.
const SEARCH_THRESHOLD = 6;

function tutorName(booking: Booking): string {
  return booking.tutor.name
    ? `${booking.tutor.name} ${booking.tutor.surname}`.trim()
    : "Eğitmen bilgisi bekleniyor";
}

function monthLabel(value: string): string {
  return new Date(bookingInstant(value)).toLocaleDateString("tr-TR", {
    timeZone: "Europe/Istanbul",
    month: "long",
    year: "numeric",
  });
}

/**
 * Every finished lesson, not the last three.
 *
 * The dashboard used to show a fixed slice of three and link to the lessons
 * workspace for the rest. That workspace is gone, so a student's fourth-oldest
 * lesson has to be reachable from here or from nowhere. Search and the subject
 * filter come with it, but only once the list is long enough for them to be
 * worth the space.
 */
export function LessonHistorySection({
  bookings,
  onOpenMaterials,
}: {
  bookings: Booking[];
  onOpenMaterials: (booking: Booking) => void;
}) {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const subjects = useMemo(
    () =>
      Array.from(
        new Map(bookings.map((item) => [item.subject.id, item.subject])).values(),
      ),
    [bookings],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return bookings.filter((booking) => {
      if (subject !== "all" && booking.subject.id !== subject) return false;
      if (!normalized) return true;
      const haystack =
        `${booking.subject.name} ${tutorName(booking)}`.toLocaleLowerCase("tr-TR");
      return haystack.includes(normalized);
    });
  }, [bookings, query, subject]);

  const visible = filtered.slice(0, visibleCount);
  const showControls = bookings.length >= SEARCH_THRESHOLD;

  return (
    <section
      aria-labelledby="lesson-history-title"
      className="rounded-card border border-line bg-surface p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="lesson-history-title" className="text-h3-m text-ink md:text-h3">
            Geçmiş derslerin
          </h2>
          <p className="mt-1 text-small text-ink-mid">
            Notlarına, dosyalarına ve çözülen sorulara dön.
          </p>
        </div>
        <span className="shrink-0 text-small tabular-nums text-ink-mid">
          {bookings.length} ders
        </span>
      </div>

      {showControls && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mid"
              weight="regular"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Ders veya hoca ara"
              aria-label="Geçmiş derslerde ara"
              className="pl-9"
            />
          </div>
          <Select
            value={subject}
            onValueChange={(value) => {
              setSubject(value);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="sm:w-56" aria-label="Derse göre filtrele">
              <SelectValue placeholder="Tüm dersler" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm dersler</SelectItem>
              {subjects.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {visible.length > 0 ? (
        <>
          <ol className="mt-4 divide-y divide-line border-t border-line">
            {visible.map((booking, index) => {
              const month = monthLabel(booking.start_time);
              const isNewMonth =
                index === 0 || monthLabel(visible[index - 1].start_time) !== month;
              return (
                <li key={booking.id}>
                  {isNewMonth && (
                    <p className="pt-4 text-label capitalize text-ink-mid">{month}</p>
                  )}
                  <div className="flex items-center gap-3 py-4">
                    <ParticipantAvatar
                      name={tutorName(booking)}
                      avatarUrl={booking.tutor.profile_picture}
                      className="h-10 w-10 shrink-0 border border-line"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-medium text-ink">
                        {booking.subject.name}
                      </p>
                      <p className="mt-0.5 truncate text-small text-ink-mid">
                        {tutorName(booking)} · {bookingDateLabel(booking.start_time)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onOpenMaterials(booking)}
                    >
                      <FolderOpen
                        className="mr-1.5 size-4"
                        weight="regular"
                        aria-hidden="true"
                      />
                      İçeriği aç
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          {filtered.length > visible.length && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              {filtered.length - visible.length} ders daha göster
            </Button>
          )}
        </>
      ) : (
        <div className="mt-6 flex items-center gap-3 border-y border-line py-4 text-small text-ink-mid">
          <BookOpenText className="size-5 shrink-0" weight="regular" aria-hidden="true" />
          {bookings.length === 0
            ? "Tamamladığın derslerin içerikleri burada birikecek."
            : "Bu aramayla eşleşen ders yok."}
        </div>
      )}
    </section>
  );
}
