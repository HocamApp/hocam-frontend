"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { trackHocaBul } from "@/lib/hocaBulAnalytics";
import { hashAnswers } from "@/lib/hocaBulPreviewCache";
import { buildResultEditHref, splitMatches } from "@/lib/hocaBulResults";
import type { MatchingAnswers, MatchingPreview } from "@/types";

import { HocaBulResultCard } from "./HocaBulResultCard";
import { useDiscoveryExposures } from "@/hooks/useDiscoveryExposures";
import { HiddenTutorControls } from "./HiddenTutorControls";
import { fetchRecommendationControls } from "@/lib/matchingApi";

interface HocaBulResultsViewProps {
  preview: MatchingPreview;
  answers: MatchingAnswers;
}

const actionClass = "inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function HocaBulResultsView({ preview, answers }: HocaBulResultsViewProps) {
  const { favoriteIds, toggle, isFavoritePending } = useFavorites();
  const [hiddenTutorIds, setHiddenTutorIds] = useState<Set<string>>(() => new Set());
  const controlsQuery = useQuery({ queryKey: ["recommendation-controls"], queryFn: fetchRecommendationControls });
  const persistedHiddenIds = new Set((controlsQuery.data ?? []).filter((item) => item.hidden).map((item) => item.tutor));
  const isHidden = (tutorId: string) => hiddenTutorIds.has(tutorId) || persistedHiddenIds.has(tutorId);
  const visibleMatches = preview.matches.filter((item) => !isHidden(item.tutor.id));
  const { strong, relaxed } = splitMatches(visibleMatches);
  const unavailable = preview.unavailable_match && !isHidden(preview.unavailable_match.tutor.id)
    ? preview.unavailable_match : null;
  const trackedHashes = useRef(new Set<string>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const payloadHash = hashAnswers(answers);
  useDiscoveryExposures(preview.discovery_impression_id);

  useEffect(() => {
    if (trackedHashes.current.has(payloadHash)) return;
    trackedHashes.current.add(payloadHash);
    trackHocaBul({
      event: "hoca_bul_results_viewed",
      match_count: preview.matches.length,
      candidate_count: preview.candidate_count,
      has_relaxed: relaxed.length > 0,
    });
    if (preview.matches.length === 0) {
      trackHocaBul({ event: "hoca_bul_no_results", goal: answers.goal });
    }
  }, [answers.goal, payloadHash, preview.candidate_count, preview.matches.length, relaxed.length]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [payloadHash]);

  const ordered = [...strong, ...relaxed];
  const positions = new Map(ordered.map((match, index) => [match.tutor.id, index + 1]));

  function card(match: (typeof ordered)[number]) {
    return (
      <HocaBulResultCard
        key={match.tutor.id}
        match={match}
        position={positions.get(match.tutor.id) ?? 1}
        isFavorite={favoriteIds.has(match.tutor.id)}
        favoritePending={isFavoritePending(match.tutor.id)}
        onToggleFavorite={toggle}
        discoveryImpressionId={preview.discovery_impression_id}
        onHidden={(tutorId) => setHiddenTutorIds((current) => new Set(current).add(tutorId))}
      />
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.18em] text-primary">EŞLEŞMEN HAZIR</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-3xl font-bold tracking-tight text-foreground outline-none sm:text-4xl">Sana uygun hocalar</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Bu öneriler yalnızca verdiğin yanıtlara ve hocaların gerçek profil, fiyat ve müsaitlik bilgilerine dayanıyor.
          </p>
          <Button asChild variant="outline" className="mt-5 min-h-11 px-4">
            <Link href={buildResultEditHref("kontrol")}>Tercihlerimi düzenle</Link>
          </Button>
          <HiddenTutorControls />
        </header>

        {visibleMatches.length === 0 && !unavailable ? (
          <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-10" aria-labelledby="no-results-heading">
            <h2 id="no-results-heading" tabIndex={-1} className="text-2xl font-bold text-foreground">Şu an tam uyan bir hoca bulamadık</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Tercihlerinden birini genişletirsen eşleşme şansın artar.</p>
            <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
              <Link href={buildResultEditHref("butce")} className={actionClass}>Bütçemi genişlet</Link>
              <Link href={buildResultEditHref("uygun_zamanlar")} className={actionClass}>Farklı saatler seçeyim</Link>
              <Link href={buildResultEditHref("dersler")} className={actionClass}>Ders seçimimi değiştir</Link>
              <Link href="/tutors" onClick={() => trackHocaBul({ event: "hoca_bul_all_tutors_clicked", candidate_count: preview.candidate_count })} className={actionClass}>Tüm hocaları gör</Link>
            </div>
          </section>
        ) : (
          <div className="mt-10 space-y-5">
            {strong.map(card)}
            {relaxed.length > 0 && (
              <h2 className="py-4 text-lg font-semibold text-foreground" aria-label="Tercihlerine tam uymayan ama yakın öneriler">
                Tercihlerine tam uymayan ama yakın öneriler
              </h2>
            )}
            {relaxed.map(card)}
            {unavailable && (
              <section className="pt-6" aria-labelledby="unavailable-match-heading">
                <h2 id="unavailable-match-heading" className="text-lg font-semibold">Çok iyi eşleşiyor, ancak şu anda müsait değil</h2>
                <p className="mb-4 mt-1 text-sm text-muted-foreground">Bu hoca ders, bütçe ve anlatım tercihlerine güçlü biçimde uyuyor; şu anda rezervasyona açık olmadığı için normal önerilere eklenmedi.</p>
                {card(unavailable)}
              </section>
            )}
            <div className="pt-4 text-center">
              <Link href="/tutors" onClick={() => trackHocaBul({ event: "hoca_bul_all_tutors_clicked", candidate_count: preview.candidate_count })} className={actionClass}>Tüm hocaları gör</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
