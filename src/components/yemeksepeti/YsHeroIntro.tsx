"use client";

import { Student, Tag, Ticket } from "@phosphor-icons/react";
import type { ComponentType } from "react";

import { VerifiedMark } from "@/components/brand/marks";

import { MAX_TUTOR_YKS_RANK } from "./ysHomeFacts";

/**
 * The page's opening statement and the four things it has to get across
 * before anyone scrolls to a tutor.
 *
 * Header on the left, the four points on the right, on one row from `lg` up.
 * Two columns rather than a headline stacked over a four-across strip because
 * the four points are sentences, not labels — across the full width they read
 * as a row of columns to skim past, and next to the headline they read as its
 * argument. Below `lg` the points fall under the header, two up, then one.
 *
 * Deliberately not four uniform tiles: the second one, verification, is the
 * claim the whole product rests on, so it takes the gold surface and the rest
 * sit on hairline-bordered paper. That is also the rule gold follows
 * everywhere else here — it carries rank and the belge behind it, never
 * decoration.
 */

type Point = {
  /** Phosphor at its default regular weight, or one of our own marks. */
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  /** Exactly one point gets this. See the note above. */
  gold?: true;
};

const POINTS: Point[] = [
  {
    icon: Student,
    title: "Sınavda derece yapandan ders al",
    body: "Sınavı geçen yıl veren biri güncel formatı, soru trendlerini ve zaman yönetimini hâlâ hatırlıyor.",
  },
  {
    icon: VerifiedMark,
    title: "Her hoca doğrulanmış",
    // Both halves are enforced, not claimed: the three documents are the
    // TutorVerification fields, and the ceiling is checked in tutor/setup.
    body: `Profilde gördüğün sıralama beyan değil, belge. Ve ilk ${MAX_TUTOR_YKS_RANK} içinde.`,
    gold: true,
  },
  {
    icon: Tag,
    title: "Özel ders fiyatına değil, öğrenci fiyatına",
    body: "Üniversite öğrencileri yan gelir olarak yaptığı için ders ücreti piyasanın 3'te 1'i. Haftada 3 ders ailene yük olmaz.",
  },
  {
    icon: Ticket,
    title: "İlk ders ücretsiz",
    body: "İlk dersi ücretsiz dene. Hocanı ve tarzını beğenmezsen bırak, hiçbir şey ödemezsin.",
  },
];

export function YsHeroIntro() {
  return (
    <section className="pt-10 md:pt-16" aria-labelledby="ys-hero-title">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
        <div>
          <h1 id="ys-hero-title" className="text-h1-m md:text-h1">
            Dünün öğrencisi,
            <br />
            Bugünün öğretmeni
          </h1>
          <p className="mt-5 max-w-[42ch] text-body-l text-ink-mid">
            YKS&apos;de derece yapmış öğrencileri, derece yapacaklarla buluşturuyoruz.
          </p>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
          {/* One px of the `--line` background shows between cells, so the
              dividers are the gaps themselves rather than four sets of borders
              that would double up where they meet. */}
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <li
                key={point.title}
                className={
                  point.gold
                    ? "bg-gold p-6 text-gold-ink"
                    : "bg-paper p-6"
                }
              >
                <Icon className="size-6" />
                <h2 className="mt-4 text-h3-m md:text-h3">{point.title}</h2>
                <p
                  className={
                    point.gold
                      ? "mt-2 text-body text-gold-ink/80"
                      : "mt-2 text-body text-ink-mid"
                  }
                >
                  {point.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
