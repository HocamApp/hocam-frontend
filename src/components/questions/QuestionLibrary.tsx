"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { fetchQuestionMetadata, fetchQuestions } from "@/lib/questionsApi";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SlidingPagination from "@/components/ui/sliding-pagination";
import type { QuestionFilters } from "@/types";

const FILTER_KEYS = ["exam_type", "year", "subject", "topic", "difficulty"] as const;

export function QuestionLibrary({ wrongOnly = false }: { wrongOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const filters = useMemo<QuestionFilters>(() => {
    const next: QuestionFilters = { page };
    FILTER_KEYS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) next[key] = value;
    });
    return next;
  }, [page, searchParams]);

  const metadata = useQuery({
    queryKey: ["question-metadata"],
    queryFn: fetchQuestionMetadata,
  });
  const questions = useQuery({
    queryKey: [wrongOnly ? "wrong-questions" : "questions", filters],
    queryFn: () => fetchQuestions(filters, wrongOnly),
  });

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === "exam_type") {
      params.delete("subject");
      params.delete("topic");
    }
    if (key === "subject") params.delete("topic");
    if (key !== "page") params.delete("page");
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  const data = questions.data;
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / 12));
  const selectedSubject = metadata.data?.subjects.find(
    (item) => item.id === filters.subject
  );
  const visibleTopics = (metadata.data?.topics || []).filter(
    (item) =>
      (!filters.exam_type || item.exam_type === filters.exam_type) &&
      (!selectedSubject || item.subject_name === selectedSubject.name)
  );

  useEffect(() => {
    if (!questions.data) return;
    const key = `question-list-scroll:${returnTo}`;
    const saved = sessionStorage.getItem(key);
    if (!saved) return;
    sessionStorage.removeItem(key);
    window.requestAnimationFrame(() => window.scrollTo({ top: Number(saved), behavior: "auto" }));
  }, [questions.data, returnTo]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="text-sm font-medium text-primary">MEBİ kaynaklı YKS arşivi</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {wrongOnly ? "Yanlış Sorularım" : "Çıkmış Sorular"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {wrongOnly
            ? "Yanlış cevapladığın soruları yeniden çöz. Doğru yaptığında aktif tekrar havuzundan çıkar."
            : "TYT, AYT ve YDT sorularını yıl, ders ve konuya göre filtreleyerek çalış."}
        </p>
      </div>

      {metadata.data && !metadata.data.enabled ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Soru kütüphanesi devre dışı
          </div>
          <p className="mt-2">
            Kütüphane altyapısı yönetici tarafından yeniden açıldığında burada sorular görünecek.
          </p>
        </div>
      ) : (
        <>
          {metadata.data && !metadata.data.mebi_enabled && !wrongOnly && (
            <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
              MEBİ içerikleri izin süreci tamamlanana kadar kapalıdır. Bu aşamada yalnızca
              HOCAM&apos;ın özgün geliştirme içerikleri gösterilir.
            </div>
          )}
          <div className="mb-7 grid gap-3 rounded-2xl border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <FilterSelect label="Sınav" value={filters.exam_type || ""} onChange={(v) => setParam("exam_type", v)}>
              {(metadata.data?.exam_types || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </FilterSelect>
            <FilterSelect label="Yıl" value={filters.year || ""} onChange={(v) => setParam("year", v)}>
              {(metadata.data?.years || []).map((value) => <option key={value} value={value}>{value}</option>)}
            </FilterSelect>
            <FilterSelect label="Ders" value={filters.subject || ""} onChange={(v) => setParam("subject", v)}>
              {(metadata.data?.subjects || [])
                .filter((item) => !filters.exam_type || item.exam_type === filters.exam_type)
                .map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect label="Konu" value={filters.topic || ""} onChange={(v) => setParam("topic", v)}>
              {visibleTopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </FilterSelect>
            <FilterSelect label="Zorluk" value={filters.difficulty || ""} onChange={(v) => setParam("difficulty", v)}>
              {(metadata.data?.difficulties || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </FilterSelect>
            {FILTER_KEYS.some((key) => Boolean(filters[key])) && (
              <Button variant="ghost" onClick={() => router.replace(pathname)} className="sm:col-span-2 lg:col-span-5 lg:justify-self-start">
                <RotateCcw className="mr-2 h-4 w-4" /> Filtreleri temizle
              </Button>
            )}
          </div>

          {questions.isError && <ErrorMessage message="Sorular yüklenemedi. Lütfen tekrar dene." />}
          {questions.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}
            </div>
          ) : data?.results.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.results.map((question) => (
                  <QuestionCard key={question.id} question={question} returnTo={returnTo} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <SlidingPagination totalPages={totalPages} currentPage={page} onPageChange={(value) => setParam("page", String(value))} />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={wrongOnly ? "Tekrar bekleyen soru yok" : "Bu filtrelerde soru yok"}
              description={wrongOnly ? "Yanlış cevapladığın sorular burada görünecek." : "Filtreleri değiştirerek başka sorulara göz atabilirsin."}
            />
          )}
        </>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-xs font-medium">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
      >
        <option value="">Tümü</option>
        {children}
      </select>
    </label>
  );
}
