"use client";

import type { ReactNode } from "react";
import { CalendarBlank, Clock, VideoCamera } from "@phosphor-icons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

export interface SlotPickerTutor {
  id: string;
  name: string;
  surname: string;
  university?: string | null;
  profile_picture?: string | null;
}

interface SlotPickerFrameProps {
  tutor: SlotPickerTutor;
  durationMinutes: number;
  subjects?: Subject[];
  selectedSubjectId?: string;
  onSubjectChange?: (subjectId: string) => void;
  /** What this costs the student: a price, a package credit, a trial. */
  priceLabel: string;
  /** One line under the meta list. */
  note?: string;
  /** Small caps line above the tutor. */
  eyebrow?: string;
  /** The calendar half. */
  children: ReactNode;
}

function initials(name: string, surname: string): string {
  return ((name?.trim()[0] ?? "") + (surname?.trim()[0] ?? "")).toUpperCase() || "?";
}

/**
 * The panel around the package schedule picker: who the lesson is with and
 * what it costs on the left, the calendar on the right.
 *
 * It used to wrap the single-lesson picker too. That one dropped it: a free
 * twenty-minute trial does not need a university, a lesson length, "video
 * call" and a price of zero arranged around one small decision, and the
 * booking dialog now says all of that in a sentence. Buying a three-month
 * package is a large enough commitment to be worth the framing, so it keeps
 * it here.
 */
export function SlotPickerFrame({
  tutor,
  durationMinutes,
  subjects,
  selectedSubjectId,
  onSubjectChange,
  priceLabel,
  note,
  eyebrow,
  children,
}: SlotPickerFrameProps) {
  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-5">
        {eyebrow && (
          <p className="text-label uppercase tracking-[0.08em] text-pink">{eyebrow}</p>
        )}

        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarImage
              src={tutor.profile_picture || undefined}
              alt={`${tutor.name} ${tutor.surname}`}
            />
            <AvatarFallback className="bg-ink text-white">
              {initials(tutor.name, tutor.surname)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {tutor.name} {tutor.surname}
            </p>
            {tutor.university && (
              <p className="truncate text-[0.8125rem] text-ink-mid">{tutor.university}</p>
            )}
          </div>
        </div>

        {subjects && subjects.length > 0 && (
          <div className="min-w-0">
            <p className="text-label text-ink-mid">Ders konusu</p>
            {/* Stacked full-width rather than wrapped pills: a subject name
                here can run to a dozen words ("AYT İleri Düzey Kalkülüs ve
                Diferansiyel Denklemler..."), and as a pill that either
                overflows the column or wraps into an unreadable block. */}
            <div className="mt-2 flex flex-col gap-2">
              {subjects.map((subject) => {
                const active = String(subject.id) === selectedSubjectId;
                return (
                  <button
                    key={String(subject.id)}
                    type="button"
                    aria-pressed={active}
                    title={`${subject.name} ${subject.exam_type}`}
                    onClick={() => onSubjectChange?.(String(subject.id))}
                    className={cn(
                      "flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-input border px-3 py-2 text-left text-[0.8125rem] transition-colors duration-[120ms]",
                      active
                        ? "border-ink bg-ink text-white"
                        : "border-line text-ink hover:border-ink"
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-[0.6875rem]",
                        active ? "text-white/70" : "text-ink-mid"
                      )}
                    >
                      {subject.exam_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <dl className="space-y-2.5 text-[0.875rem] text-ink">
          <MetaRow icon={<Clock size={16} weight="regular" />} label={`${durationMinutes} dakika`} />
          <MetaRow icon={<VideoCamera size={16} weight="regular" />} label="Görüntülü ders" />
          <MetaRow icon={<CalendarBlank size={16} weight="regular" />} label={priceLabel} />
        </dl>

        {note && <p className="text-[0.8125rem] leading-relaxed text-ink-mid">{note}</p>}
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function MetaRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-ink-mid" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </div>
  );
}

export function SlotStripSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="mt-3 flex gap-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="h-[4.25rem] w-[4.5rem] shrink-0 animate-pulse rounded-input bg-skeleton"
        />
      ))}
    </div>
  );
}
