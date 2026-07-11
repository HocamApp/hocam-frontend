"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchQuestion } from "@/lib/questionsApi";
import { QuestionViewer } from "@/components/questions/QuestionViewer";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { Button } from "@/components/ui/button";

function QuestionDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const question = useQuery({
    queryKey: ["question", id],
    queryFn: () => fetchQuestion(id),
    enabled: Boolean(id),
  });
  const rawReturnTo = searchParams.get("returnTo") || "/cikmis-sorular";
  const returnTo = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo
    : "/cikmis-sorular";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Button variant="ghost" onClick={() => router.push(returnTo)} className="mb-5">
        <ArrowLeft className="mr-2 h-4 w-4" /> Listeye dön
      </Button>
      {question.isLoading && <div className="py-20"><LoadingSpinner /></div>}
      {question.isError && <ErrorMessage message="Soru yüklenemedi veya artık yayında değil." />}
      {question.data && <QuestionViewer question={question.data} />}
    </div>
  );
}

export default function QuestionDetailPage() {
  return (
    <RouteGuard requireAuth>
      <Suspense fallback={<div className="p-12"><LoadingSpinner /></div>}>
        <QuestionDetailContent />
      </Suspense>
    </RouteGuard>
  );
}
