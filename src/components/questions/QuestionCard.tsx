"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SolvableQuestion } from "@/types";

export function QuestionCard({
  question,
  returnTo,
}: {
  question: SolvableQuestion;
  returnTo: string;
}) {
  const href = `/cikmis-sorular/${question.id}?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <article className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{question.exam_type} {question.exam_year}</Badge>
        {question.subject && <Badge variant="outline">{question.subject.name}</Badge>}
      </div>
      <div className="mt-4 flex items-start gap-3">
        <BookOpenCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-6">
            {question.prompt}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            {question.topic?.title || question.source_book}
            {question.original_question_number
              ? ` · Soru ${question.original_question_number}`
              : ""}
          </p>
        </div>
      </div>
      <Button asChild variant="ghost" className="mt-auto self-end pt-5">
        <Link
          href={href}
          onClick={() => sessionStorage.setItem(`question-list-scroll:${returnTo}`, String(window.scrollY))}
        >
          Soruyu aç <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </article>
  );
}
