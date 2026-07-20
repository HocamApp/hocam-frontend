"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Clock3, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils";
import type { TutorMatchResult, TutorTeachingStyle } from "@/types";
import { MATCH_EASING, MATCH_MOTION } from "./motion";

const STYLE_LABELS: Record<TutorTeachingStyle, string> = {
  foundations_patient: "sabırla temel anlatımı",
  question_speed: "soru ve hız odağı",
  planning_accountability: "plan ve takip yaklaşımı",
  motivating_communication: "güçlü iletişimi",
  high_target: "yüksek hedef yaklaşımı",
};

function reasonText(match: TutorMatchResult) {
  const reasons: string[] = [];
  if (match.matched_subjects.length) reasons.push(`${match.matched_subjects.join(", ")} ders uyumu`);
  if (match.reason_codes.includes("availability_match")) reasons.push("seçtiğin zamanlarda müsaitlik");
  if (match.matched_styles.length) reasons.push(match.matched_styles.map((style) => STYLE_LABELS[style]).join(", "));
  if (match.reason_codes.includes("budget_match")) reasons.push("bütçe uyumu");
  return reasons.join(" · ");
}

export function MatchResultCard({
  match,
  index,
}: {
  match: TutorMatchResult;
  index: number;
}) {
  const reducedMotion = useReducedMotion();
  const fullName = `${match.tutor.name} ${match.tutor.surname}`;
  const initials = `${match.tutor.name[0] ?? ""}${match.tutor.surname[0] ?? ""}`.toUpperCase();
  const nearest = match.nearest_available_at
    ? new Intl.DateTimeFormat("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(match.nearest_available_at))
    : null;

  return (
    <motion.article
      data-testid="matching-result-card"
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0.12 : MATCH_MOTION.resultCard,
        delay: reducedMotion ? 0 : index * 0.06,
        ease: MATCH_EASING.enter,
      }}
      whileHover={reducedMotion ? undefined : { y: -2 }}
      className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={match.tutor.profile_picture} alt={fullName} />
          <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 truncate text-lg font-bold">
            {fullName}
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" aria-label="Doğrulanmış hoca" />
          </h3>
          <p className="truncate text-sm text-neutral-500">{match.tutor.university} · {match.tutor.department}</p>
          <p className="mt-1 text-sm font-medium">
            {match.tutor.total_reviews
              ? `★ ${match.tutor.rating.toFixed(1)} · ${match.tutor.total_reviews} değerlendirme`
              : "Yeni hoca"}
          </p>
        </div>
      </div>

      <motion.div
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0.12 : MATCH_MOTION.message,
          delay: reducedMotion ? 0 : index * 0.06 + 0.08,
        }}
        className="mt-4 rounded-2xl bg-[#fff8f3] p-3"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#d94758]">Neden eşleştiniz?</p>
        <p className="mt-1 text-sm leading-6 text-neutral-700">{reasonText(match)}</p>
      </motion.div>

      {nearest ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
          <Clock3 className="h-4 w-4 text-emerald-600" /> En yakın uygun zaman: {nearest}
        </p>
      ) : null}

      {match.caveat_codes.length > 0 ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {match.caveat_codes.includes("budget_relaxed")
            ? "Bu öneri seçtiğin bütçe aralığının dışında."
            : "Seçtiğin zamanlarda yakın bir boşluk bulunamadı; diğer uyumlara göre önerildi."}
        </p>
      ) : null}

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <p>
          <span className="text-xl font-bold">{formatPrice(match.tutor.hourly_price)}</span>
          <span className="text-sm text-neutral-500"> /40 dk</span>
        </p>
        <Link
          href={`/tutors/${match.tutor.id}`}
          className="rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Profili incele
        </Link>
      </div>
    </motion.article>
  );
}
