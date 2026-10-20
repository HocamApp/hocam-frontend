"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ComplaintCard, ComplaintTone } from "@/lib/coachingStudentComplaints";

/**
 * The status of a complaint as a label. Filled when it says something to do or
 * something moving, plain text once it is over: a finished complaint should not
 * compete with one that waits for the student. On the ink head of the detail
 * the same states are drawn so that they read on dark.
 */
export function ComplaintStatusChip({
  label,
  tone,
  onInk = false,
}: {
  label: string;
  tone: ComplaintTone;
  onInk?: boolean;
}) {
  if (onInk) {
    return (
      <span
        className={`inline-flex shrink-0 rounded-pill px-3 py-0.5 text-[0.8125rem] font-medium ${
          tone === "attention" ? "bg-gold text-gold-ink" : "bg-paper text-ink"
        }`}
      >
        {label}
      </span>
    );
  }
  if (tone === "attention") return <Badge variant="pink">{label}</Badge>;
  if (tone === "waiting") return <Badge variant="gold">{label}</Badge>;
  if (tone === "working") return <Badge variant="default">{label}</Badge>;
  return <span className="shrink-0 text-small font-medium text-ink-mid">{label}</span>;
}

/**
 * The student's complaints, one card each. The ones that wait for the student
 * carry a pink frame and a solid gold way in; the others a plain link.
 */
export function StudentComplaintCards({ cards }: { cards: readonly ComplaintCard[] }) {
  return (
    <ul aria-label="Bildirimler" className="space-y-3">
      {cards.map((card) => (
        <li
          key={card.id}
          className={`rounded-card bg-surface p-5 ${card.needsStudent ? "border-2 border-pink" : "border border-line"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-body font-medium text-ink">{card.title}</h3>
              <p className="text-small tabular-nums text-ink-mid">{card.whenLabel}</p>
            </div>
            <ComplaintStatusChip label={card.statusLabel} tone={card.tone} />
          </div>
          <div className="mt-3">
            {card.needsStudent ? (
              <Button asChild size="sm" variant="gold" className="min-h-11">
                <Link href={card.href}>Bildirimi aç</Link>
              </Button>
            ) : (
              <Link
                href={card.href}
                className="inline-flex min-h-11 items-center text-small font-medium text-ink underline underline-offset-4"
              >
                Ayrıntıyı gör
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
